import React, { ReactNode, ReactElement } from "react";
import { Button, Form, Col, Row, Alert, Spinner } from "react-bootstrap";
import { IgnitionToSpotifyDataSchema, IgnitionToSpotifyData, IgnitionToSpotifyBoolsKeys } from "../../../types/IgnitionToSpotifyData";
import { Formik, Field, FormikProps, FormikErrors } from 'formik';
import _ from 'lodash';
import SpotifyPlaylistSelector from "./SpotifyPlaylistSelector";
import { SpotifyAuthInfo } from "../shared/SpotifyAuthInfo";
import { ZodError } from "zod";
import { JobType } from "../../../types/JobType";
import Bull from "bull";
import update from 'immutability-helper';
import Chance from 'chance';
import { IgnitionToSpotifyJob } from "../../../types/IgnitionToSpotifyJob";

// Initialize the string values here to avoid "A component is changing an uncontrolled input" errors.
// This is either a limitation of formik, HTML, or both. For context: https://github.com/jaredpalmer/formik/issues/28#issuecomment-312697214
const initialValues: IgnitionToSpotifyData = {
	artist: "",
	album: "",
	author: "",
	playlistInfo: {
		havePlaylistId: false,
		playlistDescriptor: ""
	},
};

const wait = (time: number): Promise<void> => { return new Promise<void>((resolve) => { setTimeout(resolve, time); }); };

interface Props extends React.Props<{}> {
	spotifyAuth: SpotifyAuthInfo;
}
interface State {
	status?: Bull.JobStatus;
	failedReason?: string;
	playlistId?: string;
}
export class IgnitionSearchForm extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {};
	}

	makeOptionalString(formikProps: FormikProps<IgnitionToSpotifyData>): (name: keyof IgnitionToSpotifyData) => ReactNode {
		return (name: keyof IgnitionToSpotifyData): ReactNode => {
			return <Col key={name} className="ignitionQueryOption"><label htmlFor={name}>
				<div>{_.upperFirst(name)}</div>
				<Field type="text" name={name} placeholder={`optional`} disabled={formikProps.isSubmitting}></Field>
			</label></Col>;
		};
	}

	makeOptionalBoolean(formikProps: FormikProps<IgnitionToSpotifyData>): (part: keyof IgnitionToSpotifyData) => ReactNode {
		return (part: keyof IgnitionToSpotifyData): ReactNode => {
			return <Col key={part} className="ignitionQueryOption">
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

	async waitForCompletedJob(id: number, password: string): Promise<any> {
		// eslint-disable-next-line no-constant-condition
		while(true) {
			await wait(2000);
			const response: Response = await fetch(`/getCreatedPlaylist`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					password,
					id
				})
			});
			const responseBody: any = await response.json(); // TODO make a type for this
			const status: Bull.JobStatus = responseBody.status;
			if (status === "completed") {
				this.setState(update(this.state, {
					status: { $set: status },
					playlistId: { $set: responseBody.playlistId }
				}));
				return Promise.resolve();
			} else if (status === "failed") {
				this.setState(update(this.state, {
					status: { $set: status },
					failedReason: { $set: responseBody.failedReason }
				}));
				return Promise.reject();
			}
		}
	}

	tidyData(values: IgnitionToSpotifyData): IgnitionToSpotifyData {
		// Work-around: All of the fields in Formik will be stored as strings (see https://github.com/jaredpalmer/formik/issues/1525)
		// Formik must have all values be initialized in order to work. So, remove all empty strings here (treat them as `undefined`)
		const prunedValues: IgnitionToSpotifyData = _.omitBy(values, (property) => { return typeof property === "string" && property.length === 0;}) as IgnitionToSpotifyData;

		// TODO trim whitespaces

		// The boolean types are stored as string due to formik limitations. These strings cannot be "cast" as booleans
		// due to limitations of Zod. To compensate, manually iterate over any necessary members to convert
		IgnitionToSpotifyBoolsKeys.forEach((key: string) => {
			if ((prunedValues as any)[key] === "true") {
				(prunedValues as any)[key] = true;
			} else if ((prunedValues as any)[key] === "false") {
				(prunedValues as any)[key] = false;
			}
		});

		return prunedValues;
	}

	onSubmit(values: IgnitionToSpotifyData): Promise<any> {
		const chance: Chance.Chance = new Chance();
		const password: string = chance.string({ length: 16, alpha: true, numeric: true });
		this.setState(update(this.state, {
			status: { $set: undefined },
			failedReason: { $set: undefined },
			playlistId: { $set: undefined },
		}));
		const body: IgnitionToSpotifyJob = {
			jobType: JobType.UserPlaylistCreate,
			queryInfo: this.tidyData(values),
			password
		};
		return fetch('/startJob', {
			method: "POST",
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
			}
		}).then((response: Response) => {
			return response.json();
		}).then((value: any) => {
			const id: number = value.id;

			// Wait for the job to finish
			return this.waitForCompletedJob(id, password);
		});
	}

	validate(values: IgnitionToSpotifyData): FormikErrors<IgnitionToSpotifyData> {
		try {
			IgnitionToSpotifyDataSchema.parse(this.tidyData(values));
		} catch(error) {
			const formikErrors: FormikErrors<IgnitionToSpotifyData> = {};
			const zodError: ZodError = error as ZodError;

			zodError.errors.forEach((subError) => {
				const key: keyof IgnitionToSpotifyData = subError.path[0] as keyof IgnitionToSpotifyData;
				formikErrors[key] = subError.message;
			});

			return formikErrors;
		}

		return {};
	}

	onCloseDialog(): void {
		this.setState(update(this.state, {
			status: { $set: undefined }
		}));
	}

	getDialog(): ReactElement {
		let result: ReactElement = <></>;
		if (this.state.status) {
			if (this.state.status === "completed") {
				result = <Alert variant="success" onClose={this.onCloseDialog.bind(this)} dismissible>
					<Alert.Heading>Success!</Alert.Heading>
					<p><a href={`https://open.spotify.com/playlist/${this.state.playlistId}`}>Go to playlist</a></p>
				</Alert>;
			} else if (this.state.status === "failed") {
				result = <Alert variant="danger" onClose={this.onCloseDialog.bind(this)} dismissible>
					<Alert.Heading>Error creating playlist</Alert.Heading>
					<p>{this.state.failedReason}</p>
				</Alert>;
			}
		}

		return result;
	}

	render(): ReactNode {
		const dialog: ReactElement = this.getDialog();
		return <>
			<Row><Col>{ dialog }</Col></Row>
			<Row><Col>
				<Formik
					initialValues={initialValues}
					onSubmit={this.onSubmit.bind(this)}
					validateOnChange={false} // Only validate changes on submit to avoid noisy errors while the user is entering playlist info
					validateOnBlur={false}
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
										{IgnitionToSpotifyBoolsKeys.map(this.makeOptionalBoolean(formikProps))}
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
									{(formikProps.isSubmitting) ? <Spinner animation="border" /> : <></>}
									Submit
								</Button>
							</Col></Row>
						</Form>
					)}
				</Formik>
			</Col></Row>
		</>;
	}
}
