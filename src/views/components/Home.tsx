import React, { ReactNode } from "react";
import { StaticPlaylists } from "./StaticPlaylists/StaticPlaylists";
import { SpotifyAuthInfo} from "./shared/SpotifyAuthInfo";
import { FaSpotify } from 'react-icons/fa';
import { RequireSpotifyAuth } from "./shared/RequireSpotifyAuth";
import { IgnitionToSpotify } from "./IgnitionToSpotify/IgnitionToSpotify";
import { SpotifyToIgnition } from "./SpotifyToIgnition/SpotifyToIgnition";

export class Home extends React.Component<{}, {}> {
	createTabLink(id: string, content: ReactNode): ReactNode {
		return <a
			className="nav-link"
			id={`v-pills-${id}-tab`}
			data-toggle="pill"
			href={`#v-pills-${id}`}
			role="tab"
			aria-controls={`v-pills-${id}`}
			aria-selected="false">
			{content}
		</a>;
	}

	createTabContent(id: string, content: ReactNode): ReactNode {
		return <div
			className="tab-pane fade"
			id={`v-pills-${id}`}
			role="tabpanel"
			aria-labelledby={`v-pills-${id}-tab`}>
			{content}
		</div>;
	}

	render(): ReactNode {
		return <div className="row">
			<div className="col-3">
				<div className="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
					{ this.createTabLink("spotifySource", <>Use <FaSpotify />Spotify playlists to search CustomsForge Ignition</>) }
					{ this.createTabLink("ignitionSource", <>Use CustomsForge Ignition to create a <FaSpotify />Spotify playlist</>) }
					{ this.createTabLink("spotifyStatic", <>Follow a constantly-updated <FaSpotify />Spotify playlist.</>) }
				</div>
			</div>
			<div className="col-9">
				<div className="tab-content" id="v-pills-tabContent">
					{ this.createTabContent("spotifySource", <RequireSpotifyAuth>
						{(spotifyAuthInfo: SpotifyAuthInfo): ReactNode => {
							return <SpotifyToIgnition auth={spotifyAuthInfo}></SpotifyToIgnition>;
						}}
					</RequireSpotifyAuth>) }
					{ this.createTabContent("ignitionSource", <RequireSpotifyAuth>
						{(spotifyAuthInfo: SpotifyAuthInfo): ReactNode => {
							return <IgnitionToSpotify spotifyAuth={spotifyAuthInfo}></IgnitionToSpotify>;
						}}
					</RequireSpotifyAuth>) }
					{ this.createTabContent("spotifyStatic", <StaticPlaylists></StaticPlaylists>) }
				</div>
			</div>
		</div>;
	}
}