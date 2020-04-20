import { RateLimitedSpotifyWebApi } from "../shared/RateLimitedSpotifyWebApi";
import { Database } from "../db/Database";
import { Playlist } from "../db/models/Playlist";
import { Song } from "../db/models/Song";

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
		return this.ensureTracksInPlaylist(FIRST_SPOTIFY_PLAYLIST_ID,  0);
	}
	private async ensureTracksInPlaylist(playlistNumber: number, songOffset: number): Promise<void> {
		const COUNT: number = 25;
		const SPOTIFY_MAX_PLAYLIST_SIZE: number = 10 * 1000;

		const spotifyPlaylist: Playlist = await this.getPlaylist(playlistNumber);
		const songs: Song[] = await this.db.getSongsWithSpotifyTrack(songOffset, COUNT);
		const playlistResponse = await this.spotify.getPlaylistTracks(spotifyPlaylist.spotifyPlaylistId, songOffset, COUNT);
		const playlistTracks: SpotifyApi.PlaylistTrackObject[] = playlistResponse.body.items;
		await this.ensurePlaylistUpdated(spotifyPlaylist.spotifyPlaylistId, playlistTracks, songs, songOffset /* TODO this is wrong */);
		if (songs.length < COUNT) {
			return Promise.resolve();
		} else {
			if (playlistResponse.body.total + COUNT > SPOTIFY_MAX_PLAYLIST_SIZE) {
				playlistNumber += 1;
			}

			return this.ensureTracksInPlaylist(playlistNumber, songOffset + COUNT);
		}
	}

	private async ensurePlaylistUpdated(playlistId: string, playlistTracks: SpotifyApi.PlaylistTrackObject[], songs: Song[], playlistOffset: number): Promise<any> {
		for (let index: number = 0; index < songs.length; index ++) {
			if (index >= playlistTracks.length) {
				// all new tracks, add them to the end
				const remainingTracks: Song[] = songs.slice(index);
				return this.spotify.addSongsToPlaylist(playlistId, remainingTracks, playlistOffset + index);
			}
			// TODO handle other cases here
		}
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