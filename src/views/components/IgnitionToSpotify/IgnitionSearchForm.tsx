import React, { ReactNode } from "react";
import { Button, Form, Col, Row } from "react-bootstrap";
import { IgnitionSearchQuerySchema, IgnitionSearchQuery } from "../../../types/IgnitionSearchQuery";
import { Formik, Field, FormikProps } from 'formik';
import _ from 'lodash';
import SpotifyPlaylistSelector from "./SpotifyPlaylistSelector";
import update from 'immutability-helper';
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";

// IgnitionSearchQuery is what will be sent to the API. The form also includes playlist information
export type Submission = IgnitionSearchQuery & {
	playlistPromise?: () => Promise<SpotifyApi.PlaylistBaseObject>;
};


// HACK: Initialize the string values here to avoid "A component is changing an uncontrolled input" errors
const initialValues: IgnitionSearchQuery = {
	artist: "",
	album: "",
	author: ""
};
interface Props extends React.Props<{}> {
	spotifyAuth: SpotifyAuthInfo;
}
export class IgnitionSearchForm extends React.Component<Props> {
	makeOptionalString(name: keyof IgnitionSearchQuery): ReactNode {
		return <Col key={name}><label htmlFor={name}>
			<div>{_.upperFirst(name)}</div>
			<Field type="text" name={name} placeholder={`optional`}></Field>
		</label></Col>;
	}

	makeOptionalBoolean(part: keyof IgnitionSearchQuery): ReactNode {
		return <Col key={part}>
			<label htmlFor={part}>
				<div>{_.upperFirst(part)}</div>
				<Field as="select" name={part} placeholder={part}>
					<option value={""}></option>
					<option value={"true"}>Yes</option>
					<option value={"false"}>No</option>
				</Field>
			</label>
		</Col>;
	}

	onSubmit(values: any): Promise<any> {
		// Work-around: All of the fields in Formik will be stored as strings (see https://github.com/jaredpalmer/formik/issues/1525)
		// yup's `cast` function will help convert these string values into their correct types. One exception to this is with optional
		// types. Formik must have all values be initialized in order to work. So, remove all empty strings here (treat them as `undefined`)
		const submission: Submission = _.omitBy(values, (property: any) => { return typeof property === "string" && property.length === 0;});

		if (!submission.playlistPromise) {
			return Promise.reject("No playlist selected");
		}

		// Submission needs the non-API values removed before make the API call
		const playlistPromise: (() => Promise<SpotifyApi.PlaylistBaseObject>) = submission.playlistPromise;
		playlistPromise().then((value: SpotifyApi.PlaylistBaseObject) => {
			// eslint-disable-next-line no-console
			console.log(value); // TODO
		});

		// TODO make sure trailing spaces are trimmed here
		const prunedValues: IgnitionSearchQuery = _.omit(submission, "playlistPromise");
		const query: IgnitionSearchQuery = IgnitionSearchQuerySchema.cast(prunedValues);
		// eslint-disable-next-line no-console
		console.log(query); // TODO
		return Promise.resolve();
	}

	setPlaylistFunction(playlistPromiseFunction: (() => Promise<SpotifyApi.PlaylistBaseObject>)): void {
		this.setState(update(this.state, {
			getPlaylist: { $set: playlistPromiseFunction }
		}));
	}

	render(): ReactNode {
		// TODO replace validation schema
		return <>
			<Formik
				initialValues={initialValues}
				onSubmit={this.onSubmit.bind(this)}
				validationSchema={IgnitionSearchQuerySchema}>
				{( formikProps: FormikProps<Submission> ): ReactNode => (
					<Form onSubmit={formikProps.handleSubmit}>
						<Row>
							<Col>
								<Row>
									{(['artist', 'album', 'author'] as (keyof IgnitionSearchQuery)[]).map(this.makeOptionalString.bind(this))}
								</Row>
								<Row>
									{(['lead', 'rhythm', 'bass', 'vocals', 'dynamicDifficulty'] as (keyof IgnitionSearchQuery)[]).map(this.makeOptionalBoolean.bind(this))}
								</Row>
							</Col>
							<Col>
								<SpotifyPlaylistSelector
									auth={this.props.spotifyAuth}
									name="playlistPromise"
									formik={formikProps}/>
							</Col>
						</Row>
						<Row>
							<Button type="submit" disabled={formikProps.isSubmitting}>
								Submit
							</Button>
						</Row>
					</Form>
				)}
			</Formik>
		</>;
	}
}
