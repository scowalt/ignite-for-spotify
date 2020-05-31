import { Request, Response } from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import HttpStatus from 'http-status-codes';
import * as zod from 'zod';
import _ from 'lodash';
import { BasicTrackInfo } from '../types/BasicTrackInfo';
import { Database } from '../db/Database';
import { Song } from '../db/models/Song';
import { Logger } from '../shared/Logger';

const HEARTBEAT_INTERVAL_MS: number = 15 * 1000;

const CookiesSchema = zod.object({
	spotifyAccessToken: zod.string(),
	spotifyRefreshToken: zod.string(),
	playlistId: zod.string(),
});
type Cookies = zod.infer<typeof CookiesSchema>;

function parseCookies(request: Request): Cookies|null {
	const subset: any = _.pick(request.cookies, Object.keys(CookiesSchema.shape));
	if (CookiesSchema.check(subset)) {
		return subset;
	}

	return null;
}

function setupEventStreamConnection(response: Response): NodeJS.Timeout {
	// Establish the event stream connection with the client
	response.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive' // by default, Node keeps the connection alive. But the client must as well
	});

	// A newline must be sent to the client before events can safely be sent
	response.write('\n');

	// Implement a heartbeat to keep the connection alive. Otherwise, the connection will eventually error with net::ERR_INCOMPLETE_CHUNKED_ENCODING
	// "The Chrome browser will kill an inactive stream after two minutes of inactivity"  - https://stackoverflow.com/a/59689130/1222411
	const heartbeat: NodeJS.Timeout = setInterval(() => {
		// Lines beginning with ":" are ignored by EventSource. See http://www.programmingwithreason.com/using-sse.html
		response.write(`:heartbeat \n\n`);
	}, HEARTBEAT_INTERVAL_MS);

	return heartbeat;
}

async function getSpotifyClient(request: Request, cookies: Cookies): Promise<SpotifyWebApi> {
	const spotify: SpotifyWebApi = new SpotifyWebApi({
		accessToken: cookies.spotifyAccessToken,
		refreshToken: cookies.spotifyRefreshToken,
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
		redirectUri: `${request.header('Referer')}spotifyAuthCallback` // TODO don't know if I need a redirect URI here
	});
	const refreshResponse: SpotifyWebApi.Response<SpotifyWebApi.RefreshAccessTokenResponse> = await spotify.refreshAccessToken();
	spotify.setAccessToken(refreshResponse.body.access_token);
	return spotify;
}

function cleanup(heartbeat: NodeJS.Timeout): void {
	clearInterval(heartbeat);
}

export async function SearchUsingPlaylistRoute(request: Request, response: Response): Promise<void> {
	const cookies: Cookies|null = parseCookies(request);
	if (!cookies){
		return response.status(HttpStatus.BAD_REQUEST).send("Invalid cookies").end();
	}

	const heartbeat: NodeJS.Timeout = setupEventStreamConnection(response);
	let closed: boolean = false;
	request.on("close", () => {
		closed = true;
		cleanup(heartbeat);
	});

	// Don't need a rate-limited API to get playlist tracks
	const unlimitedSpotify: SpotifyWebApi = await getSpotifyClient(request, cookies);
	const database: Database = await Database.getInstance();

	let offset: number = 0;
	do {
		const playlistTracks: SpotifyWebApi.Response<SpotifyApi.PlaylistTrackResponse> = await unlimitedSpotify.getPlaylistTracks(cookies.playlistId, { offset });
		if (playlistTracks.body.items.length === 0) {
			break;
		}

		for (const value of playlistTracks.body.items) {
			if (value.track === null) {
				// It's possible to have a null playlist track.
				continue;
			}

			if (value.track.id === null) {
				// TODO Some playlists may have local tracks, or tracks unavailable on Spotify. These can horribly break my database search logic.
				// For now, skip these. In the future, a "fuzzy search" might help.
				continue;
			}

			const basicTrack: BasicTrackInfo = {
				album: value.track.album.name,
				artists: value.track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => { return artist.name; }),
				title: value.track.name,
				spotifyId: value.track.id
			};

			const newTracks: Song[] = await database.getIgnitionInfo(basicTrack);

			if (newTracks.length > 5) {
				Logger.getInstance().warn(`More than five results for track ${JSON.stringify(basicTrack)}`);
			}

			for (const song of newTracks) {
				response.write(`data: ${JSON.stringify(song)}\n\n`);
			}
		}

		offset += playlistTracks.body.items.length;
	// eslint-disable-next-line no-constant-condition
	} while (!closed);

	response.write(`data: done\n\n`);
	cleanup(heartbeat);
}

