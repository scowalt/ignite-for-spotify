import { ReactNode } from "react";
import { Container, Col, Row } from "react-bootstrap";
import React from "react";

export class About extends React.PureComponent {
	render(): ReactNode {
		return <Container><Row><Col>
			Made by <a href="mailto:ignite-for-spotify@scowalt.com">Scott Walters</a><br />
			If you like this app, please consider <a href="http://customsforge.com/donate">supporting CustomsForge</a>, which makes Ignite for Spotify possible.
		</Col></Row></Container>;
	}
}