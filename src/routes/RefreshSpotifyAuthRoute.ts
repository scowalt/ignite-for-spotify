import { Request, Response } from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import HttpStatus from 'http-status-codes';

export function RefreshSpotifyAuthRoute(request: Request, response: Response): any {
	const accessToken: string|null = request.cookies ? request.cookies.spotifyAccessToken : null;
	const refreshToken: string|null = request.cookies ? request.cookies.spotifyRefreshToken : null;
	const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
		redirectUri: `${request.header('Referer')!}spotifyAuthCallback`,
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	});

	if (!accessToken || !refreshToken) {
		return response.status(HttpStatus.BAD_REQUEST).end();
	}

	spotifyApi.setAccessToken(accessToken);
	spotifyApi.setRefreshToken(refreshToken);
	void spotifyApi.refreshAccessToken().then((value: SpotifyWebApi.Response<SpotifyWebApi.RefreshAccessTokenResponse>) => {
		response.cookie("spotifyAccessToken", value.body.access_token);
		return response.status(HttpStatus.OK).json(value.body.access_token).send();
	});
}
