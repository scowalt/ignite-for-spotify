import SpotifyWebApi from "spotify-web-api-node";
import fetch, {Response as FetchResponse, RequestInit} from 'node-fetch';
import PromiseQueue from 'p-queue';

interface IgnitionApiResponse {
	draw: number;
	recordsTotal: number;
	recordsFiltered: number;
	data: dlcEntry[];
}
type dlcEntry = [number, string, string, string, string, string, string, number, number, number, string, boolean, string, string, number, boolean, string, string, null, null, null];

const ignitionDirectoryUrl: string = "http://ignition.customsforge.com/cfss";
const IGNITION_PAGE_SIZE: number = 25; // I can mess with this, but setting it too high results in connection timeouts to the server, and isn't very nice

export class MasterPlaylistUpdater {
	static singletonStarted: boolean = false;
	static singleton: MasterPlaylistUpdater;
	static start: (accessToken: string, refreshToken: string, redirectUri: string)=>MasterPlaylistUpdater = (accessToken: string, refreshToken: string, redirectUri: string) => {
		if (!MasterPlaylistUpdater.singletonStarted) {
			MasterPlaylistUpdater.singleton = new MasterPlaylistUpdater(accessToken, refreshToken, redirectUri);
		}
		return MasterPlaylistUpdater.singleton;
	}

	private spotify: SpotifyWebApi;
	private ignitionRequestQueue: PromiseQueue;
	private spotifyRequestQueue: PromiseQueue;
	private spotifyOffset: number;

	private generateIgnitionRequestInit(offset: number) {
		return {
			method: "POST",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				"Cookie": `${process.env.IGNITION_COOKIE_KEY}=${process.env.IGNITION_COOKIE_VALUE}`,
			},
			body: new URLSearchParams({
				"draw": "5",
				// Sort results by date ascending (oldest first)
				// This ensures that results won't jump pages if new songs get added during search
				// HACK Will still break if old songs get deleted during search
				"order[0][column]": "8",
				"order[0][dir]": "asc",

				// Start at the beginning and paginate results
				"start": `${offset}`,
				"length": `${IGNITION_PAGE_SIZE}`,
				"search[value]": "",
				"search[regex]": "false",

				// The below data seems necessary for the API surface to not break
				"columns[0][data][_]": "19",
				"columns[0][data][display]": "undefined",
				"columns[0][name]": "",
				"columns[0][searchable]": "true",
				"columns[0][orderable]": "false",
				"columns[0][search][value]": "",
				"columns[0][search][regex]": "false",
				"columns[1][data][_]": "1",
				"columns[1][data][display]": "undefined",
				"columns[1][name]": "",
				"columns[1][searchable]": "true",
				"columns[1][orderable]": "true",
				"columns[1][search][value]": "",
				"columns[1][search][regex]": "false",
				"columns[2][data][_]": "2",
				"columns[2][data][display]": "undefined",
				"columns[2][name]": "",
				"columns[2][searchable]": "true",
				"columns[2][orderable]": "true",
				"columns[2][search][value]": "",
				"columns[2][search][regex]": "false",
				"columns[3][data]": "3",
				"columns[3][name]": "",
				"columns[3][searchable]": "true",
				"columns[3][orderable]": "true",
				"columns[3][search][value]": "",
				"columns[3][search][regex]": "false",
				"columns[4][data][_]": "4",
				"columns[4][data][display]": "undefined",
				"columns[4][name]": "",
				"columns[4][searchable]": "true",
				"columns[4][orderable]": "true",
				"columns[4][search][value]": "",
				"columns[4][search][regex]": "false",
				"columns[5][data]": "5",
				"columns[5][name]": "",
				"columns[5][searchable]": "true",
				"columns[5][orderable]": "true",
				"columns[5][search][value]": "",
				"columns[5][search][regex]": "false",
				"columns[6][data]": "6",
				"columns[6][name]": "",
				"columns[6][searchable]": "true",
				"columns[6][orderable]": "true",
				"columns[6][search][value]": "",
				"columns[6][search][regex]": "false",
				"columns[7][data][_]": "7",
				"columns[7][data][display]": "undefined",
				"columns[7][name]": "",
				"columns[7][searchable]": "true",
				"columns[7][orderable]": "true",
				"columns[7][search][value]": "",
				"columns[7][search][regex]": "false",
				"columns[8][data][_]": "8",
				"columns[8][data][display]": "undefined",
				"columns[8][name]": "",
				"columns[8][searchable]": "true",
				"columns[8][orderable]": "true",
				"columns[8][search][value]": "",
				"columns[8][search][regex]": "false",
			}).toString()
		};
	}

	private performIgnitionRequest(offset: number) {
		return fetch(ignitionDirectoryUrl, this.generateIgnitionRequestInit(offset)).then((response: FetchResponse) => {
			return response.json();
		})
		.then(this.getSpotifyTrackIdsFromIgnitionResponse.bind(this))
		.then((trackUris: string[]) => {
			const oldSpotifyOffset = this.spotifyOffset;
			this.spotifyOffset += trackUris.length;
			this.spotifyRequestQueue.add(async () => {
				await this.spotify.getPlaylistTracks(process.env.CDLC_PLAYLIST_ID!, {
					limit: IGNITION_PAGE_SIZE,
					offset: oldSpotifyOffset
				}).then((response) => {
					// iterate over the ignition tracks and the spotify tracks in parallel
					let ignitionTrackIndex: number = 0;
					let spotifyTrackIndex: number = 0;
					const spotifyTracks: SpotifyApi.PlaylistTrackObject[] = response.body.items;
					while (ignitionTrackIndex < trackUris.length) {
						if (spotifyTrackIndex === spotifyTracks.length) {
							// there are no more spotify tracks. Add the remaining ignition tracks to the playlist
							const remainingTracks: string[] = trackUris.slice(ignitionTrackIndex);
							this.spotify.addTracksToPlaylist(process.env.CDLC_PLAYLIST_ID!, remainingTracks).then((addResponse) => {
								addResponse.body.toString();
							}).catch((error: Error) => {
								error.toString();
							});

							// All of the ignition tracks have been added
							break;
						} else {
							if (trackUris[ignitionTrackIndex] === spotifyTracks[spotifyTrackIndex].track.uri) {
								// tracks match, no action needs to be taken, move onto next track
								ignitionTrackIndex++;
								spotifyTrackIndex++;
							} else {
								// tracks don't match. This can only happen if a track was removed from ignition that hasn't been removed from the playlist.
								// HACK this may also happen in some scenarios I haven't yet accounted for
								this.spotify.removeTracksFromPlaylist(process.env.CDLC_PLAYLIST_ID!, [spotifyTracks[spotifyTrackIndex].track]).then((response) => {
									// TODO
									return response.toString();
								}).catch((error: Error) => {
									// TODO
									return error.toString();
								});

								// skip over this track in spotify, but assume that the ignition track will still need to be accessed.
								spotifyTrackIndex++;
							}

							// TODO handle other cases here
							break;
						}
					}
				});
			});
		});
	}

	private getSpotifyTrackIdsFromIgnitionResponse(ignitionResult: IgnitionApiResponse) {
		const trackUris: (string|null)[] = new Array<string|null>(IGNITION_PAGE_SIZE);
		const trackRetrievalPromises: Promise<void>[] = [];
		ignitionResult.data.forEach((entry: dlcEntry, index: number) => {
			const artist: string = entry[1];
			const title: string = entry[2];
			trackRetrievalPromises.push(this.spotifyRequestQueue.add(async () => {
				await this.spotifySearch(artist, title).then((trackId: string) => {
					trackUris[index] = trackId;
				}).catch((error: Error) => {
					trackUris[index] = null;
				});
			}));
		});
		return Promise.all(trackRetrievalPromises).then(() => {
			const filteredTrackIds: string[] = (trackUris.filter((value: string|null) => {
				return value !== null;
			}) as string[]);
			return Promise.resolve(filteredTrackIds);
		});
	}

	/* Search the spotify catalog for a specific song by an artist
	 * Returns a promise that resolves with the ID of the first matching track
	 *         or rejects if a track isn't found or there's a different error
	 */
	private spotifySearch(artist: string, title: string) {
		return this.spotify.searchTracks(`artist:${artist} ${title}`).then((value) => {
			if (!value.body.tracks || value.body.tracks.total === 0) {
				return Promise.reject(new Error("Track not found"));
			}
			else {
				return Promise.resolve(value.body.tracks.items[0].uri);
			}
		});
	}

	private constructor(accessToken: string, refreshToken: string, redirectUri: string) {
		this.spotify = new SpotifyWebApi({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
			redirectUri
		});
		this.spotify.setAccessToken(accessToken);
		this.spotify.setRefreshToken(refreshToken);

		this.ignitionRequestQueue = new PromiseQueue({
			concurrency: 1, // maximum number of tasks to run in parallel
			interval: 5000, // interval duration
			intervalCap: 1 // maximum number of tasks to run in a given interval
		});

		this.spotifyRequestQueue = new PromiseQueue({
			concurrency: 1,
			interval: 1000,
			intervalCap: 10
		});

		this.spotifyOffset = 0;

		// Before doing anything else, refresh the input spotify access token.
		// This won't always be necessary, but it will be necessary often enough to be worth completing this step.
		this.spotify.refreshAccessToken().then((data) => {
			this.spotify.setAccessToken(data.body.access_token);

			// Make a request to Ignition. This is just to see how many requests will need to be generated and put into the queue
			fetch(ignitionDirectoryUrl, this.generateIgnitionRequestInit(0)).then((ignitionResponse: FetchResponse) => {
				return ignitionResponse.json();
			}).then((ignitionResult: IgnitionApiResponse) => {
				for (let offset: number = 0; offset < ignitionResult.recordsFiltered; offset += IGNITION_PAGE_SIZE) {
					// Queue a future request to Ignition
					this.ignitionRequestQueue.add(async () => {
						// Performing these requests in order to going to be important. Await the completion of the first
						// ignition request before returning from this function. This will hold the start of the next request.
						await this.performIgnitionRequest(offset);
					});
				}
			}).catch((error: any) => {
				this.onerror(error);
			});
		}).catch((error: any) => {
			this.onerror(error);
		});
	}

	public onerror: (error: string)=>void = () => {};
	public ondata: (data: string)=>void = () => {};
}

