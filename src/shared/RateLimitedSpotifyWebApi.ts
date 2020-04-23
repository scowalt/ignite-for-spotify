import SpotifyWebApi from "spotify-web-api-node";
import PromiseQueue from "p-queue";
import { Logger } from "./Logger";
import { Song } from "../db/models/Song";
import { RefreshAccessTokenResponse } from "../../lib/@types/spotify-web-api-node";
import { Query } from "./Query";
import { promisify } from 'util';

const wait: (ms: number) => Promise<void> = promisify(setTimeout);

export class RateLimitedSpotifyWebApi {
	public static async getInstance(accessToken: string, refreshToken: string, redirectUri: string): Promise<RateLimitedSpotifyWebApi> {
		if (!RateLimitedSpotifyWebApi.instance) {
			RateLimitedSpotifyWebApi.instance = new RateLimitedSpotifyWebApi(accessToken, refreshToken, redirectUri);
			await RateLimitedSpotifyWebApi.instance.init();
		}

		return Promise.resolve(RateLimitedSpotifyWebApi.instance);
	}
	private static instance: RateLimitedSpotifyWebApi;

	private readonly spotify!: SpotifyWebApi;
	private readonly queue: PromiseQueue;

	private constructor(accessToken: string, refreshToken: string, redirectUri: string) {
		this.queue = new PromiseQueue({
			concurrency: 5,
			interval: 1 * 1000, // one second
			// Spotify doesn't prescribe how many requests are allowed per second. In my testing, I've found that 10/s is too many.
			intervalCap: 8
		});

		this.spotify = new SpotifyWebApi({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
			redirectUri
		});
		this.spotify.setAccessToken(accessToken);
		this.spotify.setRefreshToken(refreshToken);
	}

	public searchTracks(searchQuery: Query): Promise<SpotifyApi.PagingObject<SpotifyApi.TrackObjectFull> | undefined> {
		Logger.getInstance().debug(`RateLimitedSpotifyWebApi.serachTracks("${searchQuery.toString()}") [Queue pending promises: ${this.queue.pending}]`);
		return this.enqueue(() => {
			Logger.getInstance().debug(`Calling this.spotify.searchTracks("${searchQuery.toString()}")`);
			return this.spotify.searchTracks(searchQuery.toString()).then((value: SpotifyWebApi.Response<SpotifyApi.SearchResponse>) => {
				Logger.getInstance().debug(`this.spotify.searchTracks("${searchQuery}") SUCCEEDED`);
				return Promise.resolve(value.body.tracks);
			});
		});
	}

	public async createPlaylist(id: number): Promise<string> {
		const userProfile: SpotifyWebApi.Response<SpotifyApi.CurrentUsersProfileResponse> = await this.enqueue(() => { return this.spotify.getMe(); });
		const createPlaylistResponse: SpotifyWebApi.Response<SpotifyApi.CreatePlaylistResponse> = await this.enqueue(() => {
			return this.spotify.createPlaylist(userProfile.body.id, `Rocksmith (C)DLC (part ${id}/?)`, {
				public: false, // Start the playlist private, manually make public later
				collaborative: false,
				description: `Rocksmith and Rocksmith 2014 DLC and CDLC. Mirrors the database found at CustomsForge Ignition.`
			});
		});
		return createPlaylistResponse.body.id;
	}

	public async getPlaylistTracks(playlistId: string, offset: number, limit: number): Promise<SpotifyWebApi.Response<SpotifyApi.PlaylistTrackResponse>> {
		return this.enqueue(() => {
			return this.spotify.getPlaylistTracks(playlistId, {
				offset,
				limit
			});
		});
	}

	public async addSongsToPlaylist(playlistId: string, songs: Song[], position: number): Promise<SpotifyWebApi.Response<SpotifyApi.AddTracksToPlaylistResponse>> {
		return this.enqueue(() => {
			return this.spotify.addTracksToPlaylist(playlistId, songs.map((song: Song) => { return `spotify:track:${song.spotifyTrackId}`; }), { position });
		});
	}

	public async removePlaylistTracksAtPosition(playlistId: string, playlistOffset: number, count: number): Promise<SpotifyWebApi.Response<SpotifyApi.RemoveTracksFromPlaylistResponse>> {
		return this.enqueue(async () => {
			const playlistResponse: SpotifyWebApi.Response<SpotifyApi.SinglePlaylistResponse> = await this.spotify.getPlaylist(playlistId);
			const positions: number[] = [];
			const limit: number = Math.min(playlistOffset + count, playlistResponse.body.tracks.total);
			for (let position: number = playlistOffset; position < limit; position++) {
				positions.push(position);
			}
			if (positions.length !== 0) {
				return this.spotify.removeTracksFromPlaylistByPosition(playlistId, positions, playlistResponse.body.snapshot_id);
			} else {
				return Promise.resolve(playlistResponse);
			}
		}).catch((reason: any) => {
			Logger.getInstance().error(`Spotify API error ${reason.toString}`);
			return Promise.reject(reason);
		});
	}

	private init(): Promise<any> {
		return this.updateAccessToken();
	}

	private updateAccessToken(): Promise<void> {
		return this.spotify.refreshAccessToken().then((value: SpotifyWebApi.Response<RefreshAccessTokenResponse>) => {
			this.spotify.setAccessToken(value.body.access_token);
			return Promise.resolve();
		});
	}

	private enqueue<T>(task: () => Promise<T>): Promise<T> {
		return this.queue.add(task).catch((reason: any) => {
			Logger.getInstance().error(`Spotify API error ${JSON.stringify(reason)}`);
			let restartCondition: Promise<void>|undefined;
			if (reason && reason.name === "WebapiError" && reason.statusCode === 401 && reason.message === "Unauthorized") {
				// This action likely failed because the access token expired. Pause execution of tasks in the queue while
				// the auth token updates to avoid other failures. Retry this task, since it likely only failed due to the
				// expired token, and return the new result;
				restartCondition = this.updateAccessToken();
			}else if (reason && reason.name === `WebapiError` && reason.statusCode === 429 && reason.message === "Too Many Requests") {
				// The Spotify API returns a "Retry-After" header that prescribes the exact amount of time that should pass before more requests are sent.
				// Unfortunately, this information isn't exposed by the spotify api wrapper. So, for now, just wait a constant amount of seconds.
				// See https://stackoverflow.com/a/30557896/1222411
				restartCondition = wait(4*1000);
			}

			if (restartCondition) {
				this.queue.pause();
				return restartCondition.then(() => {
					this.queue.start();
					return task();
				});
			}

			// If the failure was anything else, no need to catch it here.
			return Promise.reject(reason);
		});
	}
}