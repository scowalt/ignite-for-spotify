import React, { ReactNode } from "react";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { Col, Row } from "react-bootstrap";
import { IgnitionSearchForm } from "./IgnitionSearchForm";
import { SpotifyPlaylistSelector } from "./SpotifyPlaylistSelector";

interface IgnitionToSpotifyProps extends React.Props<{}> {
	spotifyAuth: SpotifyAuthInfo;
}
export class IgnitionToSpotify extends React.Component<IgnitionToSpotifyProps> {
	render(): ReactNode {
		return <Row>
			<Col><IgnitionSearchForm></IgnitionSearchForm></Col>
			<Col><SpotifyPlaylistSelector auth={this.props.spotifyAuth}></SpotifyPlaylistSelector></Col>
		</Row>;
	}
}