import { IgnitionQueue, SpotifyUpdateQueue, PlaylistUpdateQueue, SpotifyUpdateJobData, IgnitionJobData } from "../types/JobTypes";
import Bull from "bull";

export class QueueManager {
	public readonly ignitionQueue: IgnitionQueue;
	public readonly spotifyUpdateQueue: SpotifyUpdateQueue;
	public readonly playlistUpdateQueue: PlaylistUpdateQueue;

	constructor() {
		this.ignitionQueue = QueueManager.createIgnitionUpdateQueue();
		this.spotifyUpdateQueue = QueueManager.createSpotifyUpdateQueue();
		this.playlistUpdateQueue = QueueManager.createPlaylistUpdateQueue();
	}

	private static createPlaylistUpdateQueue(): PlaylistUpdateQueue {
		return (new Bull<SpotifyUpdateJobData>('playlistUpdate', process.env.REDIS_URL!)) as PlaylistUpdateQueue;
	}

	private static createSpotifyUpdateQueue(): SpotifyUpdateQueue {
		return (new Bull<SpotifyUpdateJobData>('spotifyUpdate', process.env.REDIS_URL!)) as SpotifyUpdateQueue;
	}

	private static createIgnitionUpdateQueue(): IgnitionQueue {
		return (new Bull<IgnitionJobData>('ignition', process.env.REDIS_URL!)) as IgnitionQueue;
	}
}