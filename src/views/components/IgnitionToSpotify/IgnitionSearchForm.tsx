import React, { ReactNode } from "react";
import { Form, Col, Row } from "react-bootstrap";
import { Spec } from 'immutability-helper';
import { IgnitionSearchQuerySchema, IgnitionSearchQuery } from "../../../types/IgnitionSearchQuery";
import { Formik, Field, FormikProps } from 'formik';
import _ from 'lodash';

// HACK: Initialize the string values here to avoid "A component is changing an uncontrolled input" errors
const initialValues: IgnitionSearchQuery = {
	artist: "",
	album: "",
	author: ""
};
interface Props extends React.Props<{}> {
	update: (spec: Spec<IgnitionSearchQuery>) => void;
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
					<option value={""}>Don&apos;t care</option>
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
		const prunedValues: any = _.omitBy(values, (property: any) => { return typeof property === "string" && property.length === 0;});

		// TODO make sure trailing spaces are trimmed here
		const query: IgnitionSearchQuery = IgnitionSearchQuerySchema.cast(prunedValues);
		// eslint-disable-next-line no-console
		console.log(query); // TODO
		return Promise.resolve();
	}

	render(): ReactNode {
		return <>
			<Formik
				initialValues={initialValues}
				onSubmit={this.onSubmit.bind(this)}
				validationSchema={IgnitionSearchQuerySchema}>
				{( formikProps: FormikProps<IgnitionSearchQuery> ): ReactNode => (
					<Form onSubmit={formikProps.handleSubmit}>
						<Row>
							{(['artist', 'album', 'author'] as (keyof IgnitionSearchQuery)[]).map(this.makeOptionalString.bind(this))}
						</Row>
						<Row>
							{(['lead', 'rhythm', 'bass', 'vocals', 'dynamicDifficulty'] as (keyof IgnitionSearchQuery)[]).map(this.makeOptionalBoolean.bind(this))}
						</Row>
						<Row>
							<button type="submit" disabled={formikProps.isSubmitting}>
								Submit
							</button>
						</Row>
					</Form>
				)}
			</Formik>
		</>;
	}
}
