import React, { ReactNode } from "react";
import { SpotifyPlaylistListLoader } from "../shared/SpotifyPlaylistListLoader";
import SpotifyWebApi from "spotify-web-api-js";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { FaSpotify } from 'react-icons/fa';

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
		return <><ul className="nav nav-pills nav-fill mb-3" id="pills-tab" role="tablist">
			<li className="nav-item">
				<a className="nav-link active" id="pills-existing-tab" href="#pills-existing" data-toggle="pill" role="tab" aria-controls="pills-existing" aria-selected="true">
					Select an existing <FaSpotify />Spotify playlist
				</a>
			</li>
			<li className="nav-item">
				<a className="nav-link" id="pills-new-tab" href="#pills-new" data-toggle="pill" role="tab" aria-controls="pills-new" aria-selected="false">
					Create a new <FaSpotify />Spotify playlist
				</a>
			</li>
		</ul>
		<div className="tab-content" id="pills-tabContent">
			<div className="tab-pane fade show active" id="pills-existing" role="tabpanel" aria-labelledby="pills-existing-tab">
				<SpotifyPlaylistListLoader
					spotify={this.state.spotify}
					onPlaylistClicked={this.onPlaylistClicked.bind(this)}
					playlistsPerRequest={5}/>
			</div>
			<div className="tab-pane fade" id="pills-new" role="tabpanel" aria-labelledby="pills-new-tab">
				New
			</div>
		</div></>;
	}
}