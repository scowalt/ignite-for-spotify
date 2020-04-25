import React, { ReactNode } from "react";
import SpotifyWebApi from 'spotify-web-api-js';
import { SpotifyAuthInfo } from "./Generator";
import update from 'immutability-helper';

interface SpotifySourceProps extends React.Props<{}> {
	auth: SpotifyAuthInfo;
}

interface SpotifySourceState {
	downloadAbort: AbortController;
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlists?: SpotifyApi.PlaylistObjectSimplified[];
}
export class SpotifySource extends React.Component<SpotifySourceProps, SpotifySourceState> {
	constructor(props: SpotifySourceProps) {
		super(props);
		this.state = {
			// TODO use this to cancel requests
			downloadAbort: new AbortController(),
			spotify: new SpotifyWebApi()
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);

		this.getUserSpotifyPlaylists();
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	getUserSpotifyPlaylists(): Promise<any> {
		return this.state.spotify.getUserPlaylists().then((value: SpotifyApi.ListOfUsersPlaylistsResponse) => {
			// TODO handle multiple pages of playlists
			this.setState(update(this.state, {
				playlists: {$set: value.items}
			}));
		}).catch((xhr: XMLHttpRequest) => {
			if (xhr.status === 401 && xhr.responseText.includes("The access token expired")) {
				return fetch('/refreshSpotifyAuth').then((response: Response) => {
					return response.json();
				}).then((response: string) => {
					this.state.spotify.setAccessToken(response);
					return this.getUserSpotifyPlaylists();
				});
			}
			return Promise.reject(xhr);
		});
	}

	render(): ReactNode {
		if (this.state.playlists) {
			return <>
				{this.state.playlists.map((playlist: SpotifyApi.PlaylistObjectSimplified, index: number) => {
					return <div key={index}>{playlist.name}</div>;
				})}
			</>;
		}
		return <>Spotify Source</>;
	}
}