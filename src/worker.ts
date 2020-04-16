import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import throng from 'throng';
import { createIgnitionUpdateQueue, createSpotifyUpdateQueue } from './shared/queues';
import { SpotifyUpdater } from './jobs/SpotifyUpdater';
import { IgnitionUpdater } from './jobs/IgnitionUpdater';

const workers: number = Number(process.env.WEB_CONCURRENCY);

function start() {
	createIgnitionUpdateQueue().process((job) => {
		return IgnitionUpdater.update();
	});
	createSpotifyUpdateQueue().process((job) => {
		const redirectUri: string = ""; // TODO need to figure out how to handle this in the spotify API
		if (process.env.SPOTIFY_ACCOUNT_ACCESS_TOKEN === undefined ||
			process.env.SPOTIFY_ACCOUNT_REFRESH_TOKEN === undefined) {
			assert(false, "Spotify access and refresh tokens must be set as environment variables");
			return Promise.reject("Spotify access and refresh tokens must be set as environment variables");
		}

		return SpotifyUpdater.update(process.env.SPOTIFY_ACCOUNT_ACCESS_TOKEN, process.env.SPOTIFY_ACCOUNT_REFRESH_TOKEN, redirectUri);
	});
}

throng({ workers, start });