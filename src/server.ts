import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import BodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import Chance from 'chance';
import { stringify } from 'qs';
import fetch, {Response as FetchResponse, RequestInit} from 'node-fetch';
import Bull from 'bull';
import { JobType, IgnitionQueue, SpotifyUpdateQueue } from './shared/types';
import HttpStatus from 'http-status-codes';
import { createIgnitionUpdateQueue, createSpotifyUpdateQueue } from './shared/queues';

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
		if (!request.cookies.spotifyAccessToken || !request.cookies.spotifyRefreshToken) {
			return response.status(HttpStatus.UNAUTHORIZED).end();
		}

		job = await spotifyUpdateQueue.add({
			spotifyAccessToken: request.cookies.spotifyAccessToken,
			spotifyRefreshToken: request.cookies.spotifyRefreshToken
		});
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
		return response.status(HttpStatus.NOT_ACCEPTABLE);
	}

	if (job === null) {
		return response.status(HttpStatus.NOT_FOUND).end();
	}
	const status: Bull.JobStatus = await job.getState();
	return response.json({status});
});

// Client wants to start Spotify Auth flow
app.get('/login', (request: ExpressRequest, response: ExpressResponse) => {
	const state: string = chance.string({length: 16});
	response.cookie(stateKey, state);

	// Redirect to Spotify to auth. Spotify will respond to redirectUri
	const scope: string = 'user-read-private user-read-email playlist-read-private playlist-modify-private playlist-modify-public';
	response.redirect(`https://accounts.spotify.com/authorize?${stringify({
		response_type: 'code',
		client_id: process.env.SPOTIFY_CLIENT_ID,
		scope,
		redirect_uri: redirectUri,
		state
	})}`);
});

// Client has finished auth on Spotify and credentials have been passed back here.
app.get('/spotifyAuthCallback', (request: ExpressRequest, response: ExpressResponse) => {
	// Request refresh and state tokens
	const code = request.query.code || null;
	const state = request.query.state || null;
	const storedState = request.cookies ? request.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		// TODO state mismatch, don't know how to recover
	} else {
		// Since the authentication has been finished, state is no longer necessary
		response.clearCookie(stateKey);
		const init: RequestInit = {
			method: "POST",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/x-www-form-urlencoded",
				'Authorization': `Basic ` + (new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
			},
			body: new URLSearchParams({
				"code": code,
				"redirect_uri": redirectUri,
				"grant_type": "authorization_code"
			}).toString()
		};
		fetch('https://accounts.spotify.com/api/token', init).then((response2: FetchResponse) => {
			// TODO handle errors here
			return response2.json();
		}).then((body) => {
			const accessToken = body.access_token;
			const refreshToken = body.refresh_token;

			// the access token will be used by the client to query the Spotify API.
			response.cookie("spotifyAccessToken", accessToken);
			response.cookie("spotifyRefreshToken", refreshToken);
			response.redirect("/");
		});
	}
});

app.get('/spotifyRefreshToken', (req,res) => {
	const refreshToken = req.query.refresh_token;
	const init: RequestInit = {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
			'Authorization': `Basic ` + (new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		}).toString()
	};
	fetch("https://accounts.spotify.com/api/token", init).then((response: FetchResponse) => {
		if (response.status === 200) {
			return response.json();
		} else {
			return Promise.reject();
		}
	}).then((body) => {
		const accessToken = body.access_token;
		res.send({'access_token': accessToken});
	});
});
app.listen(port);
