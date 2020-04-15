import Bull from 'bull';
import { IgnitionJobData, IgnitionQueue, SpotifyUpdateJobData, SpotifyUpdateQueue } from './types';

export function createIgnitionUpdateQueue() {
	return (new Bull<IgnitionJobData>('ignition', process.env.REDIS_URL!)) as IgnitionQueue;
}

export function createSpotifyUpdateQueue() {
	return (new Bull<SpotifyUpdateJobData>('spotifyUpdate', process.env.REDIS_URL!)) as SpotifyUpdateQueue;
}