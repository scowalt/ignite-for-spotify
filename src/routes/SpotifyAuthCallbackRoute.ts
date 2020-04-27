import { Request, Response } from 'express';
import SpotifyWebApi, { AuthorizationCodeGrantResponse } from 'spotify-web-api-node';
import HttpStatus from 'http-status-codes';

export function SpotifyAuthCallbackRoute(getRedirectUri: (request: Request) => string, stateKey: string): (request: Request, response: Response) => any {
	return (request: Request, response: Response): any => {
		// Request refresh and state tokens
		const code: string = request.query.code || null;
		const state: string|null = request.query.state || null;
		const storedState: string|null = request.cookies ? request.cookies[stateKey] : null;

		if (state === null || state !== storedState) {
			return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Invalid auth state");
		} else {
			// Since the authentication has been finished, state is no longer necessary
			response.clearCookie(stateKey);

			const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
				redirectUri: getRedirectUri(request),
				clientId: process.env.SPOTIFY_CLIENT_ID,
				clientSecret: process.env.SPOTIFY_CLIENT_SECRET
			});

			spotifyApi.authorizationCodeGrant(code).then((value: SpotifyWebApi.Response<AuthorizationCodeGrantResponse>) => {
				response.cookie("spotifyAccessToken", value.body.access_token);
				response.cookie("spotifyRefreshToken", value.body.refresh_token);
				return response.redirect("/");
			}).catch((reason: any) => {
				return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(JSON.stringify(reason));
			});
		}
	};
}