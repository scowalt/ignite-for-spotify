import ReactDOM from 'react-dom';
import React from 'react';

class Index extends React.Component<{}, {}> {
	constructor(props: React.Props<{}>) {
		super(props);
	}

	render() {
		return "Hello world!";
	}
}

const domcontainer = document.querySelector("#root");
ReactDOM.render(<Index />, domcontainer);
