import { ListGroup, Image } from "react-bootstrap";
import React, { ReactNode } from "react";
import { SimplifiedPlaylist } from "spotify-web-api-ts/types/types/SpotifyObjects";

interface PlaylistListItemProps extends React.Props<{}> {
	playlist: SimplifiedPlaylist;
	onClick: () => void;
	selected: boolean;
	disabled?: boolean;
}
export class PlaylistListItem extends React.Component<PlaylistListItemProps> {
	constructor(props: PlaylistListItemProps) {
		super(props);
	}

	render(): ReactNode {
		let image: ReactNode;
		if (this.props.playlist.images.length !== 0) {
			image = <Image
				fluid
				src={this.props.playlist.images[0].url}
				className="PlaylistListItemImage" />;
		}

		return <ListGroup.Item
			action
			disabled={this.props.disabled}
			onClick={this.props.onClick}
			type="button" // Avoid formik errors
			className={this.props.selected ? "selectedPlaylist" : ""}>
			{image}
			{this.props.playlist.name}
			<span className="font-italic"> ({this.props.playlist.tracks.total} tracks)</span>
		</ListGroup.Item>;
	}
}
