import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cookieParser from 'cookie-parser';
import Chance from 'chance';
import { stringify } from 'qs';
import fetch, {Response as FetchResponse, RequestInit} from 'node-fetch';

const chance: Chance.Chance = new Chance();
const app: Express = express();
const port: number = parseInt(process.env.PORT!);
const stateKey: string = "spotify_auth_state";
const redirectUri: string = process.env.BASE_URL! + "/spotifyAuthCallback";

app.use(express.static(path.join(__dirname, 'static')));
app.use(cookieParser());

// Client wants to start Spotify Auth flow
app.get('/login', (req, res) => {
	const state: string = chance.string({length: 16});
	res.cookie(stateKey, state);

	const scope: string = 'user-read-private user-read-email';
	res.redirect(`https://accounts.spotify.com/authorize?${stringify({
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
		// TODO state mismatch
	} else {
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
			return response2.json();
		}).then((body) => {
			const accessToken = body.access_token;
			const refreshToken = body.refresh_token;

			// the access token will be used by the client to query the Spotify API.

			// use the access token to access the Spotify Web API
			const init2: RequestInit = {
				method: "GET",
				headers: {
					"Accept": "application/json",
					'Authorization': 'Bearer ' + accessToken
				}
			};
			fetch('https://api.spotify.com/v1/me', init2).then((response3: FetchResponse) => {
				return response3.json();
			}).then((meBody) => {
				meBody.toString();
			});
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
		}
		else {
			return Promise.reject();
		}
	}).then((body) => {
		const accessToken = body.access_token;
		res.send({'access_token': accessToken});
	});
});
app.listen(port);