import React, { ReactNode, ReactElement } from "react";
import update from 'immutability-helper';
import { PlaylistApiInfo } from "../../../types/PlaylistApiInfo";
import { Row, Col } from "react-bootstrap";
import { EmbededSpotifyPlaylist } from "./EmbededSpotifyPlaylist";

interface PlaylistsState {
	downloadAbort: AbortController;
	playlists?: PlaylistApiInfo[];
}
export class StaticPlaylists extends React.Component<{}, PlaylistsState> {
	constructor(props: React.Props<{}>) {
		super(props);
		this.state = {
			downloadAbort: new AbortController(),
		};
		this.getPlaylists();
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	getPlaylists(): Promise<void> {
		const signal: AbortSignal = this.state.downloadAbort.signal;
		return fetch('/getPlaylists', {
			signal
		}).then((response: Response) => {
			if (this.state.downloadAbort.signal.aborted) {
				return Promise.reject('Request aborted');
			}
			return response.json();
		}).then((response: any) => {
			if (this.state.downloadAbort.signal.aborted) {
				return Promise.reject('Request aborted');
			}
			return Promise.resolve(response as PlaylistApiInfo[]);
		}).then((playlists: PlaylistApiInfo[]) => {
			if (this.state.downloadAbort.signal.aborted) {
				return Promise.reject('Request aborted');
			}
			this.setState(update(this.state, {
				playlists: {$set: playlists}
			}));
		});
	}

	createEmbededPlaylist(playlistId: string, key: number): ReactElement {
		return <EmbededSpotifyPlaylist key={key} playlistId={playlistId}></EmbededSpotifyPlaylist>;
	}

	render(): ReactNode {
		if (!this.state.playlists) {
			return <>Loading</>;
		} else {
			return <Row><Col>
				<Row><Col>The entire CustomsForge library in {this.state.playlists.length} playlists. Click on each playlist to follow them all!</Col></Row>
				<Row>
					{this.state.playlists.map((playlist: PlaylistApiInfo, index: number) => {
						return <Col
							key={index}
							className={"spotifyPlaylistEmbedWrapperCol"}>
							{this.createEmbededPlaylist(playlist.spotifyId, index)}
						</Col>;
					})}
				</Row>
			</Col></Row>;
		}
	}
}