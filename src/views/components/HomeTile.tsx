import React, { ReactElement, ReactNode } from "react";
import { Card, Accordion, Button } from "react-bootstrap";

interface HomeTileProps extends React.Props<{}> {
	body: ReactElement;
	header: ReactElement;
	index: number;
}
export class HomeTile extends React.Component<HomeTileProps> {
	render(): ReactNode {
		return <Card>
			<Card.Header>
				<Accordion.Toggle as={Button} variant="link" eventKey={`${this.props.index}`}>
					{this.props.header}
				</Accordion.Toggle>
			</Card.Header>
			<Accordion.Collapse eventKey={`${this.props.index}`}>
				<Card.Body>{this.props.body}</Card.Body>
			</Accordion.Collapse>
		</Card>;
	}
}