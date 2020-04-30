import React, { ReactNode } from "react";
import { Navbar, Container } from "react-bootstrap";
import Icon from '../../../res/icon/reverse-icon.png';

export class TitleBar extends React.Component<{}, {}> {
	render(): ReactNode {
		return <Navbar bg="dark" expand="lg">
			<Container fluid>
				<Navbar.Brand href="#">
					<img src={Icon} className="brandIcon"></img>
					Ignite for Spotify
				</Navbar.Brand>
			</Container>
		</Navbar>;
	}
}