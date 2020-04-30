import React, { ReactNode } from "react";
import update from 'immutability-helper';
import { handleExpiredSpotifyToken } from "../../common/SpotifyHelpers";
import SpotifyWebApi from "spotify-web-api-js";
import { SpotifyPlaylistList } from "./SpotifyPlaylistList";

interface SpotifyPlaylistListLoaderProps extends React.Props<{}> {
	onPlaylistClicked: (playlist: SpotifyApi.PlaylistObjectSimplified) => void;
	spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlistsPerRequest: number;
}

interface State {
	downloadAbort: AbortController;
	playlists?: SpotifyApi.ListOfUsersPlaylistsResponse;
	loading: boolean;
}
export class SpotifyPlaylistListLoader extends React.Component<SpotifyPlaylistListLoaderProps, State> {
	constructor(props: SpotifyPlaylistListLoaderProps){
		super(props);

		this.state = {
			downloadAbort: new AbortController(),
			loading: true
		};

		this.getUserSpotifyPlaylists(0);
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	getUserSpotifyPlaylists(offset: number): Promise<any> {
		if (!this.state.loading) {
			this.setState(update(this.state, {
				loading: { $set: true }
			}));
		}
		return this.props.spotify.getUserPlaylists({
			offset,
			limit: this.props.playlistsPerRequest
		}).then((value: SpotifyApi.ListOfUsersPlaylistsResponse) => {
			if (!this.state.downloadAbort.signal.aborted) {
				this.setState(update(this.state, {
					playlists: { $set: value }
				}));
			}
		}).catch(handleExpiredSpotifyToken(
			this.state.downloadAbort.signal,
			this.props.spotify,
			() => { return this.getUserSpotifyPlaylists(offset); }
		)).finally(() => {
			this.setState(update(this.state, {
				loading: { $set: false }
			}));
		});
	}


	render(): ReactNode {
		return <SpotifyPlaylistList
			loading={this.state.loading}
			playlists={this.state.playlists}
			onPageSwitch={this.getUserSpotifyPlaylists.bind(this)}
			playlistsPerRequest={this.props.playlistsPerRequest}
			onPlaylistClicked={this.props.onPlaylistClicked}></SpotifyPlaylistList>;
	}
}