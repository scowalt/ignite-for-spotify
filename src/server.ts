import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import BodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import Chance from 'chance';
import Bull from 'bull';
import { JobType, IgnitionQueue, SpotifyUpdateQueue } from './shared/types';
import HttpStatus from 'http-status-codes';
import { createIgnitionUpdateQueue, createSpotifyUpdateQueue } from './shared/queues';
import SpotifyWebApi from 'spotify-web-api-node';

const ignitionQueue: IgnitionQueue = createIgnitionUpdateQueue();
const spotifyUpdateQueue: SpotifyUpdateQueue = createSpotifyUpdateQueue();
const redirectUri: string = process.env.BASE_URL! + "/spotifyAuthCallback";
const chance: Chance.Chance = new Chance();
const app: Express = express();
const port: number = parseInt(process.env.PORT!);
const stateKey: string = "spotify_auth_state";

app.use(cookieParser());
app.use(BodyParser.json());

app.post('/startJob', async (request: ExpressRequest, response: ExpressResponse) => {
	if (!request.body) {
		return response.status(HttpStatus.BAD_REQUEST).end();
	}

	const type = request.body.jobType;
	let job: Bull.Job;
	if (type === JobType.SpotifyUpdate) {
		job = await spotifyUpdateQueue.add({});
	} else if (type === JobType.IgnitionUpdate) {
		job = await ignitionQueue.add({});
	} else {
		return response.status(HttpStatus.NOT_ACCEPTABLE).end();
	}
	return response.json({id: job.id}).end();
});

app.get('/job/:jobType/:id', async (request: ExpressRequest, response: ExpressResponse) => {
	const type = request.params.jobType;
	const id: Bull.JobId = request.params.id;
	let job: Bull.Job|null;

	if (type === JobType.SpotifyUpdate) {
		job = await spotifyUpdateQueue.getJob(id);
	} else if (type === JobType.IgnitionUpdate) {
		job = await ignitionQueue.getJob(id);
	} else {
		return response.status(HttpStatus.NOT_ACCEPTABLE).end();
	}

	if (job === null) {
		return response.status(HttpStatus.NOT_FOUND).end();
	}
	const status: Bull.JobStatus = await job.getState();
	return response.json({status});
});

// Client wants to start Spotify Auth flow
app.get('/login', (request: ExpressRequest, response: ExpressResponse) => {
	const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
		redirectUri,
		clientId: process.env.SPOTIFY_CLIENT_ID
	});

	const scopes: string[] = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-modify-private', 'playlist-modify-public'];
	const state: string = chance.string({length: 16});
	const authorizeUrl: string = spotifyApi.createAuthorizeURL(scopes, state);
	response.cookie(stateKey, state);

	// Redirect to Spotify to auth. Spotify will respond to redirectUri
	response.redirect(authorizeUrl);
});

// Client has finished auth on Spotify and credentials have been passed back here.
app.get('/spotifyAuthCallback', (request: ExpressRequest, response: ExpressResponse) => {
	// Request refresh and state tokens
	const code: string = request.query.code || null;
	const state = request.query.state || null;
	const storedState = request.cookies ? request.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
	} else {
		// Since the authentication has been finished, state is no longer necessary
		response.clearCookie(stateKey);

		const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
			redirectUri,
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET
		});

		spotifyApi.authorizationCodeGrant(code).then((value) => {
			response.cookie("spotifyAccessToken", value.body.access_token);
			response.cookie("spotifyRefreshToken", value.body.refresh_token);
			return response.json({
				spotifyAccessToken: value.body.access_token,
				spotifyRefreshToken: value.body.refresh_token
			});
		});
	}
});

app.get('/', (request, response) => {
	response.send("Hello world!");
});

app.listen(port);
