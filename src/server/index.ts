import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cookieParser from 'cookie-parser';
import Chance from 'chance';
import { stringify } from 'qs';
import fetch, {Response as FetchResponse, RequestInit} from 'node-fetch';
import SpotifyWebApi from 'spotify-web-api-node';

const redirectUri: string = process.env.BASE_URL! + "/spotifyAuthCallback";
const chance: Chance.Chance = new Chance();
const app: Express = express();
const port: number = parseInt(process.env.PORT!);
const stateKey: string = "spotify_auth_state";
const HEARTBEAT_INTERVAL_MS: number = 15 * 1000;

app.use(express.static(path.join(__dirname, 'static')));
app.use(cookieParser());

interface IgnitionApiResponse {
	draw: number;
	recordsTotal: number;
	recordsFiltered: number;
	data: dlcEntry[];
}
type dlcEntry = [number, string, string, string, string, string, string, number, number, number, string, boolean, string, string, number, boolean, string, string, null, null, null];

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

	const spotify: SpotifyWebApi = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
		redirectUri
	});
	spotify.setAccessToken(request.cookies.spotifyAccessToken);

	// Implement a heartbeat to keep the connection alive. Otherwise, the connection will eventually error with net::ERR_INCOMPLETE_CHUNKED_ENCODING
	// "The Chrome browser will kill an inactive stream after two minutes of inactivity"  - https://stackoverflow.com/a/59689130/1222411
	const heartbeat: NodeJS.Timeout = setInterval(() => {
		// Lines beginning with ":" are ignored by EventSource. See http://www.programmingwithreason.com/using-sse.html
		response.write(`:heartbeat \n\n`);
	}, HEARTBEAT_INTERVAL_MS);

	const ignitionDirectoryUrl: string = "http://ignition.customsforge.com/cfss";
	const ignitionRequestInit: RequestInit = {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			"Cookie": `${process.env.IGNITION_COOKIE_KEY}=${process.env.IGNITION_COOKIE_VALUE}`,
		},
		body: new URLSearchParams({
			"draw": "5",
			// Sort results by date ascending (oldest first)
			// This ensures that results won't jump pages if new songs get added during search
			// HACK Will still break if old songs get deleted during search
			"order[0][column]": "8",
			"order[0][dir]": "asc",

			// Start at the beginning and paginate results
			"start": "0",
			"length": "25", // I can mess with this, but setting it too high results in connection timeouts to the server, and isn't very nice
			"search[value]": "",
			"search[regex]": "false",

			// The below data seems necessary for the API surface to not break
			"columns[0][data][_]": "19",
			"columns[0][data][display]": "undefined",
			"columns[0][name]": "",
			"columns[0][searchable]": "true",
			"columns[0][orderable]": "false",
			"columns[0][search][value]": "",
			"columns[0][search][regex]": "false",
			"columns[1][data][_]": "1",
			"columns[1][data][display]": "undefined",
			"columns[1][name]": "",
			"columns[1][searchable]": "true",
			"columns[1][orderable]": "true",
			"columns[1][search][value]": "",
			"columns[1][search][regex]": "false",
			"columns[2][data][_]": "2",
			"columns[2][data][display]": "undefined",
			"columns[2][name]": "",
			"columns[2][searchable]": "true",
			"columns[2][orderable]": "true",
			"columns[2][search][value]": "",
			"columns[2][search][regex]": "false",
			"columns[3][data]": "3",
			"columns[3][name]": "",
			"columns[3][searchable]": "true",
			"columns[3][orderable]": "true",
			"columns[3][search][value]": "",
			"columns[3][search][regex]": "false",
			"columns[4][data][_]": "4",
			"columns[4][data][display]": "undefined",
			"columns[4][name]": "",
			"columns[4][searchable]": "true",
			"columns[4][orderable]": "true",
			"columns[4][search][value]": "",
			"columns[4][search][regex]": "false",
			"columns[5][data]": "5",
			"columns[5][name]": "",
			"columns[5][searchable]": "true",
			"columns[5][orderable]": "true",
			"columns[5][search][value]": "",
			"columns[5][search][regex]": "false",
			"columns[6][data]": "6",
			"columns[6][name]": "",
			"columns[6][searchable]": "true",
			"columns[6][orderable]": "true",
			"columns[6][search][value]": "",
			"columns[6][search][regex]": "false",
			"columns[7][data][_]": "7",
			"columns[7][data][display]": "undefined",
			"columns[7][name]": "",
			"columns[7][searchable]": "true",
			"columns[7][orderable]": "true",
			"columns[7][search][value]": "",
			"columns[7][search][regex]": "false",
			"columns[8][data][_]": "8",
			"columns[8][data][display]": "undefined",
			"columns[8][name]": "",
			"columns[8][searchable]": "true",
			"columns[8][orderable]": "true",
			"columns[8][search][value]": "",
			"columns[8][search][regex]": "false",
		}).toString()
	};
	fetch(ignitionDirectoryUrl, ignitionRequestInit).then((ignitionResponse: FetchResponse) => {
		return ignitionResponse.json();
	}).then((ignitionResult: IgnitionApiResponse) => {
		ignitionResult.data.forEach((entry: dlcEntry) => {
			const artist: string = entry[1];
			const title: string = entry[2];
			const album: string = entry[3];
			spotify.searchTracks(`artist:${artist} album:${album} ${title}`).then((value) => {
				response.write(`data: ${value.body.tracks?.items[0].album.name}\n\n`);
			}).catch((error: any) => {
				response.write(`error: ${error}\n\n`);
			});
		});
	}).catch((error: any) => {
		response.write(`error: ${error}\n\n`);
	});

	request.on('close', () => {
		clearInterval(heartbeat);
	});
});

// Client wants to start Spotify Auth flow
app.get('/login', (request: ExpressRequest, response: ExpressResponse) => {
	const state: string = chance.string({length: 16});
	response.cookie(stateKey, state);

	// Redirect to Spotify to auth. Spotify will respond to redirectUri
	const scope: string = 'user-read-private user-read-email playlist-read-private';
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
