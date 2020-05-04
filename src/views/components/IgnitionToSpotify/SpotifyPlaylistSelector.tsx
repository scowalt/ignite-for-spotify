import { connect, FormikProps } from "formik";
import React, { ReactNode } from "react";
import { SpotifyPlaylistListLoader } from "../shared/SpotifyPlaylistListLoader";
import SpotifyWebApi from "spotify-web-api-js";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { FaSpotify } from "react-icons/fa";
import update from 'immutability-helper';
import { IgnitionSearchQuery } from "../../../types/IgnitionSearchQuery";
import { Row, Col, Alert, Nav, TabContent } from "react-bootstrap";

interface Props {
	auth: SpotifyAuthInfo;
	name: string;
	formik: FormikProps<IgnitionSearchQuery>;
}
interface State {
	readonly spotify: SpotifyWebApi.SpotifyWebApiJs;
	playlistName: string;
}
class SpotifyPlaylistSelector extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			spotify: new SpotifyWebApi(),
			playlistName: ""
		};
		this.state.spotify.setAccessToken(props.auth.spotifyAccessToken);
	}

	componentDidUpdate(_previousProps: Props, previousState: State): void {
		if (previousState.playlistName !== this.state.playlistName) {
			// State updated internal to object. Need to make sure formik receives this state update too.
			this.onCreateNewClicked();
		}
	}

	onCreateNewClicked(): void {
		this.props.formik.setFieldValue(this.props.name, {
			havePlaylistId: false,
			playlistDescriptor: this.state.playlistName
		});
	}

	onPlaylistClicked(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		this.props.formik.setFieldValue(this.props.name, {
			havePlaylistId: true,
			playlistDescriptor: playlist.id
		});
	}

	handlePlaylistNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
		this.setState(update(this.state, {
			playlistName: { $set: event.target.value }
		}));
	}

	render(): ReactNode {
		// BUG this.props.formik.errors doesn't have the right type because of the way I'm inferring IgnitionSearchQuery from the schema
		return <>
			{(this.props.formik.errors as any).playlistInfo ? <Row><Col>
				<Alert variant="warning" >Playlist selection required</Alert>
			</Col></Row> : <></>}
			<Nav fill variant="pills" className="mb-3" role="tablist" id="pills-tab" defaultActiveKey="#pills-existing">
				<Nav.Item>
					<Nav.Link href="#pills-existing" data-toggle="pill">Select an existing <FaSpotify />Spotify playlist</Nav.Link>
				</Nav.Item>
				<Nav.Item onClick={this.onCreateNewClicked.bind(this)}>
					<Nav.Link href="#pills-new" data-toggle="pill">Create a new <FaSpotify />Spotify playlist</Nav.Link>
				</Nav.Item>
			</Nav>
			<TabContent id="pills-tabContent">
				<div className="tab-pane fade show active" id="pills-existing" role="tabpanel" aria-labelledby="pills-existing-tab">
					<SpotifyPlaylistListLoader
						spotify={this.state.spotify}
						onPlaylistClicked={this.onPlaylistClicked.bind(this)}
						playlistsPerRequest={5}/>
				</div>
				<div className="tab-pane fade" id="pills-new" role="tabpanel" aria-labelledby="pills-new-tab">
					<input className="playlistNameInput" type="text" placeholder="Playlist Name (optional)" onChange={this.handlePlaylistNameChange.bind(this)}></input>
				</div>
			</TabContent>
		</>;
	}
}

export default connect(SpotifyPlaylistSelector);