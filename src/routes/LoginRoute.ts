import { Request, Response } from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import Chance from 'chance';

export function LoginRoute(getRedirectUri: (request: Request) => string, stateKey: string): (request: Request, response: Response) => void {
	return (request: Request, response: Response): void => {
		const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
			redirectUri: getRedirectUri(request),
			clientId: process.env.SPOTIFY_CLIENT_ID
		});

		const scopes: string[] = [
			'user-read-private',
			'user-read-email',
			'playlist-read-private',
			'playlist-modify-private',
			'playlist-modify-public'
		];

		// Have non-alphanumeric characters in the state string can cause issues, since the string is passed as a URL query parameter
		const chance: Chance.Chance = new Chance();
		const state: string = chance.string({ length: 16, alpha: true, numeric: true });
		const authorizeUrl: string = spotifyApi.createAuthorizeURL(scopes, state);
		response.cookie(stateKey, state);

		// Redirect to Spotify to auth. Spotify will respond to redirectUri
		response.redirect(authorizeUrl);
	};
}