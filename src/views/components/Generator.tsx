import React, { ReactNode } from "react";
import { Button } from "react-bootstrap";
import update from 'immutability-helper';
import { SpotifyToIgnition } from "./SpotifyToIgnition";
import { FaSpotify } from "react-icons/fa";

export interface SpotifyAuthInfo {
	spotifyAccessToken: string;
	spotifyRefreshToken: string;
}
enum Source {
	Spotify = "Spotify",
	CustomsForge = "CustomsForge"
}
interface GeneratorProps extends React.Props<{}> {
	spotifyAuth?: SpotifyAuthInfo;
}

interface GeneratorState {
	source: Source;
}
export class Generator extends React.Component<GeneratorProps, GeneratorState> {
	constructor(props: React.Props<{}>) {
		super(props);
		this.state = {
			source: Source.Spotify
		};
	}

	onSourceChange(event: React.ChangeEvent<HTMLSelectElement>): void {
		const source: Source = event.target.value as Source;
		this.setState(update(this.state, {
			source: {$set: source}
		}));
	}

	render(): ReactNode {
		if (!this.props.spotifyAuth) {
			return <Button href="/login">Login with <FaSpotify />Spotify to continue</Button>;
		} else {
			let source: ReactNode;
			if (this.state.source === Source.Spotify) {
				source = <SpotifyToIgnition auth={this.props.spotifyAuth}></SpotifyToIgnition>;
			}
			return source;
		}
	}
}