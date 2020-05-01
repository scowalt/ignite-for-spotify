import React, { ReactNode } from "react";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { Col, Row, Button } from "react-bootstrap";
import { IgnitionSearchForm } from "./IgnitionSearchForm";
import { SpotifyPlaylistSelector } from "./SpotifyPlaylistSelector";
import update from 'immutability-helper';

interface IgnitionToSpotifyProps extends React.Props<{}> {
	spotifyAuth: SpotifyAuthInfo;
}

interface State {
	getPlaylist?: () => Promise<SpotifyApi.PlaylistBaseObject>;
}
export class IgnitionToSpotify extends React.Component<IgnitionToSpotifyProps, State> {
	start(): void {
		if (!this.state.getPlaylist) {
			// TODO error here
		}
	}

	setPlaylistFunction(playlistPromiseFunction: (() => Promise<SpotifyApi.PlaylistBaseObject>)): void {
		this.setState(update(this.state, {
			getPlaylist: { $set: playlistPromiseFunction }
		}));
	}

	render(): ReactNode {
		return <>
			<Row>
				<Col><IgnitionSearchForm /></Col>
				<Col>
					<SpotifyPlaylistSelector
						setPlaylist={this.setPlaylistFunction.bind(this)}
						auth={this.props.spotifyAuth} />
				</Col>
			</Row>
			<Row>
				<Col><Button className="goButton" onClick={this.start.bind(this)}>GO</Button></Col>
			</Row>
		</>;
	}
}