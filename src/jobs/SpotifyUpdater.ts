import PromiseQueue from 'p-queue';
import SpotifyWebApi from 'spotify-web-api-node';
import { Database, IgnitionTrackInfo } from './Database';

export class SpotifyUpdater {
	static singleton: SpotifyUpdater;
	static update = (accessToken: string, refreshToken: string, redirectUri: string) => {
		return new Promise<void>((resolve, reject) => {
			// HACK there is a race condition here without a semaphore (maybe)
			if (SpotifyUpdater.singleton) {
				return reject("SpotifyUpdater already running");
			}

			SpotifyUpdater.singleton = new SpotifyUpdater(accessToken, refreshToken, redirectUri);
			return SpotifyUpdater.singleton.initAndStart();
		});
	}

	private spotify: SpotifyWebApi;
	private spotifyRequestQueue: PromiseQueue;
	private db: Database|undefined;

	private constructor(accessToken: string, refreshToken: string, redirectUri: string) {
		this.spotify = new SpotifyWebApi({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
			redirectUri
		});
		this.spotify.setAccessToken(accessToken);
		this.spotify.setRefreshToken(refreshToken);


		this.spotifyRequestQueue = new PromiseQueue({
			concurrency: 1,
			interval: 1000,
			intervalCap: 10
		});
	}

	private async initAndStart() {
		return Database.getInstance().then((database: Database) => {
			this.db = database;

			// TODO need to query the database once to figure out how many songs there will be, then construct promises based off of that and fire them away
			return this.updateAccessToken()
						.then(this.doEverything.bind(this));
		});
	}

	private updateAccessToken() {
		return this.spotify.refreshAccessToken().then((value) => {
			this.spotify.setAccessToken(value.body.access_token);
			return Promise.resolve();
		});
	}

	private doEverything() {
		return this.db!.getSongsThatNeedSpotifyTrackId((track: IgnitionTrackInfo) => {
			return this.spotify.searchTracks(`artist:${track.artist} ${track.title}`).then((value) => {
				if (!value.body.tracks || value.body.tracks.total === 0) {
					return Promise.reject("Track not found");
				} else {
					// Spotify track found, add it to the database
					return this.db!.addSpotifyTrack(track.id, value.body.tracks.items[0].id);
				}
			});
		});
	}
}