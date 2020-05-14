import { Request, Response } from 'express';
import SpotifyWebApi, { AuthorizationCodeGrantResponse } from 'spotify-web-api-node';
import HttpStatus from 'http-status-codes';
import { StateKey } from '../server';
import { Logger } from '../shared/Logger';

function getRedirectUri(request: Request): string {
	// In some environments, Spotify will provide a 'referer'. Otherwise, it may provide a 'host'.
	let baseUri: string|undefined = request.header('referer');
	if (!baseUri) {
		baseUri = `${request.protocol}://${request.header('host')}/`;
	}
	const redirectUri: string = `${baseUri}spotifyAuthCallback`;
	Logger.getInstance().debug(`Spotify auth using redirectUri '${redirectUri}'`);
	return redirectUri;
}

export async function SpotifyAuthCallbackRoute(request: Request, response: Response): Promise<void> {
	// Request refresh and state tokens
	const code: string = request.query.code || null;
	const state: string|null = request.query.state || null;
	const storedState: string|null = request.cookies ? request.cookies[StateKey] : null;

	if (state === null || state !== storedState) {
		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Invalid auth state").end();
	}

	// Since the authentication has been finished, state is no longer necessary
	response.clearCookie(StateKey);

	const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
		redirectUri: getRedirectUri(request),
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	});

	try {
		const authCodeResponse: SpotifyWebApi.Response<AuthorizationCodeGrantResponse> = await spotifyApi.authorizationCodeGrant(code);
		response.cookie("spotifyAccessToken", authCodeResponse.body.access_token);
		response.cookie("spotifyRefreshToken", authCodeResponse.body.refresh_token);
		return response.redirect("/");
	} catch (reason) {
		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(JSON.stringify(reason)).end();
	}
}