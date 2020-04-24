import dotenv from 'dotenv';
import dotenvexpand from 'dotenv-expand';
const environment: dotenv.DotenvConfigOutput = dotenv.config();
dotenvexpand(environment);

import express, { Express, Request, Response } from 'express';
import BodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import Chance from 'chance';
import Bull from 'bull';
import { JobType, IgnitionQueue, SpotifyUpdateQueue, PlaylistUpdateQueue } from './types/JobTypes';
import HttpStatus from 'http-status-codes';
import { createIgnitionUpdateQueue, createSpotifyUpdateQueue, createPlaylistUpdateQueue } from './shared/queues';
import SpotifyWebApi from 'spotify-web-api-node';
import favicon from 'serve-favicon';
import path from 'path';
import { Database } from './db/Database';
import { Playlist } from './db/models/Playlist';
import { AuthorizationCodeGrantResponse } from '../lib/@types/spotify-web-api-node';
import { PlaylistApiInfo } from './types/PlaylistApiInfo';

const ignitionQueue: IgnitionQueue = createIgnitionUpdateQueue();
const spotifyUpdateQueue: SpotifyUpdateQueue = createSpotifyUpdateQueue();
const playlistUpdateQueue: PlaylistUpdateQueue = createPlaylistUpdateQueue();
const redirectUri: string = process.env.BASE_URL! + "/spotifyAuthCallback";
const chance: Chance.Chance = new Chance();
const app: Express = express();
const port: number = parseInt(process.env.PORT!, 10);
const stateKey: string = "spotify_auth_state";
let database: Database|null = null;

app.use(favicon(path.join(__dirname, '..', 'res', 'icon', 'favicon.ico')));
app.use(cookieParser());
app.use(BodyParser.json());

// HACK: __dirname must be inaccurate here in order for webpack to work, but this is a bad work-around since it depends on "dist" naming
app.use(express.static(path.join(__dirname, '..', 'dist', 'views')));

app.post('/startJob', async (request: Request, response: Response) => {
	if (!request.body) {
		return response.status(HttpStatus.BAD_REQUEST).end();
	}

	const type: string = request.body.jobType;
	let job: Bull.Job;
	if (type === JobType.SpotifyUpdate) {
		job = await spotifyUpdateQueue.add({ });
	} else if (type === JobType.IgnitionUpdate) {
		job = await ignitionQueue.add({ });
	} else if (type === JobType.PlaylistUpdate) {
		job = await playlistUpdateQueue.add({ });
	} else {
		return response.status(HttpStatus.NOT_ACCEPTABLE).end();
	}
	return response.json({ id: job.id }).end();
});

app.get('/job/:jobType/:id', async (request: Request, response: Response) => {
	const type: string = request.params.jobType;
	const id: Bull.JobId = request.params.id;
	let job: Bull.Job|null;

	if (type === JobType.SpotifyUpdate) {
		job = await spotifyUpdateQueue.getJob(id);
	} else if (type === JobType.IgnitionUpdate) {
		job = await ignitionQueue.getJob(id);
	} else if (type === JobType.PlaylistUpdate) {
		job = await playlistUpdateQueue.getJob(id);
	}else {
		return response.status(HttpStatus.NOT_ACCEPTABLE).end();
	}

	if (job === null) {
		return response.status(HttpStatus.NOT_FOUND).end();
	}
	const status: Bull.JobStatus = await job.getState();
	return response.json({ status });
});

// Client wants to start Spotify Auth flow
app.get('/login', (_request: Request, response: Response) => {
	const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
		redirectUri,
		clientId: process.env.SPOTIFY_CLIENT_ID
	});

	const scopes: string[] = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-modify-private', 'playlist-modify-public'];
	const state: string = chance.string({ length: 16 });
	const authorizeUrl: string = spotifyApi.createAuthorizeURL(scopes, state);
	response.cookie(stateKey, state);

	// Redirect to Spotify to auth. Spotify will respond to redirectUri
	response.redirect(authorizeUrl);
});

app.get('/getPlaylists', async (_request: Request, response: Response) => {
	if (database === null) {
		database = await Database.getInstance();
	}

	const playlists: Playlist[] = await database.getAllPlaylists();
	return response.json(playlists.map((playlist: Playlist) => { return new PlaylistApiInfo(playlist); }));
});

// Client has finished auth on Spotify and credentials have been passed back here.
app.get('/spotifyAuthCallback', (request: Request, response: Response) => {
	// Request refresh and state tokens
	const code: string = request.query.code || null;
	const state: string|null = request.query.state || null;
	const storedState: string|null = request.cookies ? request.cookies[stateKey] : null;

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

		spotifyApi.authorizationCodeGrant(code).then((value: SpotifyWebApi.Response<AuthorizationCodeGrantResponse>) => {
			response.cookie("spotifyAccessToken", value.body.access_token);
			response.cookie("spotifyRefreshToken", value.body.refresh_token);
			return response.json({
				spotifyAccessToken: value.body.access_token,
				spotifyRefreshToken: value.body.refresh_token
			});
		});
	}
});

// app.get('/', (_request: Request, response: Response) => {
// 	response.send("Hello world!");
// });

app.listen(port);
