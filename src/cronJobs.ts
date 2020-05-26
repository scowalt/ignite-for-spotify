import dotenv from 'dotenv';
import dotenvexpand from 'dotenv-expand';
const environment: dotenv.DotenvConfigOutput = dotenv.config();
dotenvexpand(environment);

import { CronJob } from "cron";
import { Logger } from './shared/Logger';
import { QueueManager } from './shared/QueueManager';
import { Queue } from 'bull';

const queues: QueueManager = new QueueManager();

new CronJob(
	`0 0 0 * * *`, // every day at 00:00:00 (midnight)
	() => {
		Logger.getInstance().info(`Started Ignition, Spotify, Playlist jobs`);
		queues.ignitionQueue.add({ });
		queues.spotifyUpdateQueue.add({ });
		queues.playlistUpdateQueue.add({ });
	},
	null, // onComplete
	true, // start
	'America/Los_Angeles'
);

new CronJob(
	`0 0 * * * *`, // every hour at 00:00
	() => {
		Logger.getInstance().debug(`Started queue cleanup`);
		queues.forEach((queue: Queue<any>): void => {
			queue.clean(5 * 60 * 1000 /* 5 minutes */, "completed");
			queue.clean(5 * 60 * 1000 /* 5 minutes */, "failed");
		});
	},
	null, // onComplete
	true, // start
	'America/Los_Angeles'
);
