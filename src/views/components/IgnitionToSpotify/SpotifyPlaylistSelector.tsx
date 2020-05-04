import { connect, FormikProps } from "formik";
import React, { ReactNode } from "react";
import { SpotifyPlaylistListLoader } from "../shared/SpotifyPlaylistListLoader";
import SpotifyWebApi from "spotify-web-api-js";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { FaSpotify } from "react-icons/fa";
import update from 'immutability-helper';
import { IgnitionSearchQuery } from "../../../types/IgnitionSearchQuery";
import { Row, Col, Alert } from "react-bootstrap";

interface Props {
	auth: SpotifyAuthInfo;
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

	onCreateNewClicked(): void {
		this.props.formik.setFieldValue('havePlaylistId', false);
		this.props.formik.setFieldValue('playlistDescriptor', this.state.playlistName);
	}

	onPlaylistClicked(playlist: SpotifyApi.PlaylistObjectSimplified): void {
		this.props.formik.setFieldValue('havePlaylistId', true);
		this.props.formik.setFieldValue('playlistDescriptor', playlist.id);
	}

	handlePlaylistNameChange(event: React.ChangeEvent<HTMLInputElement>): void {
		this.setState(update(this.state, {
			playlistName: { $set: event.target.value }
		}));
	}

	render(): ReactNode {
		// BUG this.props.formik.errors doesn't have the right type because of the way I'm inferring IgnitionSearchQuery from the schema

		// eslint-disable-next-line no-console
		console.log(this.props.formik.errors);
		return <>
			{(this.props.formik.errors as any).playlistDescriptor ? <Row><Col>
				<Alert variant="warning" >Playlist selection required</Alert>
			</Col></Row> : <></>}
			<ul className="nav nav-pills nav-fill mb-3" id="pills-tab" role="tablist">
				<li className="nav-item">
					<a className="nav-link active" id="pills-existing-tab" href="#pills-existing" data-toggle="pill" role="tab" aria-controls="pills-existing" aria-selected="true">
						Select an existing <FaSpotify />Spotify playlist
					</a>
				</li>
				<li className="nav-item" onClick={this.onCreateNewClicked.bind(this)}>
					<a className="nav-link" id="pills-new-tab" href="#pills-new" data-toggle="pill" role="tab" aria-controls="pills-new" aria-selected="false">
						Create a new <FaSpotify />Spotify playlist
					</a>
				</li>
			</ul>
			<div className="tab-content" id="pills-tabContent">
				<div className="tab-pane fade show active" id="pills-existing" role="tabpanel" aria-labelledby="pills-existing-tab">
					<SpotifyPlaylistListLoader
						spotify={this.state.spotify}
						onPlaylistClicked={this.onPlaylistClicked.bind(this)}
						playlistsPerRequest={5}/>
				</div>
				<div className="tab-pane fade" id="pills-new" role="tabpanel" aria-labelledby="pills-new-tab">
					<input className="playlistNameInput" type="text" placeholder="Playlist Name (optional)" onChange={this.handlePlaylistNameChange.bind(this)}></input>
				</div>
			</div>
		</>;
	}
}

export default connect(SpotifyPlaylistSelector);