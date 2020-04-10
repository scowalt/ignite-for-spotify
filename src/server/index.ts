import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cookieParser from 'cookie-parser';
import Chance from 'chance';
import { stringify } from 'qs';
import fetch, {Response as FetchResponse, RequestInit} from 'node-fetch';
import { MasterPlaylistUpdater } from './MasterPlaylistUpdater';

const redirectUri: string = process.env.BASE_URL! + "/spotifyAuthCallback";
const chance: Chance.Chance = new Chance();
const app: Express = express();
const port: number = parseInt(process.env.PORT!);
const stateKey: string = "spotify_auth_state";
const HEARTBEAT_INTERVAL_MS: number = 15 * 1000;

app.use(express.static(path.join(__dirname, 'static')));
app.use(cookieParser());

app.get('/updatePlaylist', (request: ExpressRequest, response: ExpressResponse) => {
	// Make sure that we have all of the info we need
	if (!request.cookies.spotifyAccessToken ||
		!request.cookies.spotifyRefreshToken) {
		return response.status(400).send('Need access token');
	}

	// Establish the event stream connection with the client
	response.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive' // by default, Node keeps the connection alive. But the client must as well
	});

	// A newline must be sent to the client before events can safely be sent
	response.write('\n');

	const updater: MasterPlaylistUpdater = MasterPlaylistUpdater.start(request.cookies.spotifyAccessToken, request.cookies.spotifyRefreshToken, redirectUri);
	updater.ondata = (data: string) => {
		response.write(`data: ${data}\n\n`);
	};
	updater.onerror = (error: string) => {
		response.write(`error: ${error}\n\n`);
	};

	// Implement a heartbeat to keep the connection alive. Otherwise, the connection will eventually error with net::ERR_INCOMPLETE_CHUNKED_ENCODING
	// "The Chrome browser will kill an inactive stream after two minutes of inactivity"  - https://stackoverflow.com/a/59689130/1222411
	const heartbeat: NodeJS.Timeout = setInterval(() => {
		// Lines beginning with ":" are ignored by EventSource. See http://www.programmingwithreason.com/using-sse.html
		response.write(`:heartbeat \n\n`);
	}, HEARTBEAT_INTERVAL_MS);

	request.on('close', () => {
		clearInterval(heartbeat);
	});
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
