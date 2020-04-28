import { Song } from "../../db/models/Song";
import React, { ReactNode } from "react";
import { Table } from "react-bootstrap";

interface IgnitionResultsProps extends React.Props<{}> {
	songs: Song[];
}
export class IgnitionResults extends React.Component<IgnitionResultsProps, {}> {
	render(): ReactNode {
		let results: ReactNode[] = [];
		if (this.props.songs.length === 0) {
			results.push(<tr key="whoopsies"><td>No songs found</td></tr>);
		} else {
			results = this.props.songs.map((song: Song, index: number) => {
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