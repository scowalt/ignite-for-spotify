import { SpotifyWebApi } from "spotify-web-api-ts";

export function handleExpiredSpotifyToken<T>(signal: AbortSignal, spotify: SpotifyWebApi, resume: () => Promise<T>): ((error: Error) => Promise<T>) {
	return async (error: Error): Promise<any> => {
		if (!signal.aborted && error.message.includes("401")) {
			const response: Response = await fetch('/refreshSpotifyAuth', {
				signal
			});
			const responseAsString: string = await response.json();
			spotify.setAccessToken(responseAsString);
			if (!signal.aborted) {
				return resume();
			}
		}
		return Promise.reject(error);
	};
}
