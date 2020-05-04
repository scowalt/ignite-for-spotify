import React, { ReactNode } from "react";
import SpotifyWebApi from 'spotify-web-api-js';
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { Col, Row } from "react-bootstrap";
import update from 'immutability-helper';
import { IgnitionSearch } from "./IgnitionSearch";
import { SpotifyPlaylistListLoader } from "../shared/SpotifyPlaylistListLoader";

interface SpotifySourceProps extends React.Props<{}> {
	auth: SpotifyAuthInfo;
}

interface SpotifySourceState {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	selectedPlaylist?: SpotifyApi.PlaylistObjectSimplified;
}
export class SpotifyToIgnition extends React.Component<SpotifySourceProps, SpotifySourceState> {
	constructor(props: SpotifySourceProps) {
		super(props);
		this.state = {
			spotify: new SpotifyWebApi(),
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);

	}

	private actOnPlaylist(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		this.setState(update(this.state, {
			selectedPlaylist: { $set: playlist }
		}));
	}

	render(): ReactNode {
		// BUG This all displays really poorly on mobile
		// TODO playlist options should be disabled while the results are loading
		const localResults: ReactNode = (this.state.selectedPlaylist) ? <IgnitionSearch
			playlist={this.state.selectedPlaylist}
			spotify={this.state.spotify}
			key={this.state.selectedPlaylist.id}></IgnitionSearch> : <></>;
		return <Row>
			<Col>
				<SpotifyPlaylistListLoader
					playlistsPerRequest={10}
					onPlaylistClicked={this.actOnPlaylist.bind(this)}
					spotify={this.state.spotify} />
			</Col>
			<Col>{localResults}</Col>
		</Row>;
	}
}