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

	private startIgnitionSearch(): Promise<SpotifyApi.PlaylistTrackResponse> {
		if (!this.state.selectedPlaylist) {
			return Promise.reject(new Error("Playlist selection required"));
		}
		return this.state.spotify.getPlaylistTracks(this.state.selectedPlaylist.id);
	}

	private performIgnitionSearch(): Promise<any> {
		return this.startIgnitionSearch()
			.catch(handleExpiredSpotifyToken(
				this.state.downloadAbort.signal,
				this.state.spotify,
				() => { return this.startIgnitionSearch(); }
			)).then((playlistTracks: SpotifyApi.PlaylistTrackResponse) => {
				// scrape just the track info from this response (that's all the server needs)
				const tracks: SpotifyApi.TrackObjectFull[] = playlistTracks.items.map((playlistTrack: SpotifyApi.PlaylistTrackObject) => { return playlistTrack.track; });
				const basicTracks: BasicTrackInfo[] = tracks.map((track: SpotifyApi.TrackObjectFull) => {
					return {
						album: track.album.name,
						artists: track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => { return artist.name; }),
						title: track.name,
						spotifyId: track.id
					};
				});
				return fetch('/getIgnitionInfo', {
					method: "POST",
					body: JSON.stringify(basicTracks),
					signal: this.state.downloadAbort.signal,
					headers: {
						'Content-Type': 'application/json'
					},
				});
			}).then((response: Response) => {
				return response.json();
			}).then((response: any) => {
				this.setState(update(this.state, {
					songs: { $set: response as Song[] }
				}));
			});
	}

	private actOnPlaylist(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		this.setState(update(this.state, {
			selectedPlaylist: { $set: playlist }
		}));
	}

	render(): ReactNode {
		// TODO playlist options should be disabled while the results are loading
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
						spotify={this.state.spotify} />
				</Col></Row>
			</Col>
			<Col>{localResults}</Col>
		</Row>;
	}
}