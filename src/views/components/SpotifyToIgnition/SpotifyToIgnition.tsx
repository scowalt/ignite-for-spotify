import React, { ReactNode } from "react";
import SpotifyWebApi from 'spotify-web-api-js';
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { Col, Row } from "react-bootstrap";
import update from 'immutability-helper';
import { IgnitionSearch } from "./IgnitionSearch";
import { SpotifyPlaylistListLoader } from "../shared/SpotifyPlaylistListLoader";
import { FaSpotify } from "react-icons/fa";
import { handleExpiredSpotifyToken } from "../../common/SpotifyHelpers";
import { BasicTrackInfo } from "../../../types/BasicTrackInfo";
import { Song } from "../../../db/models/Song";
import ReactGA from 'react-ga';

interface SpotifySourceProps extends React.Props<{}> {
	auth: SpotifyAuthInfo;
}

interface SpotifySourceState {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	downloadAbort: AbortController;
	selectedPlaylist?: SpotifyApi.PlaylistObjectSimplified;
	songs?: Song[];
}
export class SpotifyToIgnition extends React.Component<SpotifySourceProps, SpotifySourceState> {
	constructor(props: SpotifySourceProps) {
		super(props);
		this.state = {
			spotify: new SpotifyWebApi(),
			downloadAbort: new AbortController()
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);
	}

	componentDidUpdate(_previousProps: SpotifySourceProps, previousState: SpotifySourceState): void {
		if (this.state.selectedPlaylist !== previousState.selectedPlaylist) {
			// New playlist selected. Start a new search
			this.setState(update(this.state, {
				downloadAbort: { $set: new AbortController() },
				songs: { $set: undefined }
			}));

			this.performIgnitionSearch();
		}
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	private getPageOfPlaylistTracks(offset: number): Promise<SpotifyApi.PlaylistTrackResponse> {
		if (!this.state.selectedPlaylist) {
			return Promise.reject(new Error("Playlist selection required"));
		}
		return this.state.spotify.getPlaylistTracks(this.state.selectedPlaylist.id, { offset });
	}

	private playlistTracksToStrings(playlistTracks: SpotifyApi.PlaylistTrackResponse): string[] {
		return playlistTracks.items.filter((track: SpotifyApi.PlaylistTrackObject): boolean => {
			return track.track !== null;
		}).map((track: SpotifyApi.PlaylistTrackObject): BasicTrackInfo => {
			return {
				album: track.track.album.name,
				artists: track.track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => { return artist.name; }),
				title: track.track.name,
				spotifyId: track.track.id
			};
		}).map((track: BasicTrackInfo) => {
			return JSON.stringify(track);
		});
	}

	private async performIgnitionSearch(): Promise<void> {
		ReactGA.event({
			category: 'SpotifyToIgnition',
			action: 'Started a search'
		});

		// Start WS connection
		const ws: WebSocket = new WebSocket(`ws://${window.location.hostname}:${process.env.WEBSOCKET_SERVER_PORT!}`);

		let offset: number = 0;
		do {
			let playlistTracks: SpotifyApi.PlaylistTrackResponse;
			try {
				playlistTracks = await this.getPageOfPlaylistTracks(offset);
			} catch (err) {
				playlistTracks = await handleExpiredSpotifyToken(
					this.state.downloadAbort.signal,
					this.state.spotify,
					() => { return this.getPageOfPlaylistTracks(offset); }
				)(err);
			}

			if (playlistTracks.items.length === 0) {
				break;
			}

			this.playlistTracksToStrings(playlistTracks).forEach((track: string) => {
				ws.send(track);
			});
			offset += playlistTracks.items.length;
		// eslint-disable-next-line no-constant-condition
		} while (true);
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
			songs={this.state.songs} /> : <></>;
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
						disabled={this.state.selectedPlaylist && !this.state.songs}/>
				</Col></Row>
			</Col>
			<Col>{localResults}</Col>
		</Row>;
	}
}