import { Database } from "./Database";
import PromiseQueue from 'p-queue';
import fetch, {Response as FetchResponse} from 'node-fetch';

interface IgnitionApiResponse {
	draw: number;
	recordsTotal: number;
	recordsFiltered: number;
	data: dlcEntry[];
}

type dlcEntry = [
	number, // ID (CustomsForge internal)
	string, // Artist
	string, // Title
	string, // Album
	string, // Tuning
	string, // Version
	string, // Author
	number, // Date added (new Date(number*1000) gives you the date)
	number, // Last updated (new Date(number*1000) gives you the date)
	number, // Number of downloads
	string, // Parts (i.e. "lead,rhythm,bass,vocals")
	boolean, // Dynamic difficulty?
	string, // Platforms (i.e. ",pc,mac,xbox360,ps3,")
	string, // ???
	number, // ID (CustomsForge internal)(identical to 0)
	boolean, // (might be true for official / false for unofficial)
	string, // Link to download
	string, // Link for YouTube
	null, // These last three appear to always be null
	null,
	null];

const ignitionDirectoryUrl: string = "http://ignition.customsforge.com/cfss";
const IGNITION_PAGE_SIZE: number = 25; // Setting this too high results in connection timeouts to the server, and isn't very nice

export class IgnitionUpdater {
	static singleton: IgnitionUpdater;
	static update(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			// HACK there is a race condition here without a semaphore (maybe)
			if (IgnitionUpdater.singleton) {
				return reject("IgnitionUpdater already running");
			}

			IgnitionUpdater.singleton = new IgnitionUpdater();
			return IgnitionUpdater.singleton.initAndStart();
		});
	}

	private db: Database|undefined;
	private ignitionRequestQueue: PromiseQueue;

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
				// Sort results by ID (smallest value first)
				// This ensures that results won't jump pages if new songs get added during search
				// HACK Will still break if old songs get deleted during search
				"order[0][column]": "14",
				"order[0][dir]": "asc",

				// Start at the beginning and paginate results
				"start": `${offset}`,
				"length": `${IGNITION_PAGE_SIZE}`,
				"search[value]": "",
				"search[regex]": "false",

				// The below data is necessary for the API not to break.
				// At the very least, the column that's being used to sort the responses must be included below.
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
				"columns[9][data]": "9",
				"columns[9][name]": "",
				"columns[9][searchable]": "true",
				"columns[9][orderable]": "true",
				"columns[9][search][value]": "",
				"columns[9][search][regex]": "false",
				"columns[10][data][_]": "10",
				"columns[10][data][display]": "undefined",
				"columns[10][name]": "",
				"columns[10][searchable]": "true",
				"columns[10][orderable]": "true",
				"columns[10][search][value]": "",
				"columns[10][search][regex]": "false",
				"columns[11][data][_]": "11",
				"columns[11][data][filter]": "11",
				"columns[11][data][display]": "undefined",
				"columns[11][name]": "",
				"columns[11][searchable]": "true",
				"columns[11][orderable]": "true",
				"columns[11][search][value]": "",
				"columns[11][search][regex]": "false",
				"columns[12][data][_]": "12",
				"columns[12][data][display]": "undefined",
				"columns[12][name]": "",
				"columns[12][searchable]": "true",
				"columns[12][orderable]": "true",
				"columns[12][search][value]": "",
				"columns[12][search][regex]": "false",
				"columns[13][data]": "13",
				"columns[13][name]": "",
				"columns[13][searchable]": "true",
				"columns[13][orderable]": "true",
				"columns[13][search][value]": "",
				"columns[13][search][regex]": "false",
				"columns[14][data]": "14",
				"columns[14][name]": "",
				"columns[14][searchable]": "true",
				"columns[14][orderable]": "true",
				"columns[14][search][value]": "",
				"columns[14][search][regex]": "false",
				"columns[15][data]": "15",
				"columns[15][name]": "",
				"columns[15][searchable]": "true",
				"columns[15][orderable]": "true",
				"columns[15][search][value]": "",
				"columns[15][search][regex]": "false",
				"columns[16][data]": "16",
				"columns[16][name]": "",
				"columns[16][searchable]": "true",
				"columns[16][orderable]": "true",
				"columns[16][search][value]": "",
				"columns[16][search][regex]": "false",
				"columns[17][data]": "17",
				"columns[17][name]": "",
				"columns[17][searchable]": "true",
				"columns[17][orderable]": "true",
				"columns[17][search][value]": "",
				"columns[17][search][regex]": "false",
				"columns[18][data]": "18",
				"columns[18][name]": "",
				"columns[18][searchable]": "true",
				"columns[18][orderable]": "true",
				"columns[18][search][value]": "",
				"columns[18][search][regex]": "false",
				"columns[19][data]": "19",
				"columns[19][name]": "",
				"columns[19][searchable]": "true",
				"columns[19][orderable]": "true",
				"columns[19][search][value]": "",
				"columns[19][search][regex]": "false",
				"columns[20][data]": "20",
				"columns[20][name]": "",
				"columns[20][searchable]": "true",
				"columns[20][orderable]": "true",
				"columns[20][search][value]": "",
				"columns[20][search][regex]": "false",
			}).toString()
		};
	}

	private performIgnitionRequest(offset: number) {
		return fetch(ignitionDirectoryUrl, this.generateIgnitionRequestInit(offset)).then((response: FetchResponse) => {
			return response.json();
		})
		.then(this.addIgnitionTracksToDatabase.bind(this));
	}

	private addIgnitionTracksToDatabase(ignitionResult: IgnitionApiResponse) {
		const trackAdditionPromises: Promise<void>[] = [];
		ignitionResult.data.forEach((entry: dlcEntry, index: number) => {
			const artist: string = entry[1];
			const title: string = entry[2];
			const album: string = entry[3];
			const promise: Promise<void> = this.db!.tryAddSong(entry[0], album, artist, title);
			trackAdditionPromises.push(promise);
		});

		// Promise.all will reject before everything else completes if any of the tryAddSong calls reject.
		// This is accceptable behavior, since the song additions should only fail if there's an issue with the database.
		return Promise.all(trackAdditionPromises);
	}

	private constructor() {
		this.ignitionRequestQueue = new PromiseQueue({
			concurrency: 1, // maximum number of tasks to run in parallel
			interval: 5000, // interval duration
			intervalCap: 1 // maximum number of tasks to run in a given interval
		});
	}

	private initAndStart() {
		// TODO for now, this logic assumes that no songs are removed from Ignition at any time. This isn't true,
		// since dead links are removed from Ignition. This logic will need to be updated to account for that
		return new Promise<void[]>((resolve, reject) => {
			Database.getInstance().then((database: Database) => {
				this.db = database;

				// TODO Ignore all songs that have already been added

				// Make a request to Ignition. This is just to see how many requests will need to be generated and put into the queue
				const promises: Promise<void>[] = [];
				fetch(ignitionDirectoryUrl, this.generateIgnitionRequestInit(0)).then((ignitionResponse: FetchResponse) => {
					return ignitionResponse.json();
				}).then((ignitionResult: IgnitionApiResponse) => {
					for (let offset: number = 0; offset < ignitionResult.recordsFiltered; offset += IGNITION_PAGE_SIZE) {
						// Queue a future request to Ignition
						promises.push(this.ignitionRequestQueue.add(async () => {
							await this.performIgnitionRequest(offset);
						}));
					}

					return Promise.all(promises).then(resolve);
				}).catch((error) => {
					return reject(error);
				});
			});
		});
	}
}