import React, { ReactNode } from "react";

interface EmbededSpotifyPlaylistProps extends React.Props<{}> {
	playlistId: string;
}
export class EmbededSpotifyPlaylist extends React.Component<EmbededSpotifyPlaylistProps> {
	render(): ReactNode {
		// TODO consider removing these, since they load extra stuff to the site
		return <div className={"spotifyPlaylistEmbedWrapper"}>
			<iframe
				src={`https://open.spotify.com/embed/playlist/${this.props.playlistId}`}
				className="spotifyPlaylistEmbed"
				allow="encrypted-media"></iframe>
		</div>;
	}
}