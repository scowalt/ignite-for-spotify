import dotenv from 'dotenv';
import dotenvexpand from 'dotenv-expand';
const environment: dotenv.DotenvConfigOutput = dotenv.config();
dotenvexpand(environment);

import express, { Express, Request, Response } from 'express';
import BodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import favicon from 'serve-favicon';
import path from 'path';
import { Database } from './db/Database';
import { Playlist } from './db/models/Playlist';
import { PlaylistApiInfo } from './types/PlaylistApiInfo';
import { QueueManager } from './shared/QueueManager';
import { StartJobRoute } from './routes/StartJobRoute';
import { GetJobRoute } from './routes/GetJobRoute';
import { LoginRoute } from './routes/LoginRoute';
import { SpotifyAuthCallbackRoute } from './routes/SpotifyAuthCallbackRoute';
import { RefreshSpotifyAuthRoute } from './routes/RefreshSpotifyAuthRoute';
import NodeCache from 'node-cache';
import { ServerStatsData } from './types/ServerStatsData';

const queues: QueueManager = new QueueManager();
const app: Express = express();
export const StateKey: string = "spotify_auth_state";
const cache: NodeCache = new NodeCache();

// This application likely sits behind a CloudFlare proxy. Set 'trust proxy' for the request protocol to be accurate.
// See https://stackoverflow.com/a/46475726/1222411
app.enable('trust proxy');

app.use(favicon(path.join(__dirname, '..', 'res', 'icon', 'favicon.ico')));
app.use(cookieParser());
app.use(BodyParser.json());

// __dirname must be inaccurate here in order for webpack to work, but this is a bad work-around since it depends on "dist" naming
app.use(express.static(path.join(__dirname, '..', 'dist', 'views')));

app.post('/startJob', StartJobRoute(queues));
app.post('/job/:jobType/:id', GetJobRoute(queues));

// Client wants to start Spotify Auth flow
app.get('/login', LoginRoute);

// Client has finished auth on Spotify and credentials have been passed back here.
app.get('/spotifyAuthCallback', SpotifyAuthCallbackRoute);
app.get('/refreshSpotifyAuth', RefreshSpotifyAuthRoute);

app.get('/getPlaylists', async (_request: Request, response: Response) => {
	const KEY: string = 'playlistInfo';
	const database = await Database.getInstance();
	let playlistInfo: PlaylistApiInfo[] | undefined = cache.get(KEY);
	if (!playlistInfo) {
		const playlists: Playlist[] = await database.getAllPlaylists();
		playlistInfo = playlists.map((playlist: Playlist) => { return new PlaylistApiInfo(playlist); });
		cache.set(KEY, playlistInfo, 1 /* hour */ * 60 /* min per hour */ * 60 /* sec per min */);
	}
	return response.json(playlistInfo);
});

app.get('/getStats', async (_request: Request, response: Response) => {
	const KEY: string = 'serverStatsData';
	const database = await Database.getInstance();
	let stats: ServerStatsData | undefined = cache.get(KEY);
	if (!stats) {
		stats = await database.getServerStats();
		cache.set(KEY, stats, 1 /* hour */ * 60 /* min per hour */ * 60 /* sec per min */);
	}
	return response.json(stats);
});

// Catch-all to support react-router-dom processing
app.get('*', (_request: Request, response: Response) => {
	return response.sendFile(path.resolve(path.join(__dirname, '..', 'dist', 'views', 'index.html')));
});

const port: number = parseInt(process.env.PORT!, 10);
app.listen(port);
