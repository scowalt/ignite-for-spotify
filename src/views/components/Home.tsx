import React, { ReactNode } from "react";
import { StaticPlaylists } from "./StaticPlaylists";
import Cookies from 'js-cookie';
import { SpotifyAuthInfo, Generator } from "./Generator";
import { Accordion } from "react-bootstrap";
import { FaSpotify } from 'react-icons/fa';
import { HomeTile } from "./HomeTile";

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
			<HomeTile
				header={<>Use <FaSpotify />Spotify playlists to search CustomsForge Ignition</>}
				body={<Generator spotifyAuth={auth}></Generator>}
				index={0}></HomeTile>
			<HomeTile
				header={<>Use CustomsForge Ignition to create a <FaSpotify />Spotify playlist (coming soon)</>}
				body={<></>}
				index={1}></HomeTile>
			<HomeTile
				header={<>Follow a <FaSpotify />Spotify playlist. Pre-generated, constantly updated.</>}
				body={<StaticPlaylists></StaticPlaylists>}
				index={2}></HomeTile>
		</Accordion>;
	}
}