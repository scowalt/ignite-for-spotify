import { Queue } from "bull";

const enum JobType {
	IgnitionUpdate = "Ignition",
	SpotifyUpdate = "Spotify"
}

interface IgnitionJobData {}
type IgnitionQueue = Queue<IgnitionJobData>;

interface SpotifyUpdateJobData {
	spotifyAccessToken: string;
	spotifyRefreshToken: string;
}
type SpotifyUpdateQueue = Queue<SpotifyUpdateJobData>;

export {JobType, IgnitionJobData, IgnitionQueue, SpotifyUpdateJobData, SpotifyUpdateQueue };