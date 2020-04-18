import PromiseQueue from 'p-queue';
import SpotifyWebApi from 'spotify-web-api-node';
import { Database } from '../db/Database';
import { Song } from '../db/models/Song';
import { Logger } from '../shared/Logger';

export class SpotifyUpdater {
	static singleton: SpotifyUpdater;
	static update(accessToken: string, refreshToken: string, redirectUri: string): Promise<void> {
		// HACK there is a race condition here without a semaphore (maybe)
		if (SpotifyUpdater.singleton) {
			return Promise.reject("SpotifyUpdater already running");
		}

		SpotifyUpdater.singleton = new SpotifyUpdater(accessToken, refreshToken, redirectUri);
		return SpotifyUpdater.singleton.initAndStart().finally(() => {
			Logger.getInstance().info(`SpotifyUpdater.initAndStart() DONE`);
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

		Logger.getInstance().info(`new SpotifyUpdater`);
	}

	private async initAndStart(): Promise<void> {
		Logger.getInstance().info(`SpotifyUpdater.initAndStart()`);
		return Database.getInstance().then((database: Database) => {
			this.db = database;

			// TODO need to query the database once to figure out how many songs there will be, then construct promises based off of that and fire them away
			return this.updateAccessToken()
						.then(this.doEverything.bind(this))
						.finally(() => {
							Logger.getInstance().info(`this.doEverything done`);
						});
		}).finally(() => {
			Logger.getInstance().info(`Database.getInstance() promise finished`);
		});
	}

	private updateAccessToken() {
		Logger.getInstance().info(`updateAccessToken()`);
		return this.spotify.refreshAccessToken().then((value) => {
			this.spotify.setAccessToken(value.body.access_token);
			return Promise.resolve();
		});
	}

	private doEverything() {
		Logger.getInstance().info(`doEverything()`);
		return this.giveTracksSpotify(0).finally(() => {
			Logger.getInstance().info(`finished this.giveTracksSpotify(0)`);
		});
	}

	private giveTracksSpotify(offset: number): Promise<void> {
		Logger.getInstance().info(`giveTracksSpotify(${offset})`);
		return this.db!.getSongsThatNeedSpotifyTrackId(offset).then(this.addSpotifyInfoToTracks.bind(this)).then(([failedTracks, done]) => {
			if (done) {
				Logger.getInstance().info(`resolving giveTracksSpotify(${offset})`);
				return Promise.resolve();
			}

			// Skip over all of the tracks that have previously failed
			return this.giveTracksSpotify(offset + failedTracks);
		});
	}

	// Update all of the provided tracks in the database with their spotify IDs
	// Returns a promise that resolves with the number of tracks that failed, and a boolean that indicates if there are no more songs
	private addSpotifyInfoToTracks(tracks: Song[]) {
		Logger.getInstance().info(`addSpotifyInfoToTracks(${tracks})`);
		return new Promise<[number, boolean]>((resolve) => {
			let failedTracks = 0;
			const done: boolean = (tracks.length === 0);
			const promises: Promise<void>[] = [];
			tracks.forEach((track) => {
				promises.push(this.addSpotifyInfoToTrack(track).catch(() => {
					failedTracks++;
				}));
			});

			Promise.all(promises).then(() => { resolve([failedTracks, done]); });
		});
	}

	private addSpotifyInfoToTrack(track: Song) {
		Logger.getInstance().debug(`addSpotifyInfoToTrack(${track})`);
		const searchQuery: string = `artist:${track.artist} ${track.title}`;
		return this.spotify.searchTracks(searchQuery).then((value) => {
			if (!value.body.tracks || value.body.tracks.total === 0) {
				return Promise.reject(`Spotify has no track for ${searchQuery}`);
			} else {
				// Spotify track found, add it to the database
				return this.db!.addSpotifyTrackIdToSong(track.id, value.body.tracks.items[0].id);
			}
		});
	}
}