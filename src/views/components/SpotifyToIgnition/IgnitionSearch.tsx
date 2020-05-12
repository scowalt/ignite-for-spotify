import { Song } from "../../../db/models/Song";
import React, { ReactNode } from "react";
import { Table } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-js";
import { FaCheckCircle } from "react-icons/fa";

interface IgnitionSearchProps extends React.Props<{}> {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlist: SpotifyApi.PlaylistObjectSimplified;
	songs?: Song[];
}

export class IgnitionSearch extends React.Component<IgnitionSearchProps> {
	render(): ReactNode {
		let results: ReactNode[] = [];
		if (!this.props.songs) {
			results.push(<tr key="loading"><td colSpan={100}>Loading...</td></tr>);
		} else if (this.props.songs.length === 0) {
			results.push(<tr key="whoopsies"><td colSpan={100}>No songs found</td></tr>);
		} else {
			results = this.props.songs.map((song: Song, index: number) => {
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