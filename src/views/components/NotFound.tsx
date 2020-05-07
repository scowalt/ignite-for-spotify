import { ReactNode } from "react";
import { Row, Col, Container } from "react-bootstrap";
import React from "react";

export class NotFound extends React.PureComponent {
	render(): ReactNode {
		return <Container><Row><Col>Content not found</Col></Row></Container>;
	}
}