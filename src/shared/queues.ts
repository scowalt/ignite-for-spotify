import Bull from 'bull';
import { IgnitionJobData, IgnitionQueue, SpotifyUpdateJobData, SpotifyUpdateQueue, PlaylistUpdateQueue } from './types';

export function createIgnitionUpdateQueue(): IgnitionQueue {
	return (new Bull<IgnitionJobData>('ignition', process.env.REDIS_URL!)) as IgnitionQueue;
}

export function createSpotifyUpdateQueue(): SpotifyUpdateQueue {
	return (new Bull<SpotifyUpdateJobData>('spotifyUpdate', process.env.REDIS_URL!)) as SpotifyUpdateQueue;
}

export function createPlaylistUpdateQueue(): PlaylistUpdateQueue {
	return (new Bull<SpotifyUpdateJobData>('playlistUpdate', process.env.REDIS_URL!)) as PlaylistUpdateQueue;
}