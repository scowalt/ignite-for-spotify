import dotenv from 'dotenv';
import dotenvexpand from 'dotenv-expand';
const environment: dotenv.DotenvConfigOutput = dotenv.config();
dotenvexpand(environment);

import assert from 'assert';
import throng from 'throng';
import { createIgnitionUpdateQueue, createSpotifyUpdateQueue } from './shared/queues';
import { SpotifyUpdater } from './jobs/SpotifyUpdater';
import { IgnitionUpdater } from './jobs/IgnitionUpdater';
import { Logger } from './shared/Logger';
import Bull from 'bull';
import { SpotifyUpdateJobData } from './shared/types';

const workers: number = Number(process.env.WEB_CONCURRENCY);

function start() {
	createIgnitionUpdateQueue().process((job) => {
		Logger.getInstance().info(`Started Ignition job ${job.id}`);
		return IgnitionUpdater.update();
	}).finally(() => {
		Logger.getInstance().info(`Ignition job finished`);
	});
	createSpotifyUpdateQueue().process(spotifyProcessFunction).finally(() => {
		Logger.getInstance().info(`Spotify job finished`);
	});
}

function spotifyProcessFunction(job: Bull.Job<SpotifyUpdateJobData>): Promise<void> {
	Logger.getInstance().info(`Started Spotify job ${job.id}`);
	const redirectUri: string = ""; // TODO need to figure out how to handle this in the spotify API
	if (process.env.SPOTIFY_ACCOUNT_ACCESS_TOKEN === undefined ||
		process.env.SPOTIFY_ACCOUNT_REFRESH_TOKEN === undefined) {
		assert(false, "Spotify access and refresh tokens must be set as environment variables");
		return Promise.reject("Spotify access and refresh tokens must be set as environment variables");
	}

	return SpotifyUpdater.update(process.env.SPOTIFY_ACCOUNT_ACCESS_TOKEN, process.env.SPOTIFY_ACCOUNT_REFRESH_TOKEN, redirectUri).finally(() => {
		Logger.getInstance().info(`SpotifyUpdater.update(...) finished`);
	});
}

throng({ workers, start });