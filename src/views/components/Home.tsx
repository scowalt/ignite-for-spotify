import React, { ReactNode } from "react";
import { StaticPlaylists } from "./StaticPlaylists/StaticPlaylists";
import { SpotifyAuthInfo } from "./shared/SpotifyAuthInfo";
import { FaSpotify } from 'react-icons/fa';
import { RequireSpotifyAuth } from "./shared/RequireSpotifyAuth";
import { SpotifyToIgnition } from "./SpotifyToIgnition/SpotifyToIgnition";
import { IgnitionSearchForm } from "./IgnitionToSpotify/IgnitionSearchForm";
import { Container, Row, Col, TabContent, Nav, TabPane, Fade } from "react-bootstrap";
import ReactGA from 'react-ga';
import { TransitionComponent } from "react-bootstrap/esm/helpers";

export class Home extends React.Component<{}, {}> {
	componentDidMount(): void {
		ReactGA.pageview('/');
	}

	private createTabLink(id: string, content: ReactNode, active?: boolean): ReactNode {
		return <Nav.Link
			active={active}
			id={`v-pills-${id}-tab`}
			data-toggle="pill"
			href={`#v-pills-${id}`}
			role="tab"
			aria-controls={`v-pills-${id}`}
			aria-selected="false"
			onClick={(): void => { ReactGA.modalview(`/${id}`); }}>
			{content}
		</Nav.Link>;
	}

	private createTabContent(id: string, content: ReactNode, active?: boolean): ReactNode {
		return <TabPane
			active={active}
			id={`v-pills-${id}`}
			role="tabpanel"
			// HACK: Workaround react-bootstrap bug where it thinks `Fade` isn't a valid TransitionComponent
			transition={Fade as TransitionComponent}
			aria-labelledby={`v-pills-${id}-tab`}>
			{content}
		</TabPane>;
	}

	render(): ReactNode {
		return <Container fluid>
			<Row>
				<Col className="pillColumn">
					<Nav variant="pills" className="flex-column" id="v-pills-tab">
						{ this.createTabLink("spotifySource", <>Use <FaSpotify />Spotify playlists to search CustomsForge Ignition</>, true) }
						{ this.createTabLink("ignitionSource", <>Export CustomsForge Ignition to a <FaSpotify />Spotify playlist</>) }
						{ this.createTabLink("spotifyStatic", <>Follow a constantly-updated <FaSpotify />Spotify playlist.</>) }
					</Nav>
				</Col>
				<Col className="tabContentColumn">
					<TabContent id="v-pills-tabContent">
						{ this.createTabContent("spotifySource", <RequireSpotifyAuth>
							{(spotifyAuthInfo: SpotifyAuthInfo): ReactNode => {
								return <SpotifyToIgnition auth={spotifyAuthInfo}></SpotifyToIgnition>;
							}}
						</RequireSpotifyAuth>, true) }
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
