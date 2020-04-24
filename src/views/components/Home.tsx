import React, { ReactNode } from "react";
import { Playlists } from "./Playlists";

export class Home extends React.Component<{}, {}> {
	render(): ReactNode {
		return <><h1>Hello world!</h1><Playlists></Playlists></>;
	}
}