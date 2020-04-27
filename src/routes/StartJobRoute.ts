import { Request, Response } from 'express';
import Bull from 'bull';
import HttpStatus from 'http-status-codes';
import { JobType } from '../types/JobTypes';
import { QueueManager } from '../shared/QueueManager';

export function StartJobRoute(queues: QueueManager): (request: Request, response: Response) => Promise<void> {
	return async (request: Request, response: Response): Promise<void> => {
		if (!request.body) {
			return response.status(HttpStatus.BAD_REQUEST).end();
		}

		const type: string = request.body.jobType;
		let job: Bull.Job;
		if (type === JobType.SpotifyUpdate) {
			job = await queues.spotifyUpdateQueue.add({ });
		} else if (type === JobType.IgnitionUpdate) {
			job = await queues.ignitionQueue.add({ });
		} else if (type === JobType.PlaylistUpdate) {
			job = await queues.playlistUpdateQueue.add({ });
		} else {
			return response.status(HttpStatus.NOT_ACCEPTABLE).end();
		}
		return response.json({ id: job.id }).end();
	};
}