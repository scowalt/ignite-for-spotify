import { ReactNode } from "react";
import { Container, Col, Row } from "react-bootstrap";
import React from "react";
import ReactGA from 'react-ga';
import { ServerStats } from "./ServerStats";

export class About extends React.PureComponent {
	componentDidMount(): void {
		ReactGA.pageview('/about');
	}

	private onDonationClick(): void {
		ReactGA.event({
			category: 'About',
			action: 'Clicked on donation link'
		});
	}

	render(): ReactNode {
		return <Container><Row><Col>
			Made by <a href="mailto:ignite-for-spotify@scowalt.com">Scott Walters</a><br />
			If you like this app, please consider <a href="https://www.patreon.com/CustomsForge" onClick={this.onDonationClick.bind(this)}>supporting CustomsForge</a>, which makes Ignite for Spotify possible.<br />
			<ServerStats />
		</Col></Row></Container>;
	}
}
