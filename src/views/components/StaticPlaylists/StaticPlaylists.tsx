import React, { ReactNode } from "react";
import update from 'immutability-helper';
import { PlaylistApiInfo } from "../../../types/PlaylistApiInfo";
import { Row, Col } from "react-bootstrap";
import { FaSpotify } from "react-icons/fa";

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
				playlists: { $set: playlists }
			}));
		});
	}

	render(): ReactNode {
		if (!this.state.playlists) {
			return <>Loading</>;
		} else {
			return <Row><Col>
				<Row><Col>The entire CustomsForge Ignition library in {this.state.playlists.length} playlists.</Col></Row>
				<Row><Col>
					<ul>
						{this.state.playlists.map((playlist: PlaylistApiInfo, index: number) => {
							return <li key={index}>
								{<a href={`https://open.spotify.com/playlist/${playlist.spotifyId}`}><FaSpotify />Playlist {playlist.id}</a>}
							</li>;
						})}
					</ul>
				</Col></Row>
			</Col></Row>;
		}
	}
}