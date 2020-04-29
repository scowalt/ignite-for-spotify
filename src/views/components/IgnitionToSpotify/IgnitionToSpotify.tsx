import React, { ReactNode } from "react";
import { SpotifyAuthInfo } from "../SpotifyToIgnition/SpotifyToIgnitionGenerator";

interface IgnitionToSpotifyProps extends React.Props<{}> {
	spotifyAuth: SpotifyAuthInfo;
}
export class IgnitionToSpotify extends React.Component<IgnitionToSpotifyProps> {
	render(): ReactNode {
		return <>Ignition to Spotify</>;
	}
}