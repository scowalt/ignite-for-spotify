import { Request, Response } from 'express';
import { QueueManager } from '../shared/QueueManager';
import Bull, { Queue } from 'bull';
import { JobType } from '../types/JobType';
import HttpStatus from 'http-status-codes';

async function handleAuthenticatedJob<T>(id: Bull.JobId, password: string, queue: Queue<T>, property: string, response: Response): Promise<void> {
	const job: Bull.Job<T> | null = await queue.getJob(id);

	if (job === null) {
		return response.status(HttpStatus.NOT_FOUND).end();
	} else if ((job.data as any).password !== password) {
		return response.status(HttpStatus.UNAUTHORIZED).end();
	}

	const responseBody: any = {
		status: await job.getState(),
		failedReason: (job as any).failedReason,
	};
	responseBody[property] = ((job as any).returnvalue) ? (job as any).returnvalue[property] : undefined;

	// To conserve memory, remove completed jobs from the database when they are retrieved.
	if (responseBody.status === 'completed' ||
		responseBody.status === 'failed') {
		await job.remove();
	}

	return response.json(responseBody).end();
}

export function GetJobRoute(queues: QueueManager): (request: Request, response: Response) => Promise<any> {
	return async (request: Request, response: Response): Promise<any> => {
		const type: string = request.params.jobType;
		const id: Bull.JobId = request.params.id;
		let job: Bull.Job|null;

		if (type === JobType.SpotifyUpdate) {
			job = await queues.spotifyUpdateQueue.getJob(id);
		} else if (type === JobType.PlaylistUpdate) {
			job = await queues.playlistUpdateQueue.getJob(id);
		} else if (type === JobType.UserPlaylistCreate) {
			return await handleAuthenticatedJob(id, request.body.password, queues.userPlaylistCreationQueue, 'playlistId', response);
		} else {
			return response.status(HttpStatus.NOT_ACCEPTABLE).end();
		}

		if (job === null) {
			return response.status(HttpStatus.NOT_FOUND).end();
		}
		return response.json({
			status: await job.getState(),
		});
	};
}
