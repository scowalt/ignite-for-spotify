import { Database } from '../db/Database';
import { Song } from '../db/models/Song';
import { Logger } from '../shared/Logger';
import { RateLimitedSpotifyWebApi } from '../shared/RateLimitedSpotifyWebApi';

export class SpotifyUpdater {
	static singleton: SpotifyUpdater;
	static update(accessToken: string, refreshToken: string, redirectUri: string): Promise<void> {
		if (SpotifyUpdater.singleton) {
			return Promise.reject("SpotifyUpdater already running");
		}

		SpotifyUpdater.singleton = new SpotifyUpdater();
		return SpotifyUpdater.singleton.initAndStart(accessToken, refreshToken, redirectUri).finally(() => {
			Logger.getInstance().info(`SpotifyUpdater.initAndStart() DONE`);
		});
	}

	private spotify!: RateLimitedSpotifyWebApi;
	private db!: Database;

	private constructor() { }

	private async initAndStart(accessToken: string, refreshToken: string, redirectUri: string): Promise<void> {
		Logger.getInstance().info(`SpotifyUpdater.initAndStart()`);
		this.spotify = await RateLimitedSpotifyWebApi.getInstance(accessToken, refreshToken, redirectUri);
		this.db = await Database.getInstance();

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
	private addSpotifyInfoToTracks(tracks: Song[]): Promise<[number, boolean]> {
		Logger.getInstance().info(`addSpotifyInfoToTracks(${tracks})`);
		let failedTracks: number = 0;
		const done: boolean = (tracks.length === 0);
		const promises: Promise<any>[] = [];
		tracks.forEach((track) => {
			promises.push(this.addSpotifyInfoToTrack(track).catch(() => {
				failedTracks++;
			}));
		});

		return Promise.all(promises).then(() => { return Promise.resolve([failedTracks, done]); });
	}

	private addSpotifyInfoToTrack(track: Song): Promise<any> {
		Logger.getInstance().debug(`addSpotifyInfoToTrack(${track})`);
		const searchQuery: string = `artist:${track.artist} ${track.title}`;
		return this.spotify.searchTracks(searchQuery).then((tracks) => {
			if (!tracks || tracks.total === 0) {
				return Promise.reject(`Spotify has no track for ${searchQuery}`);
			} else {
				// Spotify track found, add it to the database
				return this.db!.addSpotifyTrackIdToSong(track.id, tracks.items[0].id);
			}
		});
	}
}