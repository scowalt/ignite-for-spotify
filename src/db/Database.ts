import { Sequelize } from 'sequelize-typescript';
import { Song } from './models/Song';
import { Playlist } from './models/Playlist';
import { Logger } from '../shared/Logger';

export class Database {
	private static instance: Database;
	public static async getInstance(): Promise<Database> {
		if (!Database.instance) {
			Database.instance = new Database();
			await Database.instance.init();
		}

		return Database.instance;
	}

	private sequelize!: Sequelize;

	private constructor() {}
	private async init(): Promise<any> {
		this.sequelize = new Sequelize(process.env.DATABASE_URL!, {
			logging: msg => Logger.getInstance().debug(msg),
			pool: {
				max: Number(process.env.MYSQL_POOL_CONNECTION_LIMIT)
			},
			dialect: "mysql"
		});
		this.sequelize.addModels([Song, Playlist]);

		return this.sequelize.authenticate()
			.then(this.syncTables);
	}

	syncTables(): Promise<any> {
		return Promise.all([
			Song.sync(),
			Playlist.sync()
		]);
	}

	tryAddSong(id: number, album: string, artist: string, title: string): Promise<boolean> {
		return Song.upsert({id,album,artist,title});
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