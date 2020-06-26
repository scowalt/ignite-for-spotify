import { Request, Response } from 'express';
import { SpotifyWebApi } from 'spotify-web-api-ts';
import HttpStatus from 'http-status-codes';
import { GetRefreshedAccessTokenResponse } from 'spotify-web-api-ts/types/types/SpotifyAuthorization';

export function RefreshSpotifyAuthRoute(request: Request, response: Response): any {
	const accessToken: string|null = request.cookies ? request.cookies.spotifyAccessToken : null;
	const refreshToken: string|null = request.cookies ? request.cookies.spotifyRefreshToken : null;
	const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
		redirectUri: `${request.header('Referer')}spotifyAuthCallback`,
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	});

	if (!accessToken || !refreshToken) {
		return response.status(HttpStatus.BAD_REQUEST).end();
	}

	spotifyApi.setAccessToken(accessToken);
	spotifyApi.getRefreshedAccessToken(refreshToken).then((value: GetRefreshedAccessTokenResponse) => {
		response.cookie("spotifyAccessToken", value.access_token);
		return response.status(HttpStatus.OK).json(value.access_token).send();
	});
}
