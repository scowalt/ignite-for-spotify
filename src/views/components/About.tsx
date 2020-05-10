import { ReactNode } from "react";
import { Container, Col, Row } from "react-bootstrap";
import React from "react";

export class About extends React.PureComponent {
	render(): ReactNode {
		// TODO expand this
		return <Container><Row><Col>
			Made by Scott Walters
		</Col></Row></Container>;
	}
}