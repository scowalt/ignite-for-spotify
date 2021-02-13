import { Request, Response } from 'express';
import { SpotifyWebApi } from 'spotify-web-api-ts';
import HttpStatus from 'http-status-codes';
import { StateKey } from '../server';
import { Logger } from '../shared/Logger';
import { GetRefreshableUserTokensResponse } from 'spotify-web-api-ts/types/types/SpotifyAuthorization';

function getRedirectUri(request: Request): string {
	// Since this is an auth callback, the `referer` header will be Spotify's server.
	// Use other parts of the request to get the current deployment's baseUri.
	const redirectUri: string = `${request.protocol}://${request.header('host')!}/spotifyAuthCallback`;
	Logger.getInstance().debug(`Spotify auth using redirectUri '${redirectUri}'`);
	return redirectUri;
}

export async function SpotifyAuthCallbackRoute(request: Request, response: Response): Promise<void> {
	// Request refresh and state tokens
	const code = request.query.code;
	const state = request.query.state;
	const storedState: string|null = request.cookies ? request.cookies[StateKey] : null;

	if (code === null || state === null || state !== storedState) {
		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Invalid auth state").end();
	}

	if (typeof code !== 'string') {
		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Invalid code type").end();
	}

	// Since the authentication has been finished, state is no longer necessary
	response.clearCookie(StateKey);

	const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
		redirectUri: getRedirectUri(request),
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	});

	try {
		const authCodeResponse: GetRefreshableUserTokensResponse = await spotifyApi.getRefreshableUserTokens(code);
		response.cookie("spotifyAccessToken", authCodeResponse.access_token);
		response.cookie("spotifyRefreshToken", authCodeResponse.refresh_token);
		return response.redirect("/");
	} catch (reason) {
		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(JSON.stringify(reason)).end();
	}
}
