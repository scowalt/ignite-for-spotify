import { ReactNode } from "react";
import { Row, Col, Container } from "react-bootstrap";
import React from "react";
import ReactGA from 'react-ga';

export class NotFound extends React.PureComponent {
	componentDidMount(): void {
		ReactGA.modalview('/404');
	}

	render(): ReactNode {
		return <Container><Row><Col>Content not found</Col></Row></Container>;
	}
}
