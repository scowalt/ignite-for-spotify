import React, { ReactNode } from "react";
import SpotifyWebApi from 'spotify-web-api-js';
import { SpotifyAuthInfo } from "./SpotifyToIgnitionGenerator";
import { Col, Row } from "react-bootstrap";
import update from 'immutability-helper';
import { IgnitionSearch } from "../IgnitionSearch";
import { SpotifyPlaylistList } from "./SpotifyPlaylistList";
import { handleExpiredSpotifyToken } from "../../common/SpotifyHelpers";

export const PLAYLISTS_PER_REQUEST: number = 10;

interface SpotifySourceProps extends React.Props<{}> {
	auth: SpotifyAuthInfo;
}

interface SpotifySourceState {
	downloadAbort: AbortController;
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlists?: SpotifyApi.ListOfUsersPlaylistsResponse;
	loading: boolean;
	selectedPlaylist?: SpotifyApi.PlaylistObjectSimplified;
}
export class SpotifyToIgnition extends React.Component<SpotifySourceProps, SpotifySourceState> {
	constructor(props: SpotifySourceProps) {
		super(props);
		this.state = {
			downloadAbort: new AbortController(),
			spotify: new SpotifyWebApi(),
			loading: true
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);

		this.getUserSpotifyPlaylists(0);
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	getUserSpotifyPlaylists(offset: number): Promise<any> {
		if (!this.state.loading) {
			this.setState(update(this.state, {
				loading: {$set: true}
			}));
		}
		return this.state.spotify.getUserPlaylists({
			offset,
			limit: PLAYLISTS_PER_REQUEST
		}).then((value: SpotifyApi.ListOfUsersPlaylistsResponse) => {
			if (!this.state.downloadAbort.signal.aborted) {
				this.setState(update(this.state, {
					playlists: {$set: value}
				}));
			}
		}).catch(handleExpiredSpotifyToken(
			this.state.downloadAbort.signal,
			this.state.spotify,
			() => { return this.getUserSpotifyPlaylists(offset); }
		)).finally(() => {
			this.setState(update(this.state, {
				loading: {$set: false}
			}));
		});
	}

	private actOnPlaylist(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		this.setState(update(this.state, {
			selectedPlaylist: {$set: playlist}
		}));
	}

	render(): ReactNode {
		// BUG This all displays really poorly on mobile
		if (this.state.playlists) {
			const playlists: ReactNode = <SpotifyPlaylistList
				loading={this.state.loading}
				playlists={this.state.playlists}
				onPageSwitch={this.getUserSpotifyPlaylists.bind(this)}
				onPlaylistClicked={this.actOnPlaylist.bind(this)}></SpotifyPlaylistList>;
			const localResults: ReactNode = (this.state.selectedPlaylist) ? <IgnitionSearch
				playlist={this.state.selectedPlaylist}
				spotify={this.state.spotify}
				key={this.state.selectedPlaylist.id}></IgnitionSearch> : null;
			return <Row>
				<Col>{playlists}</Col>
				<Col>{localResults}</Col>
			</Row>;
		}
		return <>Spotify Source</>;
	}
}