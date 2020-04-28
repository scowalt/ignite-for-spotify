import React, { ReactNode } from "react";
import { Row, Pagination, ListGroup } from "react-bootstrap";
import { PLAYLISTS_PER_REQUEST } from "./SpotifyToIgnition";
import { PlaylistListItem } from "./PlaylistListItem";

interface SpotifyPlaylistListProps extends React.Props<{}> {
	playlists: SpotifyApi.ListOfUsersPlaylistsResponse;
	onPlaylistClicked: (playlist: SpotifyApi.PlaylistObjectSimplified) => void;
	onPageSwitch: (offset: number) => void;
}

export class SpotifyPlaylistList extends React.Component<SpotifyPlaylistListProps,{}> {
	// Zero-based page number for playlists
	private static getCurrentPageNumber(playlists: SpotifyApi.ListOfUsersPlaylistsResponse): number {
		return Math.floor(playlists.offset / PLAYLISTS_PER_REQUEST);
	}

	private static getTotalPages(playlists: SpotifyApi.ListOfUsersPlaylistsResponse): number {
		return Math.floor(playlists.total / PLAYLISTS_PER_REQUEST)+1;
	}

	render(): ReactNode {
		// TODO add playlist images (available from the spotify api)
		// TODO show number of tracks for each listing
		const playlists: ReactNode[] = this.props.playlists.items.map((playlist: SpotifyApi.PlaylistObjectSimplified, index: number) => {
			return <PlaylistListItem
				key={index}
				playlist={playlist}
				onClick={(): void => {this.props.onPlaylistClicked(playlist);}} />;
		});
		const paginators: ReactNode[] = [];
		for (let index: number = 0; index < SpotifyPlaylistList.getTotalPages(this.props.playlists); index ++) {
			paginators.push(
				<Pagination.Item
					key={index}
					active={index === SpotifyPlaylistList.getCurrentPageNumber(this.props.playlists)}
					onClick={(): void => {this.props.onPageSwitch(index*PLAYLISTS_PER_REQUEST);}}>
					{index+1}
				</Pagination.Item>
			);
		}
		return <>
			<Row>
				<ListGroup className={"SpotifyPlaylistList"}>
					{ playlists }
				</ListGroup>
			</Row>
			<Row>
				<Pagination>{paginators}</Pagination>
			</Row>
		</>;
	}
}
