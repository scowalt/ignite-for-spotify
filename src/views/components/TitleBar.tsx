import React, { ReactNode } from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import Icon from '../../../res/icon/reverse-icon.png';

export class TitleBar extends React.Component<{}, {}> {
	render(): ReactNode {
		return <Navbar bg="dark" expand="lg">
			<Container fluid>
				<Navbar.Brand href="/">
					<img src={Icon} className="brandIcon"></img>
					Ignite for Spotify
				</Navbar.Brand>
				<Navbar.Toggle aria-controls="basic-navbar-nav" />
				<Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
					<Nav.Link active={window.location.pathname === "/about"} href="/about">About</Nav.Link>
				</Navbar.Collapse>
			</Container>
		</Navbar>;
	}
}