import { JobType } from "./JobType";
import { IgnitionToSpotifyData } from "./IgnitionToSpotifyData";

export type IgnitionToSpotifyJob = {
	jobType: JobType.UserPlaylistCreate;
	queryInfo: IgnitionToSpotifyData;
	password: string;
};