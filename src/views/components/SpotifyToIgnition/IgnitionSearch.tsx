import { Song } from "../../../db/models/Song";
import React, { ReactNode } from "react";
import { Table, Spinner } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-js";
import { FaCheckCircle } from "react-icons/fa";

interface IgnitionSearchProps extends React.Props<{}> {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlist: SpotifyApi.PlaylistObjectSimplified;
	songs: Song[];
	done: boolean;
}

export class IgnitionSearch extends React.Component<IgnitionSearchProps> {
	render(): ReactNode {
		const results: ReactNode[] = this.props.songs.map((song: Song, index: number) => {
			return <tr key={index}>
				<td><a href={`http://customsforge.com/process.php?id=${song.id}`} target="_blank" rel="noopener noreferrer">Download</a></td>
				<td>{song.title}</td>
				<td>{song.artist}</td>
				<td>{song.album}</td>
				<td>{song.author}</td>
				<td>{song.lead ? <FaCheckCircle /> : <></>}</td>
				<td>{song.rhythm ? <FaCheckCircle /> : <></>}</td>
				<td>{song.bass ? <FaCheckCircle /> : <></>}</td>
				<td>{song.vocals ? <FaCheckCircle /> : <></>}</td>
			</tr>;
		});
		if (this.props.songs.length === 0 && this.props.done){
			results.push(<tr key="whoopsies"><td colSpan={100}>No songs found</td></tr>);
		}
		if (!this.props.done) {
			results.push(<tr key="loading"><td colSpan={100}>
				<Spinner animation="border" role="status" className="PlaylistListItemSpinner">
					<span className="sr-only">Loading...</span>
				</Spinner>
			</td></tr>);
		}

		return <Table striped bordered hover responsive>
			<thead>
				<tr>
					<th>Download link</th>
					<th>Title</th>
					<th>Artist</th>
					<th>Album</th>
					<th>Author</th>
					<th>Lead</th>
					<th>Rhythm</th>
					<th>Bass</th>
					<th>Vocals</th>
				</tr>
			</thead>
			<tbody>
				{results}
			</tbody>
		</Table>;
	}
}