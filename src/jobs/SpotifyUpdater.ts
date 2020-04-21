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
	private static generateQuery(artist: string, title: string): string {
		return `artist:${artist} ${title}`;
	}
	private static generatePipeQueries(artist: string, title: string): string[] {
		const artists: string[] = artist.split('|').map((str: string) => { return str.trim(); });
		const titles: string[] = title.split('|').map((str: string) => { return str.trim(); });
		const queries: string[] = [];
		artists.forEach((a: string) => {
			titles.forEach((t: string) => {
				queries.push(SpotifyUpdater.generateQuery(a, t));
			});
		});

		return queries;
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
				Logger.getInstance().debug(`failed to get spotify track info for ({Song with id ${track.id} artist ${track.artist} title ${track.title}})`);
				failedTracks++;
			}));
		});

		return Promise.all(promises).then(() => { return Promise.resolve([failedTracks, done]); });
	}

	private addSpotifyInfoToTrack(track: Song): Promise<any> {
		Logger.getInstance().debug(`addSpotifyInfoToTrack({Song with id ${track.id} artist ${track.artist} title ${track.title}})`);

		// First, try searching for just the track by the artist. This works for around half of the ignition DB
		const firstSearchQuery: string = SpotifyUpdater.generateQuery(track.artist, track.title);
		return this.getTrackIdForSearchQuery(firstSearchQuery)
			.catch(this.trySeparatingPipedStrings(track))
			.catch(this.tryRemovingParentheticalSubtitle(track))
			.then((spotifyTrackId: string) => {
				return this.db!.addSpotifyTrackIdToSong(track.id, spotifyTrackId);
			});
	}

	private trySeparatingPipedStrings(track: Song): () => Promise<string> {
		return () => {
			// It's possible that the artist and/or title of the track has is listed as:
			// "{Non-english name} | {English name}" (example: "Sektor Gaza | Сектор газа")
			// The order may also be reversed. Some may even be in the form "name1 | name2 | name3".
			// There is no way to know which name or name combination might be valid.
			// So, generate an array of all of the possible queries, and search them one-by-one
			const pipeQueries: string[] = SpotifyUpdater.generatePipeQueries(track.artist, track.title);
			return this.getTrackIdFromSearchQueries(pipeQueries);
		};
	}

	private tryRemovingParentheticalSubtitle(track: Song): () => Promise<string> {
		return () => {
			// Sometimes a track title will have a parenthetical subtitle that doesn't appear on Spotify.
			// For example, "Welcome to the Machine (Cover)" by Shadows Fall appears on Spotify as "Welcome to the Machine".
			// Removing the parenthetical subtitle might help find the track
			const expression: RegExp = /(.*\S)\s*\(.*\)/;
			const match: RegExpExecArray | null = expression.exec(track.title);
			if (match === null) {
				return Promise.reject(`No parenthetical subtitle found`);
			}
			return this.getTrackIdForSearchQuery(SpotifyUpdater.generateQuery(track.artist, match[1]));
		};
	}

	private async getTrackIdFromSearchQueries(searchQueries: string[]): Promise<string> {
		if (searchQueries.length === 0) {
			return Promise.reject(`No spotify track found for any provided search queries`);
		}

		return this.getTrackIdForSearchQuery(searchQueries[0]).catch(() => {
			return this.getTrackIdFromSearchQueries(searchQueries.splice(1));
		});
	}

	private getTrackIdForSearchQuery(searchQuery: string): Promise<string> {
		return this.spotify.searchTracks(searchQuery).then((tracks) => {
			if (!tracks || tracks.total === 0) {
				return Promise.reject(`Spotify has no track for ${searchQuery}`);
			} else {
				return Promise.resolve(tracks.items[0].id);
			}
		});
	}
}