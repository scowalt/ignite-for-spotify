import dotenv from 'dotenv';
import dotenvexpand from 'dotenv-expand';
const environment: dotenv.DotenvConfigOutput = dotenv.config();
dotenvexpand(environment);

import express, { Express, Request, Response } from 'express';
import BodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import HttpStatus from 'http-status-codes';
import favicon from 'serve-favicon';
import path from 'path';
import { Database } from './db/Database';
import { Playlist } from './db/models/Playlist';
import { PlaylistApiInfo } from './types/PlaylistApiInfo';
import { Song } from './db/models/Song';
import { BasicTrackInfo } from './types/BasicTrackInfo';
import { QueueManager, UserPlaylistCreationJobData } from './shared/QueueManager';
import { StartJobRoute } from './routes/StartJobRoute';
import { GetJobRoute } from './routes/GetJobRoute';
import { LoginRoute } from './routes/LoginRoute';
import { SpotifyAuthCallbackRoute } from './routes/SpotifyAuthCallbackRoute';
import { RefreshSpotifyAuthRoute } from './routes/RefreshSpotifyAuthRoute';
import Bull from 'bull';

const queues: QueueManager = new QueueManager();
const app: Express = express();
const stateKey: string = "spotify_auth_state";
let database: Database|null = null;

app.use(favicon(path.join(__dirname, '..', 'res', 'icon', 'favicon.ico')));
app.use(cookieParser());
app.use(BodyParser.json());

// HACK: __dirname must be inaccurate here in order for webpack to work, but this is a bad work-around since it depends on "dist" naming
app.use(express.static(path.join(__dirname, '..', 'dist', 'views')));

function getRedirectUri(request: Request): string {
	return `${request.header('Referer')}spotifyAuthCallback`;
}

app.post('/startJob', StartJobRoute(queues));
app.get('/job/:jobType/:id', GetJobRoute(queues));
app.post('/getCreatedPlaylist', async (request: Request, response: Response) => {
	const password: string = request.body.password;
	const id: Bull.JobId = request.body.id;
	const job: Bull.Job<UserPlaylistCreationJobData> | null = await queues.userPlaylistCreationQueue.getJob(id);

	if (job === null) {
		return response.status(HttpStatus.NOT_FOUND).end();
	} else if (job.data.password !== password) {
		return response.status(HttpStatus.UNAUTHORIZED).end();
	}
	return response.json({
		status: await job.getState(),
		failedReason: (job as any).failedReason,
		playlistId: ((job as any).returnvalue) ? (job as any).returnvalue.playlistId : undefined,
	});
});

// Client wants to start Spotify Auth flow
app.get('/login', LoginRoute(getRedirectUri, stateKey));

// Client has finished auth on Spotify and credentials have been passed back here.
app.get('/spotifyAuthCallback', SpotifyAuthCallbackRoute(getRedirectUri, stateKey));
app.get('/refreshSpotifyAuth', RefreshSpotifyAuthRoute(getRedirectUri));

app.get('/getPlaylists', async (_request: Request, response: Response) => {
	if (database === null) {
		database = await Database.getInstance();
	}

	// TODO this could use some caching. This will be called on every page load, so having it hit the database constantly isn't ideal
	const playlists: Playlist[] = await database.getAllPlaylists();
	return response.json(playlists.map((playlist: Playlist) => { return new PlaylistApiInfo(playlist); }));
});

app.post('/getIgnitionInfo', async (request: Request, response: Response) => {
	if (database === null) {
		database = await Database.getInstance();
	}

	// TODO This should be done by a job in the worker process instead of in the web process
	const tracks: BasicTrackInfo[] = request.body;
	let trackResults: Song[] = [];
	for (const track of tracks) {
		const newTracks: Song[] = await database.getIgnitionInfo(track);
		trackResults = trackResults.concat(newTracks);
	}

	return response.status(HttpStatus.OK).send(JSON.stringify(trackResults));
});

// Catch-all to support react-router-dom processing
app.get('*', (_request: Request, response: Response) => {
	return response.sendFile(path.resolve(path.join(__dirname, '..', 'dist', 'views', 'index.html')));
});

const port: number = parseInt(process.env.PORT!, 10);
app.listen(port);
