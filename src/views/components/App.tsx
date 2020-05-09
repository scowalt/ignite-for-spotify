import React, { ReactNode } from "react";
import { TitleBar } from "./TitleBar";
import { Home } from "./Home";
import { Switch, Route } from "react-router-dom";
import { NotFound } from "./NotFound";
import { About } from "./About";

export class App extends React.Component {
	render(): ReactNode {
		// TODO add app version somewhere
		return <>
			<TitleBar></TitleBar>
			<Switch>
				<Route exact path="/" component={Home}></Route>
				<Route exact path="/about" component={About}></Route>
				<Route component={NotFound}></Route>
			</Switch>
		</>;
	}
}