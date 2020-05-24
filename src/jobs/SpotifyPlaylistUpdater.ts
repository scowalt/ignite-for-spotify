import { RateLimitedSpotifyWebApi } from "../shared/RateLimitedSpotifyWebApi";
import { Database } from "../db/Database";
import { Playlist } from "../db/models/Playlist";
import { Song } from "../db/models/Song";
import { Logger } from "../shared/Logger";

const SPOTIFY_MAX_PLAYLIST_SIZE: number = 10 * 1000;
export class SpotifyPlaylistUpdater {
	static update(accessToken: string, refreshToken: string, redirectUri: string): Promise<void> {
		if (SpotifyPlaylistUpdater.singleton !== null) {
			return Promise.reject("Updater is already running");
		}

		SpotifyPlaylistUpdater.singleton = new SpotifyPlaylistUpdater();
		return SpotifyPlaylistUpdater.singleton.run(accessToken, refreshToken, redirectUri).finally(() => {
			SpotifyPlaylistUpdater.singleton = null;
		});
	}
	private static singleton: SpotifyPlaylistUpdater|null = null;

	private static getPlaylistNumber(songOffset: number): number {
		return Math.floor(songOffset / SPOTIFY_MAX_PLAYLIST_SIZE) + 1;
	}

	private db!: Database;
	private spotify!: RateLimitedSpotifyWebApi;

	private constructor() { }
	private async run(accessToken: string, refreshToken: string, redirectUri: string): Promise<void> {
		Logger.getInstance().info(`SpotifyPlaylistUpdater.run(...)`);
		this.spotify = await RateLimitedSpotifyWebApi.createInstance(accessToken, refreshToken, redirectUri);
		this.db = await Database.getInstance();
		return this.ensureTracksInPlaylist();
	}

	private async ensureTracksInPlaylist(): Promise<void> {
		// Strategy: Grab a "chunk" of songs of length N with spotify track IDs
		// 				Remove N songs from the spotify playlist
		// 				Add the chunk of songs to the spotify playlist
		// 				Offset by N
		// 				Repeat until all songs have been added, switching playlists when one fills up
		// At the end of this, the spotify playlists will perfectly match the database (if the database
		// hasn't been modified during this process). This will also cause the least disruption to anyone
		// actively using the database. (better than removing all 10,000 songs then adding all of the songs
		// back in 100 songs at a time). We want the chunk size to be small enough to not cause too much of a disruption,
		// but large enough that this process won't take a long time. (This will all need to be done one chunk at a time.
		// Removing tracks from a playlist requires a snapshot ID that changes with each playlist modification, so parallelization
		// with the above strategy is impossible).
		const CHUNK_SIZE: number = 25;

		let playlistNumber: number = 1;
		let songOffset: number = 0;
		let songsRemaining: boolean = true;
		while (songsRemaining) {
			const playlist: Playlist = await this.getPlaylist(playlistNumber);
			while (playlistNumber === SpotifyPlaylistUpdater.getPlaylistNumber(songOffset)) {
				const songs: Song[] = await this.db.getSongsWithSpotifyTrack(songOffset, CHUNK_SIZE);
				if (songs.length === 0) {
					songsRemaining = false;
					break;
				}

				await this.ensurePlaylistUpdated(playlist.spotifyPlaylistId, songs, songOffset % SPOTIFY_MAX_PLAYLIST_SIZE);
				songOffset += songs.length;
			}

			playlistNumber = SpotifyPlaylistUpdater.getPlaylistNumber(songOffset);
		}
	}

	private async ensurePlaylistUpdated(playlistId: string, songs: Song[], playlistOffset: number): Promise<any> {
		await this.spotify.removePlaylistTracksAtPosition(playlistId, playlistOffset, songs.length);
		return this.spotify.addSongsToPlaylist(playlistId, songs, playlistOffset);
	}

	private async getPlaylist(playlistNumber: number): Promise<Playlist> {
		const currentPlaylist: Playlist|null = await this.db.getPlaylistById(playlistNumber);
		if (currentPlaylist === null) {
			// Playlist doesn't exist. Need to create the playlist in spotify and add the playlist to the database
			const spotifyPlaylistId: string = await this.spotify.createEntireLibraryPlaylist(playlistNumber);

			// Add the spotify playlist to the db
			return this.db.addPlaylist(playlistNumber, spotifyPlaylistId);
		}

		return currentPlaylist;
	}
}