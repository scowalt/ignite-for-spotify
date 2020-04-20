import { Sequelize } from 'sequelize-typescript';
import { Song } from './models/Song';
import { Playlist } from './models/Playlist';
import { Logger } from '../shared/Logger';
import { Model } from 'sequelize/types';

export class Database {
	public static async getInstance(): Promise<Database> {
		if (!Database.instance) {
			Database.instance = new Database();
			await Database.instance.init();
		}

		return Database.instance;
	}
	private static instance: Database;

	private sequelize!: Sequelize;

	private constructor() { }

	addSpotifyTrackIdToSong(trackId: number, spotifyTrackId: string): Promise<any> {
		return Song.update({ spotifyTrackId }, {
			where: {
				id: trackId
			}
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

	tryAddSong(song: object): Promise<boolean> {
		return Song.upsert(song);
	}

	private async init(): Promise<any> {
		this.sequelize = new Sequelize(process.env.DATABASE_URL!, {
			logging: (msg: string) => Logger.getInstance().debug(msg),
			pool: {
				max: Number(process.env.MYSQL_POOL_CONNECTION_LIMIT)
			},
			dialect: "mysql"
		});
		this.sequelize.addModels([Song, Playlist]);

		return this.sequelize.authenticate()
			.then(this.syncTables);
	}

	private syncTables(): Promise<any> {
		return Promise.all([
			Song.sync(),
			Playlist.sync()
		]);
	}
}