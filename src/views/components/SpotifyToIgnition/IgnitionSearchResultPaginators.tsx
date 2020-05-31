import React, { ReactNode } from "react";
import { Pagination, Row, Col, Spinner } from "react-bootstrap";

interface Props extends React.Props<{}> {
	currentPage: number;
	pageCount: number;
	onSwitch: (page: number) => (() => void);
	done: boolean;
}

export class IgnitionSearchResultPaginators extends React.Component<Props> {
	render(): ReactNode {
		const paginators: ReactNode[] = [];
		for (let index: number = 0; index < this.props.pageCount; index ++) {
			paginators.push(
				<Pagination.Item
					key={index}
					active={index === this.props.currentPage}
					onClick={this.props.onSwitch(index)}>
					{index + 1}
				</Pagination.Item>
			);
		}

		if (!this.props.done) {
			paginators.push(
				<Pagination.Item key={"last"}>
					<Spinner animation="border" />
				</Pagination.Item>
			);
		}
		return <Row><Col>
			<Pagination className={"flex-wrap"}>{paginators}</Pagination>
		</Col></Row>;
	}
}
