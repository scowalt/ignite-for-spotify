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
import Chance from 'chance';
import { IgnitionSearchJobData } from "../../../shared/QueueManager";
import { JobType } from "../../../types/JobType";
import { WaitForCompletedJob } from "../shared/WaitForCompletedJob";

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

	private async performIgnitionSearch(): Promise<void> {
		let playlistTracks: SpotifyApi.PlaylistTrackResponse;
		try {
			playlistTracks = await this.startIgnitionSearch();
		} catch(err) {
			playlistTracks = await handleExpiredSpotifyToken(
				this.state.downloadAbort.signal,
				this.state.spotify,
				() => { return this.startIgnitionSearch(); }
			)(err);
		}

		const tracks: SpotifyApi.TrackObjectFull[] = playlistTracks.items.map((playlistTrack: SpotifyApi.PlaylistTrackObject) => { return playlistTrack.track; });
		const basicTracks: BasicTrackInfo[] = tracks.map((track: SpotifyApi.TrackObjectFull) => {
			return {
				album: track.album.name,
				artists: track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => { return artist.name; }),
				title: track.name,
				spotifyId: track.id
			};
		});

		const chance: Chance.Chance = new Chance();
		const password: string = chance.string({ length: 16, alpha: true, numeric: true });
		const jobData: IgnitionSearchJobData = { password, tracks: basicTracks };
		const startJobResponse: Response = await fetch('/startJob', {
			method: "POST",
			body: JSON.stringify({
				jobType: JobType.IgnitionSearch,
				data: jobData
			}),
			signal: this.state.downloadAbort.signal,
			headers: {
				'Content-Type': 'application/json'
			},
		});
		const startJobResponseBody: any = await startJobResponse.json();
		const completedJobBody: any = await WaitForCompletedJob(JobType.IgnitionSearch, startJobResponseBody.id, password);
		this.setState(update(this.state, {
			songs: { $set: completedJobBody.songs }
		}));
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