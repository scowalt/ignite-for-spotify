import React, { ReactNode } from "react";
import { TitleBar } from "./TitleBar";
import { Container } from "react-bootstrap";
import { Home } from "./Home";
import { Switch, Route } from "react-router-dom";
import { NotFound } from "./NotFound";

export class App extends React.Component {
	render(): ReactNode {
		return <>
			<TitleBar></TitleBar>
			<Container fluid>
				<Switch>
					<Route exact path="/" component={Home}></Route>
					<Route component={NotFound}></Route>
				</Switch>
			</Container>
		</>;
	}
}