import React, { ReactElement } from "react";
import Cookie from 'js-cookie';
import Spotify from 'spotify-web-api-js';

interface PlaylistsProperties extends React.Props<{}> {
	spotifyAccessToken: string;
}
interface PlatlistsState {
	spotify: Spotify.SpotifyWebApiJs;
}
export class Playlists extends React.Component<PlaylistsProperties, PlatlistsState> {
	constructor(props: PlaylistsProperties) {
		super(props);
		const spotify: Spotify.SpotifyWebApiJs = new Spotify();
		spotify.setAccessToken(props.spotifyAccessToken);

		this.state = {
			spotify
		};

		this.startPlaylistRetrieval();
	}

	startPlaylistRetrieval() {
		this.state.spotify.getUserPlaylists(undefined /* current user */).then((data: SpotifyApi.ListOfUsersPlaylistsResponse) => {
			data.toString();
		});
	}

	render() {
		return <>Playlists</>;
	}
}