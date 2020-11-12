import React, { ReactNode } from "react";
import { StaticPlaylists } from "./StaticPlaylists/StaticPlaylists";
import { SpotifyAuthInfo } from "./shared/SpotifyAuthInfo";
import { FaEnvelope, FaSpotify } from 'react-icons/fa';
import { RequireSpotifyAuth } from "./shared/RequireSpotifyAuth";
import { SpotifyToIgnition } from "./SpotifyToIgnition/SpotifyToIgnition";
import { IgnitionSearchForm } from "./IgnitionToSpotify/IgnitionSearchForm";
import { Container, Row, Col, TabContent, Nav, TabPane, Fade, Alert } from "react-bootstrap";
import ReactGA from 'react-ga';
import { TransitionComponent } from "react-bootstrap/esm/helpers";
import Cookies from 'js-cookie';
import update from 'immutability-helper';

interface State {
	showBanner: boolean;
}

export class Home extends React.Component<{}, State> {
	constructor(props: {}) {
		super(props);
		this.state = {
			showBanner: Cookies.get('201112Ignition4BrokeMeAlertDismissed') === undefined
		};
	}

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

	private getWarningBanner() : ReactNode {
		const closeAction = ():void => {
			Cookies.set('201112Ignition4BrokeMeAlertDismissed', "true");
			this.setState(update(this.state, {
				showBanner: { $set: false }
			}));
		};

		let element: ReactNode = <></>;
		if (this.state.showBanner)
		{
			element = <Row>
				<Col>
					<Alert variant="danger" dismissible
						onClose={closeAction}><b>November 12, 2020</b>: Site is broken due to Ignition 4 update. Have knowledge of Node.js/TypeScript and want to help out with the project? <a href="mailto:ignite-for-spotify@scowalt.com"><FaEnvelope />Email me</a></Alert>
				</Col>
			</Row>;
		}

		return element;
	}

	render(): ReactNode {
		const warningBanner = this.getWarningBanner();
		return <Container fluid>
			{ warningBanner }
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
