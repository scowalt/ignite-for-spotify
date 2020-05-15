import React, { ReactNode } from "react";
import { ServerStatsData } from "../../../types/ServerStatsData";
import update from 'immutability-helper';
import { FaSpotify } from "react-icons/fa";

interface State {
	downloadAbort: AbortController;
	stats?: ServerStatsData;
}
export class ServerStats extends React.Component<React.Props<{}>, State> {
	constructor(props: React.Props<{}>) {
		super(props);
		this.state = {
			downloadAbort: new AbortController()
		};

		this.fetchServerStats();
	}

	private async fetchServerStats(): Promise<void> {
		const response: Response = await fetch('/getStats');
		const stats: ServerStatsData = await response.json();
		this.setState(update(this.state, {
			stats: { $set: stats }
		}));
	}

	componentWillUnmount(): void {
		this.state.downloadAbort.abort();
	}

	render(): ReactNode {
		if (!this.state.stats) {
			return null;
		} else {
			return <>Tracking {
				Intl.NumberFormat().format(this.state.stats.totalSongs)
			} songs from CustomsForge Ignition. Found {
				Intl.NumberFormat().format(this.state.stats.songsWithSpotifyTrack)
			} corresponding <FaSpotify/>Spotify tracks.</>;
		}
	}
}