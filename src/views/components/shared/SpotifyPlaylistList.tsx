import React, { ReactNode } from "react";
import { Row, Pagination, ListGroup, Spinner, Col } from "react-bootstrap";
import { PlaylistListItem } from "./PlaylistListItem";
import update from 'immutability-helper';

interface SpotifyPlaylistListProps extends React.Props<{}> {
	loading: boolean;
	playlists?: SpotifyApi.ListOfUsersPlaylistsResponse;
	onPlaylistClicked: (playlist: SpotifyApi.PlaylistObjectSimplified) => void;
	onPageSwitch: (offset: number) => void;
	playlistsPerRequest: number;
	disabled?: boolean;
}

interface State {
	selected?: number;
}

export class SpotifyPlaylistList extends React.Component<SpotifyPlaylistListProps,State> {
	constructor(props: SpotifyPlaylistListProps) {
		super(props);
		this.state = {};
	}

	// Zero-based page number for playlists
	private getCurrentPageNumber(playlists: SpotifyApi.ListOfUsersPlaylistsResponse): number {
		return Math.floor(playlists.offset / this.props.playlistsPerRequest);
	}

	private getTotalPages(playlists: SpotifyApi.ListOfUsersPlaylistsResponse): number {
		return Math.floor(playlists.total / this.props.playlistsPerRequest)+1;
	}

	onPlaylistSelected(playlist: SpotifyApi.PlaylistObjectSimplified, index: number): () => void {
		return (): void => {
			this.setState(update(this.state, {
				selected: { $set: index }
			}));
			this.props.onPlaylistClicked(playlist);
		};
	}

	onPageSwitch(index: number): () => void {
		return (): void => {
			this.setState(update(this.state, {
				// eslint-disable-next-line id-blacklist
				selected: { $set: undefined }
			}));
			this.props.onPageSwitch(index*this.props.playlistsPerRequest);
		};
	}

	render(): ReactNode {
		let playlists: ReactNode[] = [];
		if (!this.props.loading && this.props.playlists) {
			playlists = this.props.playlists.items.map((playlist: SpotifyApi.PlaylistObjectSimplified, index: number) => {
				return <PlaylistListItem
					disabled={this.props.disabled}
					key={index}
					playlist={playlist}
					selected={this.state.selected === index}
					onClick={this.onPlaylistSelected(playlist, index).bind(this)} />;
			});
		} else {
			for (let count: number = 0; count < this.props.playlistsPerRequest; count++) {
				playlists.push(<ListGroup.Item key={count}>
					<Spinner animation="border" role="status" className="PlaylistListItemSpinner">
						<span className="sr-only">Loading...</span>
					</Spinner></ListGroup.Item>);
			}
		}
		const paginators: ReactNode[] = [];
		if (this.props.playlists) {
			for (let index: number = 0; index < this.getTotalPages(this.props.playlists); index ++) {
				paginators.push(
					<Pagination.Item
						disabled={this.props.disabled}
						key={index}
						active={index === this.getCurrentPageNumber(this.props.playlists)}
						onClick={this.onPageSwitch(index)}>
						{index+1}
					</Pagination.Item>
				);
			}
		}
		return <>
			<Row><Col>
				<ListGroup className={"SpotifyPlaylistList"}>{ playlists }</ListGroup>
			</Col></Row>
			<Row><Col>
				<Pagination>{paginators}</Pagination>
			</Col></Row>
		</>;
	}
}
