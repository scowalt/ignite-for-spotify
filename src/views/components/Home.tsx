import React, { ReactNode } from "react";
import { StaticPlaylists } from "./StaticPlaylists/StaticPlaylists";
import { SpotifyAuthInfo } from "./shared/SpotifyAuthInfo";
import { FaSpotify } from 'react-icons/fa';
import { RequireSpotifyAuth } from "./shared/RequireSpotifyAuth";
import { SpotifyToIgnition } from "./SpotifyToIgnition/SpotifyToIgnition";
import { IgnitionSearchForm } from "./IgnitionToSpotify/IgnitionSearchForm";
import { Container, Row, Col, TabContent } from "react-bootstrap";
import ReactGA from 'react-ga';

export class Home extends React.Component<{}, {}> {
	componentDidMount(): void {
		ReactGA.pageview('/');
	}

	private createTabLink(id: string, content: ReactNode): ReactNode {
		return <a
			className="nav-link"
			id={`v-pills-${id}-tab`}
			data-toggle="pill"
			href={`#v-pills-${id}`}
			role="tab"
			aria-controls={`v-pills-${id}`}
			aria-selected="false"
			onClick={(): void => { ReactGA.modalview(`/${id}`); }}>
			{content}
		</a>;
	}

	private createTabContent(id: string, content: ReactNode): ReactNode {
		return <div
			className="tab-pane fade"
			id={`v-pills-${id}`}
			role="tabpanel"
			aria-labelledby={`v-pills-${id}-tab`}>
			{content}
		</div>;
	}

	render(): ReactNode {
		return <Container fluid>
			<Row>
				<Col className="pillColumn">
					<div className="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
						{ this.createTabLink("spotifySource", <>Use <FaSpotify />Spotify playlists to search CustomsForge Ignition</>) }
						{ this.createTabLink("ignitionSource", <>Export CustomsForge Ignition to a <FaSpotify />Spotify playlist</>) }
						{ this.createTabLink("spotifyStatic", <>Follow a constantly-updated <FaSpotify />Spotify playlist.</>) }
					</div>
				</Col>
				<Col className="tabContentColumn">
					<TabContent id="v-pills-tabContent">
						{ this.createTabContent("spotifySource", <RequireSpotifyAuth>
							{(spotifyAuthInfo: SpotifyAuthInfo): ReactNode => {
								return <SpotifyToIgnition auth={spotifyAuthInfo}></SpotifyToIgnition>;
							}}
						</RequireSpotifyAuth>) }
						{ this.createTabContent("ignitionSource", <RequireSpotifyAuth>
							{(spotifyAuthInfo: SpotifyAuthInfo): ReactNode => {
								return <IgnitionSearchForm spotifyAuth={spotifyAuthInfo}></IgnitionSearchForm>;
							}}
						</RequireSpotifyAuth>) }
						{ this.createTabContent("spotifyStatic", <StaticPlaylists></StaticPlaylists>) }
					</TabContent>
				</Col>
			</Row>
		</Container>;
	}
}