import ReactDOM from 'react-dom';
import React from 'react';
import { Button } from 'react-bootstrap';
import Cookie from 'js-cookie';

class Index extends React.Component<{}, {}> {
	constructor(props: React.Props<{}>) {
		super(props);
		if (Cookie.get("spotifyAccessToken") !== undefined) {
			this.startPlaylistRetrieval();
		}
	}

	startPlaylistRetrieval() {
		const init: RequestInit = {
			method: "GET",
			headers: {
				"Accept": "application/json",
				'Authorization': 'Bearer ' + Cookie.get("spotifyAccessToken")
			}
		};
		fetch('https://api.spotify.com/v1/me/playlists', init).then((response: Response) => {
			return response.json();
		}).then((body) => {
			body.toString();
		});
	}

	render() {
		if (Cookie.get("spotifyAccessToken") === undefined) {
			return <Button onClick={() => {
				window.location.replace(window.location.origin + "/login");
			}}>
				Login through Spotify
			</Button>;
		} else {
			return <>Authenticated</>;
		}
	}
}

const domcontainer = document.querySelector("#root");
ReactDOM.render(<Index />, domcontainer);
