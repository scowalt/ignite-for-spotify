import React, { ReactElement } from "react";
import { Navbar, Container } from "react-bootstrap";

export class TitleBar extends React.Component<{}, {}> {
	render(): ReactElement {
		return <Navbar bg="dark" expand="lg">
			<Container>
				<Navbar.Brand href="#">
					{/* TODO Put logo here */}
					Spotify Ignition
				</Navbar.Brand>
			</Container>
		</Navbar>;
	}
}