import React, { ReactNode } from "react";
import { StaticPlaylists } from "./StaticPlaylists";
import Cookies from 'js-cookie';
import { SpotifyAuthInfo, Generator } from "./Generator";
import { Row, Accordion, Card, Button } from "react-bootstrap";
import { SpotifyToIgnition } from "./SpotifyToIgnition";

export class Home extends React.Component<{}, {}> {
	render(): ReactNode {
		let auth: SpotifyAuthInfo|undefined;
		const access: string|undefined = Cookies.get("spotifyAccessToken");
		const refresh: string|undefined = Cookies.get("spotifyRefreshToken");
		if (access && refresh) {
			auth = {
				spotifyAccessToken: access,
				spotifyRefreshToken: refresh
			};
		}
		return <Accordion>
			<Card>
				<Card.Header>
					<Accordion.Toggle as={Button} variant="link" eventKey="0">
						Use Spotify playlists to search CustomsForge Ignition
					</Accordion.Toggle>
				</Card.Header>
				<Accordion.Collapse eventKey="0">
					<Card.Body><Generator spotifyAuth={auth}></Generator></Card.Body>
				</Accordion.Collapse>
			</Card>
			<Card>
				<Card.Header>
					<Accordion.Toggle as={Button} variant="link" eventKey="1">
					Use CustomsForge Ignition to create a Spotify playlist
					</Accordion.Toggle>
				</Card.Header>
				<Accordion.Collapse eventKey="1">
					<Card.Body>TODO</Card.Body>
				</Accordion.Collapse>
			</Card>
			<Card>
				<Card.Header>
					<Accordion.Toggle as={Button} variant="link" eventKey="2">
						Follow a Spotify playlist. Pre-generated, constantly updated.
					</Accordion.Toggle>
				</Card.Header>
				<Accordion.Collapse eventKey="2">
					<Card.Body><StaticPlaylists></StaticPlaylists></Card.Body>
				</Accordion.Collapse>
			</Card>
		</Accordion>;
	}
}