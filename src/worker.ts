import dotenv from 'dotenv';
dotenv.config();

import throng from 'throng';
import { createIgnitionUpdateQueue, createSpotifyUpdateQueue } from './shared/queues';
import { SpotifyUpdater } from './jobs/SpotifyUpdater';
import { IgnitionUpdater } from './jobs/IgnitionUpdater';

const workers: number = Number(process.env.WEB_CONCURRENCY);
const MAX_JOBS_PER_WORKER: number = 1;

function start() {
	createIgnitionUpdateQueue().process(MAX_JOBS_PER_WORKER, async (job) => {
		await IgnitionUpdater.start();
	});
	createSpotifyUpdateQueue().process(MAX_JOBS_PER_WORKER, async (job) => {
		const redirectUri: string = ""; // TODO need to figure out how to handle this in the spotify API
		await SpotifyUpdater.start(job.data.spotifyAccessToken, job.data.spotifyRefreshToken, redirectUri);
	});
}

throng({ workers, start });