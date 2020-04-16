import MySQL from 'mysql';

const TABLE_NAME: string = `songs`;
const CREATE_TABLE_QUERY: string = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
	id INT PRIMARY KEY,
	album VARCHAR(128) NOT NULL,
	artist VARCHAR(128) NOT NULL,
	title VARCHAR(128) NOT NULL,
	spotifyTrackId VARCHAR(25)
);`;
const INSERT_SONG_QUERY: string = `INSERT IGNORE INTO ${TABLE_NAME}(id,album,artist,title) VALUES (?,?,?,?)`;

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

	private pool: MySQL.Pool|undefined;

	private async init() {
		return this.createConnectionPool().then(this.setupTable.bind(this));
	}

	private createConnectionPool() {
		return new Promise<void>((resolve) => {
			this.pool = MySQL.createPool({
				connectionLimit: Number(process.env.MYSQL_POOL_CONNECTION_LIMIT),
				host: process.env.MYSQL_SERVER_ADDRESS,
				port: Number(process.env.MYSQL_SERVER_PORT),
				user: process.env.MYSQL_USER,
				password: process.env.MYSQL_PASSWORD,
				database: process.env.MYSQL_DATABASE
			});
			return resolve();
		});
	}

	private setupTable() {
		return new Promise<void>((resolve, reject) => {
			this.pool!.query(CREATE_TABLE_QUERY, (error) => {
				if (error) {
					return reject(error);
				}

				return resolve();
			});
		});
	}

	tryAddSong(id: number, album: string, artist: string, title: string) {
		return new Promise<void>((resolve, reject) => {
			this.pool!.query(INSERT_SONG_QUERY, [id,album,artist,title], (error) => {
				if (error) {
					return reject(error);
				}

				return resolve();
			});
		});
	}

	getSongsThatNeedSpotifyTrackId(offset: number) {
		const LIMIT: number = 25;
		return new Promise<IgnitionTrackInfo[]>((resolve, reject) => {
			this.pool!.query(`SELECT id, artist, title FROM ${process.env.MYSQL_DATABASE}.${TABLE_NAME} WHERE spotifyTrackId is NULL ORDER BY id LIMIT ? OFFSET ?`, [LIMIT, offset], (err: MySQL.MysqlError | null, results?) => {
				if (err) {
					return reject(err);
				}

				// Since there is no error, we'll assume that the response comes in the correct form
				const tracks: IgnitionTrackInfo[] = results as IgnitionTrackInfo[];
				return resolve(tracks);
			});
		});
	}

	addSpotifyTrack(trackId: number, spotifyTrackId: string) {
		return new Promise<void>((resolve, reject) => {
			this.pool!.query(`UPDATE ${process.env.MYSQL_DATABASE}.${TABLE_NAME} SET spotifyTrackId = ? WHERE id = ?`,
				[spotifyTrackId, trackId],
				(error) => {
					if (error) {
						return reject(error);
					}

					return resolve();
				});
		});
	}
}