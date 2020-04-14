import Cookie from 'js-cookie';
import { Button } from 'react-bootstrap';
import React from 'react';
import ReactDOM from 'react-dom';
import update from 'immutability-helper';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/darkly/bootstrap.min.css';

interface AdminState {
	eventSource?: EventSource;
	eventConnectionOpen: boolean;
	log: string[];
}
class Index extends React.Component<{}, AdminState> {
	constructor(props: React.Props<{}>) {
		super(props);
		this.state = {
			eventSource: undefined,
			eventConnectionOpen: false,
			log: []
		};
	}

	eventConnectionOpen() {
		this.setState(update(this.state, {
			eventConnectionOpen: {$set: true}
		}));
	}

	eventMessage(event: MessageEvent) {
		this.setState(update(this.state, {
			log: {$push: [event.data.toString()]}
		}));
	}

	startIgnitionUpdate() {
		const eventSourceInit: EventSourceInit = {
			withCredentials: true
		};
		const eventSource: EventSource = new EventSource(window.location.origin + '/ignitionUpdate');
		const eventMessageHandler: (event: MessageEvent) => void = this.eventMessage.bind(this);

		eventSource.onopen = this.eventConnectionOpen.bind(this);
		eventSource.addEventListener('message', eventMessageHandler);

		// TODO handle this connection failing, have an error state
		eventSource.onerror = null;

		this.setState(update(this.state, {
			eventSource: {$set: eventSource}
		}));
	}

	render() {
		const spotifyAccessToken: string|undefined = Cookie.get("spotifyAccessToken");
		if (spotifyAccessToken === undefined) {
			return <Button onClick={() => {
				window.location.replace(window.location.origin + "/login");
			}}>
				Login through Spotify
			</Button>;
		} else if (this.state.eventSource === undefined) {
			return <Button onClick={this.startIgnitionUpdate.bind(this)}>Start ignition update</Button>;
		} else if (!this.state.eventConnectionOpen){
			return <>Starting playlist update...</>;
		} else {
			return <>Updaing playlist...{this.state.log.map((logEntry: string, index: number) => {
				return <div key={index}>{logEntry}</div>;
			})}</>;
		}
	}
}

const domcontainer = document.querySelector("#root");
ReactDOM.render(<Index />, domcontainer);
