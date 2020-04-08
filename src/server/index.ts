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

app.get('/go', (request: ExpressRequest, response: ExpressResponse) => {
	const ignitionDirectoryUrl: string = "http://ignition.customsforge.com/cfss";
	const ignitionRequestInit: RequestInit = {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			"Cookie": `${process.env.IGNITION_COOKIE_KEY}=${process.env.IGNITION_COOKIE_VALUE}`,
			"Host": 'ignition.customsforge.com',
			"Origin": 'http://ignition.customsforge.com',
			"Referer": "http://ignition.customsforge.com/"
		},
		body: "draw=5&columns%5B0%5D%5Bdata%5D%5B_%5D=19&columns%5B0%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D%5B_%5D=1&columns%5B1%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D%5B_%5D=2&columns%5B2%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D%5B_%5D=4&columns%5B4%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D%5B_%5D=7&columns%5B7%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D%5B_%5D=8&columns%5B8%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B8%5D%5Bname%5D=&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=9&columns%5B9%5D%5Bname%5D=&columns%5B9%5D%5Bsearchable%5D=true&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D%5B_%5D=10&columns%5B10%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B10%5D%5Bname%5D=&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=true&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D%5B_%5D=11&columns%5B11%5D%5Bdata%5D%5Bfilter%5D=11&columns%5B11%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B11%5D%5Bname%5D=&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=true&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B12%5D%5Bdata%5D%5B_%5D=12&columns%5B12%5D%5Bdata%5D%5Bdisplay%5D=undefined&columns%5B12%5D%5Bname%5D=&columns%5B12%5D%5Bsearchable%5D=true&columns%5B12%5D%5Borderable%5D=true&columns%5B12%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B12%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B13%5D%5Bdata%5D=13&columns%5B13%5D%5Bname%5D=&columns%5B13%5D%5Bsearchable%5D=true&columns%5B13%5D%5Borderable%5D=true&columns%5B13%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B13%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B14%5D%5Bdata%5D=14&columns%5B14%5D%5Bname%5D=&columns%5B14%5D%5Bsearchable%5D=true&columns%5B14%5D%5Borderable%5D=true&columns%5B14%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B14%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B15%5D%5Bdata%5D=15&columns%5B15%5D%5Bname%5D=&columns%5B15%5D%5Bsearchable%5D=true&columns%5B15%5D%5Borderable%5D=true&columns%5B15%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B15%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B16%5D%5Bdata%5D=16&columns%5B16%5D%5Bname%5D=&columns%5B16%5D%5Bsearchable%5D=true&columns%5B16%5D%5Borderable%5D=true&columns%5B16%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B16%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B17%5D%5Bdata%5D=17&columns%5B17%5D%5Bname%5D=&columns%5B17%5D%5Bsearchable%5D=true&columns%5B17%5D%5Borderable%5D=true&columns%5B17%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B17%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B18%5D%5Bdata%5D=18&columns%5B18%5D%5Bname%5D=&columns%5B18%5D%5Bsearchable%5D=true&columns%5B18%5D%5Borderable%5D=true&columns%5B18%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B18%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B19%5D%5Bdata%5D=19&columns%5B19%5D%5Bname%5D=&columns%5B19%5D%5Bsearchable%5D=true&columns%5B19%5D%5Borderable%5D=true&columns%5B19%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B19%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B20%5D%5Bdata%5D=20&columns%5B20%5D%5Bname%5D=&columns%5B20%5D%5Bsearchable%5D=true&columns%5B20%5D%5Borderable%5D=true&columns%5B20%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B20%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=8&order%5B0%5D%5Bdir%5D=asc&start=0&length=25&search%5Bvalue%5D=&search%5Bregex%5D=false"
	};
	fetch(ignitionDirectoryUrl, ignitionRequestInit).then((ignitionResponse: FetchResponse) => {
		return ignitionResponse.text();
	}).then((responseText: string) => {
		response.send(responseText);
	}).catch((error: any) => {
		response.send(error);
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
		// TODO state mismatch
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
