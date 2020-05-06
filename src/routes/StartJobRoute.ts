import { Request, Response } from 'express';
import Bull from 'bull';
import HttpStatus from 'http-status-codes';
import { JobType } from '../types/JobType';
import { QueueManager } from '../shared/QueueManager';
import { IgnitionToSpotifyData } from '../types/IgnitionToSpotifyData';

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
		} else if (type === JobType.UserPlaylistCreate) {
			const accessToken: string|null = request.cookies ? request.cookies.spotifyAccessToken : null;
			const refreshToken: string|null = request.cookies ? request.cookies.spotifyRefreshToken : null;
			if (!accessToken || !refreshToken) {
				return response.status(HttpStatus.UNAUTHORIZED).end();
			}

			const queryInfo: IgnitionToSpotifyData = request.body.queryInfo;
			job = await queues.userPlaylistCreationQueue.add({
				query: queryInfo,
				auth: {
					spotifyAccessToken: accessToken,
					spotifyRefreshToken: refreshToken
				}
			});
		} else {
			return response.status(HttpStatus.NOT_ACCEPTABLE).end();
		}
		return response.json({ id: job.id }).end();
	};
}