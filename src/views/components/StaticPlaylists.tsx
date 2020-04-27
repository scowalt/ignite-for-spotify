import React, { ReactNode, ReactElement } from "react";
import update from 'immutability-helper';
import { PlaylistApiInfo } from "../../types/PlaylistApiInfo";

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
		return <iframe
			key={key}
			src={`https://open.spotify.com/embed/playlist/${playlistId}`}
			className="spotifyPlaylistEmbed"
			allow="encrypted-media"></iframe>;
	}

	render(): ReactNode {
		if (!this.state.playlists) {
			return <>Loading</>;
		} else {
			return <>
				{this.state.playlists.map((playlist: PlaylistApiInfo, index: number) => {
					return this.createEmbededPlaylist(playlist.spotifyId, index);
				})}
			</>;
		}
	}
}