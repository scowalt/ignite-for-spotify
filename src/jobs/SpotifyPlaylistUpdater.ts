import { RateLimitedSpotifyWebApi } from "../shared/RateLimitedSpotifyWebApi";
import { Database } from "../db/Database";
import { Playlist } from "../db/models/Playlist";

export class SpotifyPlaylistUpdater {
	static update(accessToken: string, refreshToken: string, redirectUri: string): Promise<void> {
		if (SpotifyPlaylistUpdater.singleton) {
			return Promise.reject("Updater is already running");
		}

		SpotifyPlaylistUpdater.singleton = new SpotifyPlaylistUpdater();
		return SpotifyPlaylistUpdater.singleton.run(accessToken, refreshToken, redirectUri);
	}
	private static singleton: SpotifyPlaylistUpdater;

	private db!: Database;
	private spotify!: RateLimitedSpotifyWebApi;

	private constructor() { }
	private async run(accessToken: string, refreshToken: string, redirectUri: string): Promise<void> {
		this.spotify = await RateLimitedSpotifyWebApi.getInstance(accessToken, refreshToken, redirectUri);
		this.db = await Database.getInstance();
		const FIRST_SPOTIFY_PLAYLIST_ID: number = 1;
		return this.ensureTracksInPlaylist(FIRST_SPOTIFY_PLAYLIST_ID, 0);
	}
	private async ensureTracksInPlaylist(playlistNumber: number, songOffset: number): Promise<void> {
		const spotifyPlaylist: Playlist = await this.getPlaylist(playlistNumber);
	}
	private async getPlaylist(playlistNumber: number): Promise<Playlist> {
		return this.db.getPlaylistById(playlistNumber).then(async (result: Playlist|null) => {
			if (result === null) {
				// Playlist doesn't exist. Need to create the playlist in spotify and add the playlist to the database
				const spotifyPlaylistId: string = await this.spotify.createPlaylist(playlistNumber);

				// Add the spotify playlist to the db
				return this.db.addPlaylist(playlistNumber, spotifyPlaylistId);
			}

			return result;
		});
	}
}