import React, { ReactNode } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import update from 'immutability-helper';
import { SpotifySource } from "./SpotifySource";

export interface SpotifyAuthInfo {
	spotifyAccessToken: string;
	spotifyRefreshToken: string;
}
enum Source {
	Spotify,
	CustomsForge
}
interface GeneratorProps extends React.Props<{}> {
	spotifyAuth?: SpotifyAuthInfo;
}

interface GeneratorState {
	source: Source;
}
export class Generator extends React.Component<GeneratorProps, GeneratorState> {
	constructor(props: React.Props<{}>) {
		super(props);
		this.state = {
			source: Source.Spotify
		};
	}

	onSourceChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		const source: Source = Source[event.target.value as keyof typeof Source]; // https://stackoverflow.com/a/56076148/1222411
		this.setState(update(this.state, {
			source: {$set: source}
		}));
	}

	render(): ReactNode {
		if (!this.props.spotifyAuth) {
			return <Button onClick={(): any => {window.location.assign(window.location.origin + "/login");}}>Login</Button>;
		} else {
			let source: ReactNode;
			if (this.state.source === Source.Spotify) {
				source = <SpotifySource auth={this.props.spotifyAuth}></SpotifySource>;
			}
			return <>
				<Col>
					<Form>
						<Form.Group controlId="select1">
							<Form.Label>Direction</Form.Label>
							<Form.Control as="select" onChange={this.onSourceChange.bind(this)}>
								<option value={Source.Spotify}>Spotify =&gt; CustomsForge Ignition</option>
								<option value={Source.CustomsForge}>CustomsForge Ignition =&gt; Spotify</option>
							</Form.Control>
						</Form.Group>
					</Form>
					<Row>
						{source}
					</Row>
				</Col>
			</>;
		}
	}
}