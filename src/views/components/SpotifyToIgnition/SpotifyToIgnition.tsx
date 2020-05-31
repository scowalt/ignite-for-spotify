import React, { ReactNode } from "react";
import SpotifyWebApi from 'spotify-web-api-js';
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { Col, Row } from "react-bootstrap";
import update from 'immutability-helper';
import { IgnitionSearch } from "./IgnitionSearch";
import { SpotifyPlaylistListLoader } from "../shared/SpotifyPlaylistListLoader";
import { FaSpotify } from "react-icons/fa";
import { Song } from "../../../db/models/Song";
import ReactGA from 'react-ga';
import Cookies from 'js-cookie';

interface SpotifySourceProps extends React.Props<{}> {
	auth: SpotifyAuthInfo;
}

interface SpotifySourceState {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	downloadAbort: AbortController;
	selectedPlaylist?: SpotifyApi.PlaylistObjectSimplified;
	songs: Song[];
	done: boolean;
}
export class SpotifyToIgnition extends React.Component<SpotifySourceProps, SpotifySourceState> {
	constructor(props: SpotifySourceProps) {
		super(props);
		this.state = {
			spotify: new SpotifyWebApi(),
			downloadAbort: new AbortController(),
			done: true,
			songs: []
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);
	}

	componentDidUpdate(_previousProps: SpotifySourceProps, previousState: SpotifySourceState): void {
		if (this.state.selectedPlaylist !== previousState.selectedPlaylist) {
			// New playlist selected. Start a new search
			this.setState(update(this.state, {
				downloadAbort: { $set: new AbortController() },
				songs: { $set: [] },
				done: { $set: false }
			}));

			this.performIgnitionSearch();
		}
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	private async performIgnitionSearch(): Promise<void> {
		if (!this.state.selectedPlaylist) {
			return Promise.reject(new Error("No playlist selected"));
		}

		ReactGA.event({
			category: 'SpotifyToIgnition',
			action: 'Started a search'
		});

		Cookies.set("playlistId", this.state.selectedPlaylist.id);
		const eventSource: EventSource = new EventSource('/searchUsingPlaylist');
		eventSource.addEventListener('message', (event: MessageEvent) => {
			if (event.data === "done") {
				eventSource.close();
				this.setState(update(this.state, {
					done: { $set: true }
				}));
			} else {
				const song: Song = JSON.parse(event.data);
				this.setState(update(this.state, {
					songs: { $push: [song] }
				}));
			}
		});
		eventSource.onerror = (): void => {
			this.setState(update(this.state, {
				done: { $set: true }
			}));
		};
	}

	private actOnPlaylist(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		this.setState(update(this.state, {
			selectedPlaylist: { $set: playlist }
		}));
	}

	render(): ReactNode {
		const localResults: ReactNode = (this.state.selectedPlaylist) ? <IgnitionSearch
			playlist={this.state.selectedPlaylist}
			spotify={this.state.spotify}
			key={this.state.selectedPlaylist.id}
			songs={this.state.songs}
			done={this.state.done} /> : <></>;
		return <Row className="spotifyToIgnition">
			<Col>
				<Row><Col>
					<h3>Choose a <FaSpotify/>Spotify playlist:</h3>
				</Col></Row>
				<Row><Col>
					<SpotifyPlaylistListLoader
						playlistsPerRequest={10}
						onPlaylistClicked={this.actOnPlaylist.bind(this)}
						spotify={this.state.spotify}
						disabled={this.state.selectedPlaylist && !this.state.done}/>
				</Col></Row>
			</Col>
			<Col>{localResults}</Col>
		</Row>;
	}
}