import { connect, FormikProps } from "formik";
import React, { ReactNode } from "react";
import { SpotifyPlaylistListLoader } from "../shared/SpotifyPlaylistListLoader";
import SpotifyWebApi from "spotify-web-api-js";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { FaSpotify } from "react-icons/fa";
import update from 'immutability-helper';
import { IgnitionToSpotifyData } from "../../../types/IgnitionToSpotifyData";
import { Row, Col, Alert, Nav, TabContent, TabPane } from "react-bootstrap";

interface Props {
	auth: SpotifyAuthInfo;
	name: string;
	formik: FormikProps<IgnitionToSpotifyData>;
}
interface State {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlistName: string;
	playlistId?: string;
}
class SpotifyPlaylistSelector extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			spotify: new SpotifyWebApi(),
			playlistName: "",
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);
	}

	componentDidUpdate(_previousProps: Props, previousState: State): void {
		if (previousState.playlistName !== this.state.playlistName) {
			// Internal object state has updated. Need to make sure formik receives this state update too.
			this.onCreateNewClicked();
		} else if (previousState.playlistId !== this.state.playlistId) {
			this.onSelectExistingClicked();
		}
	}

	onSelectExistingClicked(): void {
		this.props.formik.setFieldValue(this.props.name, {
			havePlaylistId: true,
			playlistDescriptor: this.state.playlistId
		});
	}

	onCreateNewClicked(): void {
		this.props.formik.setFieldValue(this.props.name, {
			havePlaylistId: false,
			playlistDescriptor: this.state.playlistName
		});
	}

	onPlaylistClicked(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		this.setState(update(this.state, {
			playlistId: { $set: playlist.id }
		}));
	}

	handlePlaylistNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
		this.setState(update(this.state, {
			playlistName: { $set: event.target.value }
		}));
	}

	render(): ReactNode {
		return <>
			{this.props.formik.errors.playlistInfo ? <Row><Col>
				<Alert variant="warning" >Playlist selection required</Alert>
			</Col></Row> : <></>}
			<Nav fill variant="pills" className="mb-3" role="tablist" id="pills-tab" defaultActiveKey="#pills-existing">
				<Nav.Item onClick={this.onSelectExistingClicked.bind(this)}>
					<Nav.Link href="#pills-existing" data-toggle="pill" disabled={this.props.formik.isSubmitting}>Select an existing <FaSpotify />Spotify playlist</Nav.Link>
				</Nav.Item>
				<Nav.Item onClick={this.onCreateNewClicked.bind(this)}>
					<Nav.Link href="#pills-new" data-toggle="pill" disabled={this.props.formik.isSubmitting}>Create a new <FaSpotify />Spotify playlist</Nav.Link>
				</Nav.Item>
			</Nav>
			<TabContent id="pills-tabContent">
				<TabPane active={true} id="pills-existing">
					<SpotifyPlaylistListLoader
						spotify={this.state.spotify}
						onPlaylistClicked={this.onPlaylistClicked.bind(this)}
						playlistsPerRequest={5}
						disabled={this.props.formik.isSubmitting} />
				</TabPane>
				<TabPane id="pills-new">
					<input
						className="playlistNameInput"
						type="text"
						placeholder="Playlist Name (required)"
						onChange={this.handlePlaylistNameChange.bind(this)}
						disabled={this.props.formik.isSubmitting} />
				</TabPane>
			</TabContent>
		</>;
	}
}

export default connect(SpotifyPlaylistSelector);