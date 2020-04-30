import React, { ReactNode } from "react";
import { Row, Col } from "react-bootstrap";
import { SpotifyPlaylistListLoader } from "../shared/SpotifyPlaylistListLoader";
import SpotifyWebApi from "spotify-web-api-js";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";

interface Props extends React.Props<{}> {
	auth: SpotifyAuthInfo;
}

interface State {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
}
export class SpotifyPlaylistSelector extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			spotify: new SpotifyWebApi(),
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);
	}

	onPlaylistClicked(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		// TODO
		playlist.toString();
	}

	render(): ReactNode {
		return <>
			<Row><Col>Select an existing Spotify playlist...</Col></Row>
			<Row><Col>
				<SpotifyPlaylistListLoader
					spotify={this.state.spotify}
					onPlaylistClicked={this.onPlaylistClicked.bind(this)}
					playlistsPerRequest={5}/>
			</Col></Row>
		</>;
	}
}