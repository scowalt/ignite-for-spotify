import { Song } from "../../../db/models/Song";
import React, { ReactNode } from "react";
import { IgnitionSearchResultsTable } from "./IgnitionSearchResultsTable";
import update from 'immutability-helper';
import { IgnitionSearchResultPaginators } from "./IgnitionSearchResultPaginators";

const RESULTS_PER_PAGE: number = 10;

interface Props extends React.Props<{}> {
	songs: Song[];
	done: boolean;
}

interface State {
	page: number;
}

export class IgnitionSearchResults extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			page: 0
		};
	}

	onPageSwitch(page: number): (() => void) {
		return (): void => {
			this.setState(update(this.state, {
				page: { $set: page }
			}));
		};
	}

	render(): ReactNode {
		const startingIndex: number = this.state.page*RESULTS_PER_PAGE;
		const pageCount: number = Math.ceil(this.props.songs.length / RESULTS_PER_PAGE);
		const lastPage: boolean = this.state.page+1 === pageCount;
		return <>
			<IgnitionSearchResultsTable lastPage={lastPage} songs={this.props.songs.slice(startingIndex, startingIndex+RESULTS_PER_PAGE)} done={this.props.done} />
			<IgnitionSearchResultPaginators currentPage={this.state.page} pageCount={pageCount} onSwitch={this.onPageSwitch.bind(this)} done={this.props.done} />
		</>;
	}
}