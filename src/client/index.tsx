import ReactDOM from 'react-dom';
import React from 'react';
import { Button } from 'react-bootstrap';
import Cookie from 'js-cookie';
import { Playlists } from './components/Playlists';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/darkly/bootstrap.min.css';

class Index extends React.Component<{}, {}> {
	constructor(props: React.Props<{}>) {
		super(props);
	}

	render() {
		const spotifyAccessToken: string|undefined = Cookie.get("spotifyAccessToken");
		if (spotifyAccessToken === undefined) {
			return <Button onClick={() => {
				window.location.replace(window.location.origin + "/login");
			}}>
				Login through Spotify
			</Button>;
		} else {
			return <Playlists initialSpotifyAccessToken={spotifyAccessToken} spotifyRefreshToken={Cookie.get("spotifyRefreshToken")!} />;
		}
	}
}

const domcontainer = document.querySelector("#root");
ReactDOM.render(<Index />, domcontainer);
