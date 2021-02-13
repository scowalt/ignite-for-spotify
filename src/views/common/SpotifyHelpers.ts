import { SpotifyWebApi } from "spotify-web-api-ts";
import { RegularError } from "spotify-web-api-ts/types/types/SpotifyObjects";

export function handleExpiredSpotifyToken<T>(signal: AbortSignal, spotify: SpotifyWebApi, resume: () => Promise<T>): ((error: RegularError) => Promise<T>) {
	return async (error: RegularError): Promise<any> => {
		if (!signal.aborted && error.error.status === 401 && error.error.message.includes("The access token expired")) {
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
