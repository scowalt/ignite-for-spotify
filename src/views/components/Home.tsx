import React, { ReactNode } from "react";
import { StaticPlaylists } from "./StaticPlaylists";
import Cookies from 'js-cookie';
import { SpotifyAuthInfo, Generator } from "./Generator";
import { Row } from "react-bootstrap";

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
		return <>
			<Row><Generator spotifyAuth={auth} ></Generator></Row>
			<Row><StaticPlaylists></StaticPlaylists></Row>
		</>;
	}
}