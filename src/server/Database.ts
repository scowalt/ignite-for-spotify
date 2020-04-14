import MySQL from 'mysql';

const CREATE_TABLE_QUERY: string = `CREATE TABLE IF NOT EXISTS songs (
	id INT PRIMARY KEY,
	album VARCHAR(128) NOT NULL,
	artist VARCHAR(128) NOT NULL,
	title VARCHAR(128) NOT NULL,
	spotifyTrackId VARCHAR(25)
);`;
const INSERT_SONG_QUERY: string = `INSERT IGNORE INTO songs(id,album,artist,title) VALUES (?,?,?,?)`;

export interface IgnitionTrackInfo {
	id: number;
	artist: string;
	title: string;
}
export class Database {
	private static instance: Database;
	public static async getInstance() {
		if (!Database.instance) {
			Database.instance = new Database();
			await Database.instance.init();
		}

		return Database.instance;
	}

	private async init() {
		return this.setupTable();
	}

	private createConnection() {
		return new Promise<MySQL.Connection>((resolve, reject) => {
			const connection: MySQL.Connection = MySQL.createConnection({
				host: process.env.MYSQL_SERVER_ADDRESS,
				port: Number(process.env.MYSQL_SERVER_PORT),
				user: process.env.MYSQL_USER,
				password: process.env.MYSQL_PASSWORD,
				database: process.env.MYSQL_DATABASE
			});
			connection.connect((error) => {
				if (error) {
					return reject(error);
				}

				return resolve(connection);
			});
		});
	}

	private setupTable() {
		return new Promise<void>((resolve, reject) => {
			this.createConnection().then((connection) => {
				connection.query(CREATE_TABLE_QUERY, (error) => {
					if (error) {
						return reject(error);
					}

					return resolve();
				});
			});
		});
	}

	tryAddSong(id: number, album: string, artist: string, title: string) {
		return new Promise<any>((resolve, reject) => {this.createConnection().then((connection: MySQL.Connection) => {
			connection.query(INSERT_SONG_QUERY, [id,album,artist,title], (error, results?: any) => {
				if (error) {
					return reject(error);
				}

				return resolve(results);
			});
		});});
	}

	getSongsThatNeedSpotifyTrackId(onDataChunk: ((track: IgnitionTrackInfo) => Promise<void>)) {
		const promise = new Promise<void>((resolve, reject) => {
			this.createConnection().then((connection: MySQL.Connection) => {
				let rejected: boolean = false;
				const query = connection.query(`SELECT id, artist, title FROM songs.songs WHERE spotifyTrackId is NULL ORDER BY id`);
				query.on('error', (error) => {
					rejected = true;
					return reject(error);
				});
				query.on('result', (row: IgnitionTrackInfo) => {
					connection.pause();
					onDataChunk(row).catch((error) => {
						// TODO The data row (ignition track) couldn't be processed for some reason
					}).finally(() => {
						connection.resume();
					});
				});
				query.on('end', () => {
					if (!rejected) {
						return resolve();
					}
				});
			});
		});
		return promise;
	}

	addSpotifyTrack(trackId: number, spotifyTrackId: string) {
		return this.createConnection().then((connection) => {
			return new Promise<void>((resolve, reject) => {
				connection.query(`UPDATE songs.songs SET spotifyTrackId = ? WHERE id = ?`,
					[spotifyTrackId, trackId],
					(error) => {
						if (error) {
							return reject(error);
						}

						return resolve();
					});
			});
		})
	}
}