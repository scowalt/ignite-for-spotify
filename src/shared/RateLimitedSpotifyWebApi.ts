import SpotifyWebApi from "spotify-web-api-node";
import PromiseQueue from "p-queue";
import { Logger } from "./Logger";

export class RateLimitedSpotifyWebApi {
	public static async getInstance(accessToken: string, refreshToken: string, redirectUri: string): Promise<RateLimitedSpotifyWebApi> {
		if (!RateLimitedSpotifyWebApi.instance) {
			RateLimitedSpotifyWebApi.instance = new RateLimitedSpotifyWebApi(accessToken, refreshToken, redirectUri);
			await RateLimitedSpotifyWebApi.instance.init();
		}

		return Promise.resolve(RateLimitedSpotifyWebApi.instance);
	}
	private static instance: RateLimitedSpotifyWebApi;

	private spotify!: SpotifyWebApi;
	private queue: PromiseQueue;

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
		return this.queue.add(() => {
			return this.spotify.searchTracks(searchQuery).then((value) => {
				return Promise.resolve(value.body.tracks);
			});
		});
	}

	public async createPlaylist(id: number): Promise<string> {
		const userProfile = await this.queue.add(() => { return this.spotify.getMe(); });
		const createPlaylistResponse = await this.queue.add(() => {
			return this.spotify.createPlaylist(userProfile.body.id, `Test ${id}`);
		});
		return createPlaylistResponse.body.id;
	}

	private init(): Promise<any> {
		return this.updateAccessToken();
	}

	private updateAccessToken(): Promise<void> {
		Logger.getInstance().info(`updateAccessToken()`);
		return this.spotify.refreshAccessToken().then((value) => {
			this.spotify.setAccessToken(value.body.access_token);
			return Promise.resolve();
		});
	}
}