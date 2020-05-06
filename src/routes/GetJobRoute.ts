import { Request, Response } from 'express';
import { QueueManager } from '../shared/QueueManager';
import Bull from 'bull';
import { JobType } from '../types/JobType';
import HttpStatus from 'http-status-codes';

export function GetJobRoute(queues: QueueManager): (request: Request, response: Response) => Promise<any> {
	return async (request: Request, response: Response): Promise<any> => {
		const type: string = request.params.jobType;
		const id: Bull.JobId = request.params.id;
		let job: Bull.Job|null;

		if (type === JobType.SpotifyUpdate) {
			job = await queues.spotifyUpdateQueue.getJob(id);
		} else if (type === JobType.IgnitionUpdate) {
			job = await queues.ignitionQueue.getJob(id);
		} else if (type === JobType.PlaylistUpdate) {
			job = await queues.playlistUpdateQueue.getJob(id);
		} else if (type === JobType.UserPlaylistCreate) {
			job = await queues.userPlaylistCreationQueue.getJob(id);
		} else {
			return response.status(HttpStatus.NOT_ACCEPTABLE).end();
		}

		if (job === null) {
			return response.status(HttpStatus.NOT_FOUND).end();
		}
		return response.json({
			status: await job.getState(),
			failedReason: (job as any).failedReason
		});
	};
}