import {SpotifyWebApi} from "spotify-web-api-ts";

export function handleExpiredSpotifyToken<T>(signal: AbortSignal, spotify: SpotifyWebApi, resume: () => Promise<T>): ((xhr: XMLHttpRequest) => Promise<T>) {
	return async (xhr: XMLHttpRequest): Promise<any> => {
		if (!signal.aborted && xhr.status === 401 && xhr.responseText.includes("The access token expired")) {
			const response: Response = await fetch('/refreshSpotifyAuth', {
				signal
			});
			const responseAsString: string = await response.json();
			spotify.setAccessToken(responseAsString);
			if (!signal.aborted) {
				return resume();
			}
		}
		return Promise.reject(xhr);
	};
}
