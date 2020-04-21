import { Database } from '../db/Database';
import { Song } from '../db/models/Song';
import { Logger } from '../shared/Logger';
import { RateLimitedSpotifyWebApi } from '../shared/RateLimitedSpotifyWebApi';
import nlp from 'compromise';

const CHUNK_SIZE: number = 25;
export class SpotifyUpdater {
	static update(accessToken: string, refreshToken: string, redirectUri: string): Promise<any> {
		if (SpotifyUpdater.singleton !== null) {
			return Promise.reject("SpotifyUpdater already running");
		}

		SpotifyUpdater.singleton = new SpotifyUpdater();
		return SpotifyUpdater.singleton.initAndStart(accessToken, refreshToken, redirectUri).finally(() => {
			Logger.getInstance().info(`SpotifyUpdater.initAndStart() DONE`);
			SpotifyUpdater.singleton = null;
		});
	}
	private static singleton: SpotifyUpdater|null = null;
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

	private async initAndStart(accessToken: string, refreshToken: string, redirectUri: string): Promise<any> {
		Logger.getInstance().info(`SpotifyUpdater.initAndStart()`);
		this.spotify = await RateLimitedSpotifyWebApi.getInstance(accessToken, refreshToken, redirectUri);
		this.db = await Database.getInstance();

		// TODO take advantage of parallelization here, since each track from the database is an independent slice of work
		const promises: Promise<any>[] = [];
		const totalTracks: number = await this.db.getCountSongsThatNeedSpotifyTrackId();
		for (let offset: number = 0; offset < totalTracks; offset += CHUNK_SIZE) {
			promises.push(this.giveTracksSpotify(offset));
		}
		return Promise.all(promises).finally(() => {
			Logger.getInstance().info(`finished this.initAndStart`);
		});
	}

	private giveTracksSpotify(offset: number): Promise<any> {
		Logger.getInstance().debug(`giveTracksSpotify(${offset})`);
		return this.db!.getSongsThatNeedSpotifyTrackId(CHUNK_SIZE, offset).then(this.addSpotifyInfoToTracks.bind(this));
	}

	// Update all of the provided tracks in the database with their spotify IDs
	// Returns a promise that resolves with the number of tracks that failed, and a boolean that indicates if there are no more songs
	private addSpotifyInfoToTracks(tracks: Song[]): Promise<any> {
		const promises: Promise<any>[] = [];
		tracks.forEach((track) => {
			const promise: Promise<any> = this.addSpotifyInfoToTrack(track)
				.then(() => {
					Logger.getInstance().info(`addSpotifyInfoToTrack SUCCEEDED for ({Song with id ${track.id} artist "${track.artist}" title "${track.title}"})`);
					return Promise.resolve();
				})
				.catch(() => {
					Logger.getInstance().info(`addSpotifyInfoToTrack FAILED for ({Song with id ${track.id} artist "${track.artist}" title "${track.title}"})`);
				});
			promises.push(promise);
		});

		return Promise.all(promises);
	}

	private addSpotifyInfoToTrack(track: Song): Promise<any> {
		// First, try searching for just the track by the artist. This works for around half of the ignition DB
		const firstSearchQuery: string = SpotifyUpdater.generateQuery(track.artist, track.title);

		// TODO add a check for song artists with "ft." and "&".
		// Example: "Robin Thicke ft. T.I. & Pharrell Williams" becomes "Robin Thicke T.I. Pharrell Williams"
		// At time of writing, there are around 300 tracks in the database that could gain a spotify track ID with this fix.
		return this.getTrackIdForSearchQuery(firstSearchQuery)
			.catch(this.trySeparatingPipedStrings(track))
			.catch(this.tryRemovingParentheticalSubtitle(track))
			.catch(this.tryChangingContractions(track))
			.then((spotifyTrackId: string) => {
				return this.db!.addSpotifyTrackIdToSong(track.id, spotifyTrackId).catch((reason: any) => {
					// The caller may squash any failure here. However, this failure shouldn't come from the database
					Logger.getInstance().error(`db.addSpotifyTracIdToSong ERROR ${JSON.stringify(reason)}`);
					return Promise.reject(reason);
				});
			});
	}

	private tryChangingContractions(track: Song): () => Promise<string> {
		return () => {
			// Try expanding and contracting contractions:
			// example: "Call Me When You Are Sober" is in spotify as "Call Me When You're Sober"
			// example: "All That I'm Living For" is in spotify as "All That I Am Living For"
			const queries: string[] = [
				SpotifyUpdater.generateQuery(track.artist, nlp(track.title).contractions().expand().all().text()),
				SpotifyUpdater.generateQuery(track.artist, nlp(track.title).contractions().contract().all().text())
			];
			return this.getTrackIdFromSearchQueries(queries);
		};
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