import React, { ReactNode } from "react";
import SpotifyWebApi from 'spotify-web-api-js';
import { SpotifyAuthInfo } from "./Generator";
import { Col, Row, Pagination, ListGroup } from "react-bootstrap";
import update from 'immutability-helper';

const PLAYLISTS_PER_REQUEST: number = 20;

interface SpotifySourceProps extends React.Props<{}> {
	auth: SpotifyAuthInfo;
}

interface SpotifySourceState {
	downloadAbort: AbortController;
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlists?: SpotifyApi.ListOfUsersPlaylistsResponse;
}
export class SpotifySource extends React.Component<SpotifySourceProps, SpotifySourceState> {
	constructor(props: SpotifySourceProps) {
		super(props);
		this.state = {
			// TODO use this to cancel requests
			downloadAbort: new AbortController(),
			spotify: new SpotifyWebApi()
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);

		this.getUserSpotifyPlaylists();
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	getUserSpotifyPlaylists(): Promise<any> {
		return this.state.spotify.getUserPlaylists(undefined, {
			limit: PLAYLISTS_PER_REQUEST
		}).then((value: SpotifyApi.ListOfUsersPlaylistsResponse) => {
			// TODO handle multiple pages of playlists
			if (!this.state.downloadAbort.signal.aborted) {
				this.setState(update(this.state, {
					playlists: {$set: value}
				}));
			}
		}).catch((xhr: XMLHttpRequest) => {
			if (!this.state.downloadAbort.signal.aborted && xhr.status === 401 && xhr.responseText.includes("The access token expired")) {
				return fetch('/refreshSpotifyAuth', {
					signal: this.state.downloadAbort.signal
				}).then((response: Response) => {
					return response.json();
				}).then((response: string) => {
					this.state.spotify.setAccessToken(response);
					if (!this.state.downloadAbort.signal.aborted) {
						return this.getUserSpotifyPlaylists();
					}
				});
			}
			return Promise.reject(xhr);
		});
	}

	// Zero-based page number for playlists
	static getCurrentPageNumber(playlists: SpotifyApi.ListOfUsersPlaylistsResponse): number {
		return Math.floor(playlists.offset / PLAYLISTS_PER_REQUEST);
	}

	static getTotalPages(playlists: SpotifyApi.ListOfUsersPlaylistsResponse): number {
		return Math.floor(playlists.total / PLAYLISTS_PER_REQUEST)+1;
	}

	render(): ReactNode {
		if (this.state.playlists) {
			const paginators: ReactNode[] = [];
			for (let index: number = 0; index < SpotifySource.getTotalPages(this.state.playlists); index ++) {
				paginators.push(
					<Pagination.Item key={index} active={index === SpotifySource.getCurrentPageNumber(this.state.playlists)}>
						{index+1}
					</Pagination.Item>
				);
			}
			return <Col>
				<Row><ListGroup>
					{
						this.state.playlists.items.map((playlist: SpotifyApi.PlaylistObjectSimplified, index: number) => {
							return <ListGroup.Item key={index}>{playlist.name}</ListGroup.Item>;
						})
					}
				</ListGroup></Row>
				<Row>
					<Pagination>{paginators}</Pagination>
				</Row>
			</Col>;
		}
		return <>Spotify Source</>;
	}
}