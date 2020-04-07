import ReactDOM from 'react-dom';
import React from 'react';
import { Button } from 'react-bootstrap';

class Index extends React.Component<{}, {}> {
	constructor(props: React.Props<{}>) {
		super(props);
	}

	render() {
		return <Button>
			Login through Spotify
		</Button>;
	}
}

const domcontainer = document.querySelector("#root");
ReactDOM.render(<Index />, domcontainer);
