import { Queue } from "bull";
import Bull from "bull";
import { IgnitionToSpotifyData } from "../types/IgnitionToSpotifyData";
import { SpotifyAuthInfo } from "../views/components/shared/SpotifyAuthInfo";

export interface IgnitionJobData { }
type IgnitionQueue = Queue<IgnitionJobData>;

export interface SpotifyUpdateJobData { }
type SpotifyUpdateQueue = Queue<SpotifyUpdateJobData>;

interface PlaylistJobData{ }
type PlaylistUpdateQueue = Queue<PlaylistJobData>;

export interface UserPlaylistCreationJobData {
	query: IgnitionToSpotifyData;
	auth: SpotifyAuthInfo;
	password: string;
}
type UserPlaylistCreationQueue = Queue<UserPlaylistCreationJobData>;

export class QueueManager {
	public readonly ignitionQueue: IgnitionQueue;
	public readonly spotifyUpdateQueue: SpotifyUpdateQueue;
	public readonly playlistUpdateQueue: PlaylistUpdateQueue;
	public readonly userPlaylistCreationQueue: UserPlaylistCreationQueue;

	constructor() {
		this.ignitionQueue = QueueManager.createIgnitionUpdateQueue();
		this.spotifyUpdateQueue = QueueManager.createSpotifyUpdateQueue();
		this.playlistUpdateQueue = QueueManager.createPlaylistUpdateQueue();
		this.userPlaylistCreationQueue = new Bull<UserPlaylistCreationJobData>('userPlaylist', process.env.REDIS_URL!);
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