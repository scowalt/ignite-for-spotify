import React, { ReactNode } from "react";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { Col, Row, Button } from "react-bootstrap";
import { IgnitionSearchForm } from "./IgnitionSearchForm";
import { SpotifyPlaylistSelector } from "./SpotifyPlaylistSelector";
import update, { Spec } from 'immutability-helper';
import { IgnitionSearchQuery } from "../../../types/IgnitionSearchQuery";

interface IgnitionToSpotifyProps extends React.Props<{}> {
	spotifyAuth: SpotifyAuthInfo;
}

interface State {
	getPlaylist?: () => Promise<SpotifyApi.PlaylistBaseObject>;
	ignitionSearchQuery: IgnitionSearchQuery;
}
export class IgnitionToSpotify extends React.Component<IgnitionToSpotifyProps, State> {
	start(): void {
		if (!this.state.getPlaylist) {
			// TODO error here
		}
	}

	updateSearchQuery(spec: Spec<IgnitionSearchQuery>): void {
		// https://github.com/kolodny/immutability-helper/issues/150#issuecomment-577738506
		const newIgnitionSearchQuery: IgnitionSearchQuery = update<IgnitionSearchQuery>(this.state.ignitionSearchQuery, spec);
		this.setState(update(this.state, {
			ignitionSearchQuery: { $set: newIgnitionSearchQuery }
		}));
	}

	setPlaylistFunction(playlistPromiseFunction: (() => Promise<SpotifyApi.PlaylistBaseObject>)): void {
		this.setState(update(this.state, {
			getPlaylist: { $set: playlistPromiseFunction }
		}));
	}

	render(): ReactNode {
		return <>
			<Row>
				<Col><IgnitionSearchForm update={this.updateSearchQuery.bind(this)}/></Col>
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