import { Queue } from "bull";

export const enum JobType {
	IgnitionUpdate = "Ignition",
	SpotifyUpdate = "Spotify",
	PlaylistUpdate = "Playlist"
}

export interface IgnitionJobData { }
export type IgnitionQueue = Queue<IgnitionJobData>;

export interface SpotifyUpdateJobData { }
export type SpotifyUpdateQueue = Queue<SpotifyUpdateJobData>;

export interface PlaylistJobData{ }
export type PlaylistUpdateQueue = Queue<PlaylistJobData>;