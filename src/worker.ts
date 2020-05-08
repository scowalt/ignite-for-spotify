import dotenv from 'dotenv';
import dotenvexpand from 'dotenv-expand';
const environment: dotenv.DotenvConfigOutput = dotenv.config();
dotenvexpand(environment);

import assert from 'assert';
import throng from 'throng';
import { SpotifyUpdater } from './jobs/SpotifyUpdater';
import { IgnitionUpdater } from './jobs/IgnitionUpdater';
import { Logger } from './shared/Logger';
import Bull from 'bull';
import { SpotifyPlaylistUpdater } from './jobs/SpotifyPlaylistUpdater';
import { QueueManager, SpotifyUpdateJobData, IgnitionJobData, UserPlaylistCreationJobData } from './shared/QueueManager';
import { Database } from './db/Database';
import { Song } from './db/models/Song';
import SpotifyWebApi from 'spotify-web-api-node';

const workers: number = Number(process.env.WEB_CONCURRENCY);

function spotifyProcessFunction(job: Bull.Job<SpotifyUpdateJobData>): Promise<void> {
	Logger.getInstance().info(`Started Spotify job ${job.id}`);
	const redirectUri: string = ""; // TODO need to figure out how to handle this in the spotify API
	if (!process.env.SPOTIFY_ACCOUNT_ACCESS_TOKEN ||
		!process.env.SPOTIFY_ACCOUNT_REFRESH_TOKEN) {
		assert(false, "Spotify access and refresh tokens must be set as environment variables");
		return Promise.reject("Spotify access and refresh tokens must be set as environment variables");
	}

	return SpotifyUpdater.update(process.env.SPOTIFY_ACCOUNT_ACCESS_TOKEN, process.env.SPOTIFY_ACCOUNT_REFRESH_TOKEN, redirectUri).finally(() => {
		Logger.getInstance().info(`SpotifyUpdater.update(...) finished`);
	});
}

function playlistProcessFunction(): Promise<void> {
	const redirectUri: string = ""; // TODO need to figure out how to handle this in the spotify API
	if (!process.env.SPOTIFY_ACCOUNT_ACCESS_TOKEN ||
		!process.env.SPOTIFY_ACCOUNT_REFRESH_TOKEN) {
		assert(false, "Spotify access and refresh tokens must be set as environment variables");
		return Promise.reject("Spotify access and refresh tokens must be set as environment variables");
	}

	return SpotifyPlaylistUpdater.update(process.env.SPOTIFY_ACCOUNT_ACCESS_TOKEN, process.env.SPOTIFY_ACCOUNT_REFRESH_TOKEN, redirectUri).catch((reason: any) => {
		Logger.getInstance().error(`SpotifyPlaylistUpdater failed with reason ${reason.toString()}`);
		return Promise.reject(reason);
	});
}

async function userPlaylistCreationFunction(job: Bull.Job<UserPlaylistCreationJobData>): Promise<any> {
	// TODO this needs to use a rate-limited spotify API
	const spotify: SpotifyWebApi = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
		redirectUri: '', // TODO
	});
	spotify.setAccessToken(job.data.auth.spotifyAccessToken);
	spotify.setRefreshToken(job.data.auth.spotifyRefreshToken);
	const refreshResponse: SpotifyWebApi.Response<SpotifyWebApi.RefreshAccessTokenResponse> = await spotify.refreshAccessToken();
	spotify.setAccessToken(refreshResponse.body.access_token);

	const db: Database = await Database.getInstance();
	const totalSongs = await db.getCountSongsFromIgnitionToSpotifyData(job.data.query);
	if (totalSongs === 0) {
		return Promise.reject(new Error("No songs found. No action taken. Try different search parameters."));
	} else if (totalSongs >= 10900) {
		return Promise.reject(new Error(`Exceeded manimum allowed playlist size. ${totalSongs} songs found. Try a more narrow search.`));
	}

	let playlistId: string = job.data.query.playlistInfo.playlistDescriptor;
	if (!job.data.query.playlistInfo.havePlaylistId) {
		const user = await spotify.getMe();
		const playlistCreationResponse = await spotify.createPlaylist(user.body.id, job.data.query.playlistInfo.playlistDescriptor);
		playlistId = playlistCreationResponse.body.id;
	}

	let songs: Song[];
	const limit: number = 25;
	let offset = 0;
	do {
		songs = await db.getSongsFromIgnitionToSpotifyData(job.data.query, offset, limit);
		if (songs.length !== 0) {
			await spotify.addTracksToPlaylist(playlistId, songs.map((song: Song) => { return `spotify:track:${song.spotifyTrackId}`; }));
		}
		offset += songs.length;
	} while (songs.length !== 0);

	return Promise.resolve({ playlistId });
}

function start(): void {
	const queues: QueueManager = new QueueManager();
	queues.ignitionQueue.process((job: Bull.Job<IgnitionJobData>) => {
		Logger.getInstance().info(`Started Ignition job ${job.id}`);

		// BUG There's potentially an issue where all ignition jobs mark as "failed", even if they succeed.
		// This could be because job success relies on all ~1700 requests to the CustomsForge server completing successfully
		return IgnitionUpdater.update();
	}).finally(() => {
		Logger.getInstance().info(`Ignition job finished`);
	});
	queues.spotifyUpdateQueue.process(spotifyProcessFunction).finally(() => {
		Logger.getInstance().info(`Spotify job finished`);
	});

	queues.playlistUpdateQueue.process(playlistProcessFunction).finally(() => {
		Logger.getInstance().info(`Playlist job finished`);
	});

	queues.userPlaylistCreationQueue.process(userPlaylistCreationFunction);
}

throng({ workers, start });