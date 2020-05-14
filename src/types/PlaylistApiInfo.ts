import { Playlist } from "../db/models/Playlist";

export class PlaylistApiInfo {
	public readonly id: number;
	public readonly spotifyId: string;

	constructor(playlist: Playlist) {
		this.id = playlist.id;
		this.spotifyId = playlist.spotifyPlaylistId;
	}
}