import React, { ReactNode } from "react";
import SpotifyWebApi from 'spotify-web-api-js';
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { Col, Row } from "react-bootstrap";
import update from 'immutability-helper';
import { IgnitionSearchResults } from "./IgnitionSearchResults";
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
	selectedPlaylist?: SpotifyApi.PlaylistObjectSimplified;
	songs: Song[];
	eventSource?: EventSource;
}
export class SpotifyToIgnition extends React.Component<SpotifySourceProps, SpotifySourceState> {
	constructor(props: SpotifySourceProps) {
		super(props);
		this.state = {
			spotify: new SpotifyWebApi(),
			songs: []
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);
	}

	componentDidUpdate(_previousProps: SpotifySourceProps, previousState: SpotifySourceState): void {
		if (this.state.selectedPlaylist !== previousState.selectedPlaylist) {
			this.performIgnitionSearch();
		}

		if (previousState.eventSource !== undefined && this.state.eventSource === undefined) {
			previousState.eventSource.close();
		}
	}

	componentWillUnmount(): void {
		if (this.state.eventSource) {
			this.state.eventSource.close();

			ReactGA.event({
				category: 'SpotifyToIgnition',
				action: 'Canceled search',
				nonInteraction: true
			});
		}
	}

	unsetEventSource(): void {
		this.setState(update(this.state, {
			eventSource: { $set: undefined }
		}));
	}

	private performIgnitionSearch(): void {
		if (!this.state.selectedPlaylist) {
			return;
		}

		ReactGA.event({
			category: 'SpotifyToIgnition',
			action: 'Started a search'
		});

		Cookies.set("playlistId", this.state.selectedPlaylist.id);
		const eventSource: EventSource = new EventSource('/searchUsingPlaylist');
		eventSource.addEventListener('message', (event: MessageEvent) => {
			if (event.data === "done") {
				this.unsetEventSource();
			} else {
				const song: Song = JSON.parse(event.data);
				this.setState(update(this.state, {
					songs: { $push: [song] }
				}));
			}
		});
		eventSource.onerror = this.unsetEventSource.bind(this);

		this.setState(update(this.state, {
			eventSource: { $set: eventSource }
		}));
	}

	private actOnPlaylist(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		this.setState(update(this.state, {
			selectedPlaylist: { $set: playlist },
			songs: { $set: [] },
			eventSource: { $set: undefined }
		}));
	}

	render(): ReactNode {
		const localResults: ReactNode = (this.state.selectedPlaylist) ? <IgnitionSearchResults
			key={this.state.selectedPlaylist.id}
			songs={this.state.songs}
			done={this.state.eventSource === undefined} /> : <></>;
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
						disabled={this.state.selectedPlaylist && this.state.eventSource !== undefined}/>
				</Col></Row>
			</Col>
			<Col>{localResults}</Col>
		</Row>;
	}
}