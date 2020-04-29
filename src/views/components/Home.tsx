import React, { ReactNode } from "react";
import { StaticPlaylists } from "./StaticPlaylists/StaticPlaylists";
import { SpotifyAuthInfo, SpotifyToIgnitionGenerator as SpotifyToIgnitionGenerator } from "./SpotifyToIgnition/SpotifyToIgnitionGenerator";
import { Accordion } from "react-bootstrap";
import { FaSpotify } from 'react-icons/fa';
import { HomeTile } from "./HomeTile";
import { RequireSpotifyAuth } from "./shared/RequireSpotifyAuth";
import { IgnitionToSpotify } from "./IgnitionToSpotify/IgnitionToSpotify";

export class Home extends React.Component<{}, {}> {
	render(): ReactNode {
		return <Accordion>
			<HomeTile
				header={<>Use <FaSpotify />Spotify playlists to search CustomsForge Ignition</>}
				index={0}>
				<RequireSpotifyAuth>
					{(spotifyAuthInfo: SpotifyAuthInfo): ReactNode => {
						return <SpotifyToIgnitionGenerator spotifyAuth={spotifyAuthInfo}></SpotifyToIgnitionGenerator>;
					}}
				</RequireSpotifyAuth>
			</HomeTile>
			<HomeTile
				header={<>Use CustomsForge Ignition to create a <FaSpotify />Spotify playlist (coming soon)</>}
				index={1}>
				<RequireSpotifyAuth>
					{(spotifyAuthInfo: SpotifyAuthInfo): ReactNode => {
						return <IgnitionToSpotify spotifyAuth={spotifyAuthInfo}></IgnitionToSpotify>;
					}}
				</RequireSpotifyAuth>
			</HomeTile>
			<HomeTile
				header={<>Follow a <FaSpotify />Spotify playlist. Pre-generated, constantly updated.</>}
				index={2}>
				<StaticPlaylists></StaticPlaylists>
			</HomeTile>
		</Accordion>;
	}
}