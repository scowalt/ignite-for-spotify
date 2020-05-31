import React, { ReactNode } from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import Icon from '../../../res/icon/reverse-icon.png';
import Cookies from 'js-cookie';
import ReactGA from 'react-ga';

export class TitleBar extends React.Component<{}, {}> {
	private shouldShowLogout(): boolean {
		return Cookies.get("spotifyAccessToken") !== undefined ||
			Cookies.get("spotifyRefreshToken") !== undefined;
	}

	private logout(): void {
		ReactGA.event({
			category: 'Auth',
			action: 'Logout'
		});

		Cookies.remove("spotifyAccessToken");
		Cookies.remove("spotifyRefreshToken");
	}

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
					{this.shouldShowLogout() ? <Nav.Link href="/" onClick={this.logout.bind(this)}>Logout</Nav.Link> : <></> }
				</Navbar.Collapse>
			</Container>
		</Navbar>;
	}
}
