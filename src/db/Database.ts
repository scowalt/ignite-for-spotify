import { Sequelize } from 'sequelize-typescript';
import { Song } from './models/Song';
import { Playlist } from './models/Playlist';

export class Database {
	private static instance: Database;
	public static async getInstance() {
		if (!Database.instance) {
			Database.instance = new Database();
			await Database.instance.init();
		}

		return Database.instance;
	}

	private sequelize: Sequelize;

	private async init(): Promise<void> {
		this.sequelize = new Sequelize({
			database: process.env.MYSQL_DATABASE,
			username: process.env.MYSQL_USER,
			password: process.env.MYSQL_PASSWORD,
			host: process.env.MYSQL_SERVER_ADDRESS,
			port: Number(process.env.MYSQL_SERVER_PORT),
			pool: {
				max: Number(process.env.MYSQL_POOL_CONNECTION_LIMIT)
			},
			dialect: "mysql"
		});

		this.sequelize.addModels([Song, Playlist]);
		return this.sequelize.authenticate();
	}

	tryAddSong(id: number, album: string, artist: string, title: string): Promise<boolean> {
		// TODO Song.sync() should happen somewhere else, but I need to find a more appropriate spot
		return Song.sync().then(() => {
			return Song.upsert({id,album,artist,title});
		});
	}

	getSongsThatNeedSpotifyTrackId(offset: number): Promise<Song[]> {
		const LIMIT: number = 25;
		return Song.findAll({
			limit: LIMIT,
			offset,
			where: {
				spotifyTrackId: null
			}
		});
	}

	addSpotifyTrackIdToSong(trackId: number, spotifyTrackId: string) {
		return Song.update({ spotifyTrackId }, {
			where: {
				id: trackId
			}
		});
	}
}