import React, { ReactNode } from "react";
import { Button, Form, Col, Row } from "react-bootstrap";
import { IgnitionToSpotifyDataSchema, IgnitionToSpotifyData } from "../../../types/IgnitionToSpotifyData";
import { Formik, Field, FormikProps, FormikErrors } from 'formik';
import _ from 'lodash';
import SpotifyPlaylistSelector from "./SpotifyPlaylistSelector";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { ZodError } from "zod";

// HACK: Initialize the string values here to avoid "A component is changing an uncontrolled input" errors
const initialValues: IgnitionToSpotifyData = {
	artist: "",
	album: "",
	author: "",
	playlistInfo: {
		havePlaylistId: false,
		playlistDescriptor: ""
	},
};
interface Props extends React.Props<{}> {
	spotifyAuth: SpotifyAuthInfo;
}
export class IgnitionSearchForm extends React.Component<Props> {
	makeOptionalString(formikProps: FormikProps<IgnitionToSpotifyData>): (name: keyof IgnitionToSpotifyData) => ReactNode {
		return (name: keyof IgnitionToSpotifyData): ReactNode => {
			return <Col key={name}><label htmlFor={name}>
				<div>{_.upperFirst(name)}</div>
				<Field type="text" name={name} placeholder={`optional`} disabled={formikProps.isSubmitting}></Field>
			</label></Col>;
		};
	}

	makeOptionalBoolean(formikProps: FormikProps<IgnitionToSpotifyData>): (part: keyof IgnitionToSpotifyData) => ReactNode {
		return (part: keyof IgnitionToSpotifyData): ReactNode => {
			return <Col key={part}>
				<label htmlFor={part}>
					<div>{_.upperFirst(part)}</div>
					<Field as="select" name={part} placeholder={part} disabled={formikProps.isSubmitting}>
						<option value={""}></option>
						<option value={"true"}>Yes</option>
						<option value={"false"}>No</option>
					</Field>
				</label>
			</Col>;
		};
	}

	onSubmit(values: IgnitionToSpotifyData): Promise<any> {
		// Work-around: All of the fields in Formik will be stored as strings (see https://github.com/jaredpalmer/formik/issues/1525)
		// yup's `cast` function will help convert these string values into their correct types. One exception to this is with optional
		// types. Formik must have all values be initialized in order to work. So, remove all empty strings here (treat them as `undefined`)
		const prunedValues: IgnitionToSpotifyData = _.omitBy(values, (property) => { return typeof property === "string" && property.length === 0;}) as IgnitionToSpotifyData;

		// TODO trim whitespaces
		// eslint-disable-next-line no-console
		console.log(prunedValues); // TODO

		return new Promise<any>((resolve: (value?: any) => void): void => {
			setTimeout(resolve, 5000);
		});
	}

	validate(values: IgnitionToSpotifyData): Promise<FormikErrors<IgnitionToSpotifyData>> {
		try {
			IgnitionToSpotifyDataSchema.parse(values);
		} catch(error) {
			const formikErrors: FormikErrors<IgnitionToSpotifyData> = {};
			const zodError: ZodError = error as ZodError;

			zodError.errors.forEach((subError) => {
				const key: keyof IgnitionToSpotifyData = subError.path[0] as keyof IgnitionToSpotifyData;
				formikErrors[key] = subError.message;
			});

			return Promise.resolve(formikErrors);
		}

		return Promise.resolve({});
	}

	render(): ReactNode {
		return <>
			<Formik
				initialValues={initialValues}
				onSubmit={this.onSubmit.bind(this)}
				validateOnChange={false} // Only validate on change to avoid noisy errors while the user is entering playlist info
				validate={this.validate.bind(this)}>
				{( formikProps: FormikProps<IgnitionToSpotifyData> ): ReactNode => (
					<Form onSubmit={formikProps.handleSubmit}>
						<Row className="formRow">
							<Col>
								<Row>
									<Col><h3>Ignition Search Options</h3></Col>
								</Row>
								<Row>
									{(['artist', 'album', 'author'] as (keyof IgnitionToSpotifyData)[]).map(this.makeOptionalString(formikProps))}
								</Row>
								<Row>
									{(['lead', 'rhythm', 'bass', 'vocals', 'dynamicDifficulty'] as (keyof IgnitionToSpotifyData)[]).map(this.makeOptionalBoolean(formikProps))}
								</Row>
							</Col>
							<Col>
								<SpotifyPlaylistSelector
									name="playlistInfo"
									auth={this.props.spotifyAuth}
									formik={formikProps}/>
							</Col>
						</Row>
						<Row><Col>
							<Button type="submit" disabled={formikProps.isSubmitting} block>
								Submit
							</Button>
						</Col></Row>
					</Form>
				)}
			</Formik>
		</>;
	}
}
