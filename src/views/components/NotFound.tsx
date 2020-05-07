import { ReactNode } from "react";
import { Row, Col } from "react-bootstrap";
import React from "react";

export class NotFound extends React.PureComponent {
	render(): ReactNode {
		return <Row><Col>Content not found</Col></Row>;
	}
}