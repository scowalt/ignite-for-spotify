import React, { ReactNode } from "react";
import { SpotifyAuthInfo } from "../SpotifyToIgnition/SpotifyToIgnitionGenerator";
import { Button } from "react-bootstrap";
import Cookies from 'js-cookie';
import { FaSpotify } from "react-icons/fa";

interface RequireSpotifyAuthProps extends React.Props<{}> {
	children: (spotifyAuthInfo: SpotifyAuthInfo) => ReactNode;
}
export class RequireSpotifyAuth extends React.Component<RequireSpotifyAuthProps> {
	render(): ReactNode {
		const access: string|undefined = Cookies.get("spotifyAccessToken");
		const refresh: string|undefined = Cookies.get("spotifyRefreshToken");
		if (access && refresh) {
			const auth: SpotifyAuthInfo = {
				spotifyAccessToken: access,
				spotifyRefreshToken: refresh
			};
			return this.props.children(auth);
		} else {
			return <Button href="/login">Login with <FaSpotify />Spotify to continue</Button>;
		}
	}
}