import React, { ReactNode } from "react";
import { Form, Row, Col } from "react-bootstrap";

export class IgnitionSearchForm extends React.Component {
	makeOptionalString(name: string): ReactNode {
		return 	<Col key={name}>
			<Form.Group controlId={`ignitionSearchForm.${name}Input`}>
				<Form.Control type="text" placeholder={`${name} (optional)`} />
			</Form.Group>
		</Col>;
	}

	makeOptionalBoolean(part: string): ReactNode {
		return <Col key={part}>
			<fieldset><Form.Group controlId={`ignitionSearchForm.${part}Input`}>
				<Form.Label>{part}</Form.Label>
				<Form.Check
					type="radio"
					label="Yes"
					name={`${part}Radio`}
					id={`${part}RadioYes`}/>
				<Form.Check
					type="radio"
					label="No"
					name={`${part}Radio`}
					id={`${part}RadioNo`}/>
				<Form.Check
					type="radio"
					label="Don't care"
					name={`${part}Radio`}
					id={`${part}RadioNeutral`}
					defaultChecked />
			</Form.Group></fieldset>
		</Col>;
	}

	render(): ReactNode {
		return <>
			<Row><Col>
				<h4>CustomsForge Search Info</h4>
			</Col></Row>
			<Row><Col>
				<Form>
					<Row>
						{["Artist", "Album", "Author"].map(this.makeOptionalString.bind(this))}
					</Row>
					<Row>
						{["Lead", "Rhythm", "Bass", "Vocals", "Dynamic Difficulty"].map(this.makeOptionalBoolean.bind(this))}
					</Row>
				</Form>
			</Col></Row>
		</>;
	}
}