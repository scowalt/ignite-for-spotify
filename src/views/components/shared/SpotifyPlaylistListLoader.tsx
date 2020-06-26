import React, { ReactNode } from "react";
import update from 'immutability-helper';
import { handleExpiredSpotifyToken } from "../../common/SpotifyHelpers";
import { SpotifyWebApi } from "spotify-web-api-ts";
import { SpotifyPlaylistList } from "./SpotifyPlaylistList";
import { SimplifiedPlaylist, Paging } from "spotify-web-api-ts/types/types/SpotifyObjects";

interface SpotifyPlaylistListLoaderProps extends React.Props<{}> {
	onPlaylistClicked: (playlist: SimplifiedPlaylist) => void;
	spotify: SpotifyWebApi;
	playlistsPerRequest: number;
	disabled?: boolean;
}

interface State {
	downloadAbort: AbortController;
	playlists?: Paging<SimplifiedPlaylist>;
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
		return this.props.spotify.playlists.getMyPlaylists({
			offset,
			limit: this.props.playlistsPerRequest
		}).catch(handleExpiredSpotifyToken(
			this.state.downloadAbort.signal,
			this.props.spotify,
			() => { return this.props.spotify.playlists.getMyPlaylists({
				offset,
				limit: this.props.playlistsPerRequest
			}); }
		)).then((value: Paging<SimplifiedPlaylist>) => {
			if (!this.state.downloadAbort.signal.aborted) {
				this.setState(update(this.state, {
					playlists: { $set: value }
				}));
			}
		}).finally(() => {
			this.setState(update(this.state, {
				loading: { $set: false }
			}));
		});
	}


	render(): ReactNode {
		return <SpotifyPlaylistList
			disabled={this.props.disabled}
			loading={this.state.loading}
			playlists={this.state.playlists}
			onPageSwitch={this.getUserSpotifyPlaylists.bind(this)}
			playlistsPerRequest={this.props.playlistsPerRequest}
			onPlaylistClicked={this.props.onPlaylistClicked}></SpotifyPlaylistList>;
	}
}
