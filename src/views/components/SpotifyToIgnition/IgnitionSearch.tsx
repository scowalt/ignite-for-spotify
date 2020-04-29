import { Song } from "../../../db/models/Song";
import React, { ReactNode } from "react";
import { Table } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-js";
import { BasicTrackInfo } from "../../../types/BasicTrackInfo";
import update from 'immutability-helper';
import { handleExpiredSpotifyToken } from "../../common/SpotifyHelpers";

interface IgnitionSearchProps extends React.Props<{}> {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlist: SpotifyApi.PlaylistObjectSimplified;
}

interface IgnitionSearchState {
	downloadAbort: AbortController;
	songs?: Song[];
}
export class IgnitionSearch extends React.Component<IgnitionSearchProps, IgnitionSearchState> {
	constructor(props: IgnitionSearchProps) {
		super(props);

		this.state = { downloadAbort: new AbortController() };

		this.performIgnitionSearch();
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	private performIgnitionSearch(): Promise<any> {
		return this.props.spotify.getPlaylistTracks(this.props.playlist.id)
			.catch(handleExpiredSpotifyToken(
				this.state.downloadAbort.signal,
				this.props.spotify,
				() => { return this.performIgnitionSearch(); }
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
					songs: {$set: response as Song[]}
				}));
			});
	}

	render(): ReactNode {
		let results: ReactNode[] = [];
		if (!this.state.songs) {
			results.push(<tr key="loading"><td colSpan={100}>Loading...</td></tr>);
		} else if (this.state.songs.length === 0) {
			results.push(<tr key="whoopsies"><td colSpan={100}>No songs found</td></tr>);
		} else {
			results = this.state.songs.map((song: Song, index: number) => {
				return <tr key={index}>
					<td>{song.title}</td>
					<td>{song.artist}</td>
					<td>{song.album}</td>
					<td>{song.author}</td>
					<td><a href={`http://customsforge.com/process.php?id=${song.id}`} target="_blank" rel="noopener noreferrer">Download</a></td>
				</tr>;
			});
		}

		return <Table striped bordered hover>
			<thead>
				<tr>
					<th>Title</th>
					<th>Artist</th>
					<th>Album</th>
					<th>Author</th>
					<th>Download link</th>
				</tr>
			</thead>
			<tbody>
				{results}
			</tbody>
		</Table>;
	}
}