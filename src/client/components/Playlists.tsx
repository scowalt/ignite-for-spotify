import React, { ReactElement } from "react";
import Cookie from 'js-cookie';
import Spotify from 'spotify-web-api-js';
import update from 'immutability-helper';

interface PlaylistsProperties extends React.Props<{}> {
	initialSpotifyAccessToken: string;
	spotifyRefreshToken: string;
}
interface PlatlistsState {
	spotify: Spotify.SpotifyWebApiJs;
	total: number;
}
export class Playlists extends React.Component<PlaylistsProperties, PlatlistsState> {
	constructor(props: PlaylistsProperties) {
		super(props);
		const spotify: Spotify.SpotifyWebApiJs = new Spotify();
		spotify.setAccessToken(props.initialSpotifyAccessToken);

		this.state = {
			spotify,
			total: -1
		};

		this.startPlaylistRetrieval();
	}

	startPlaylistRetrieval() {
		this.state.spotify.getUserPlaylists(undefined /* current user */).then((data: SpotifyApi.ListOfUsersPlaylistsResponse) => {
			this.setState(update(this.state, {
				total: {$set: data.total}
			}));
		}).catch((error: any) => {
			// Assuming that we need to refresh our access token
			// HACK there could potentially be other reason for this API to error
			fetch(`${window.location.origin}/spotifyRefreshToken?refresh_token=${this.props.spotifyRefreshToken}`).then((response: Response) => {
				return response.json();
			}).then((body: any) => {
				// HACK clean this up
				this.state.spotify.setAccessToken(body.access_token);
				Cookie.set("spotifyAccessToken", body.access_token);
				this.startPlaylistRetrieval();
			});
			// TODO catch any errors with this fetch
		});
	}

	render() {
		return <>Playlists: {this.state.total}</>;
	}
}