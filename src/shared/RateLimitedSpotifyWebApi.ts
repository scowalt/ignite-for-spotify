import SpotifyWebApi from "spotify-web-api-node";
import PromiseQueue from "p-queue";
import { Logger } from "./Logger";
import { Song } from "../db/models/Song";

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
			interval: 1000,
			intervalCap: 10
		});

		this.spotify = new SpotifyWebApi({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
			redirectUri
		});
		this.spotify.setAccessToken(accessToken);
		this.spotify.setRefreshToken(refreshToken);
	}

	public searchTracks(searchQuery: string) {
		Logger.getInstance().debug(`RateLimitedSpotifyWebApi.serachTracks(${searchQuery}) [Queue pending promises: ${this.queue.pending}]`);
		return this.queue.add(() => {
			Logger.getInstance().debug(`Calling this.spotify.searchTracks(${searchQuery})`);
			return this.spotify.searchTracks(searchQuery).then((value) => {
				Logger.getInstance().debug(`this.spotify.searchTracks(${searchQuery}) SUCCEEDED`);
				return Promise.resolve(value.body.tracks);
			}).catch((reason: any) => {
				Logger.getInstance().debug(`this.spotify.searchTracks(${searchQuery}) FAILED with reason ${JSON.stringify(reason)}`);
				return Promise.reject(reason);
			});
		});
	}

	public async createPlaylist(id: number): Promise<string> {
		const userProfile = await this.queue.add(() => { return this.spotify.getMe(); });
		const createPlaylistResponse = await this.queue.add(() => {
			return this.spotify.createPlaylist(userProfile.body.id, `Rocksmith (C)DLC (part ${id}/?)`, {
				public: false, // Start the playlist private, manually make public later
				collaborative: false,
				description: `Rocksmith and Rocksmith 2014 DLC and CDLC. Mirrors the database found at CustomsForge Ignition.`
			});
		});
		return createPlaylistResponse.body.id;
	}

	public async getPlaylistTracks(playlistId: string, offset: number, limit: number) {
		return this.queue.add(() => {
			return this.spotify.getPlaylistTracks(playlistId, {
				offset,
				limit
			});
		});
	}

	public async addSongsToPlaylist(playlistId: string, songs: Song[], position: number) {
		return this.queue.add(() => {
			return this.spotify.addTracksToPlaylist(playlistId, songs.map((song: Song) => { return `spotify:track:${song.spotifyTrackId}`; }), { position });
		});
	}

	public async removePlaylistTracksAtPosition(playlistId: string, playlistOffset: number, count: number) {
		return this.queue.add(async () => {
			const playlistResponse = await this.spotify.getPlaylist(playlistId);
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
		}).catch((reason) => {
			Logger.getInstance().error(`Spotify API error ${reason.toString}`);
			return Promise.reject(reason);
		});
	}

	private init(): Promise<any> {
		return this.updateAccessToken();
	}

	private updateAccessToken(): Promise<void> {
		return this.spotify.refreshAccessToken().then((value) => {
			this.spotify.setAccessToken(value.body.access_token);
			return Promise.resolve();
		});
	}
}