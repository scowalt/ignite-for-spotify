import { Sequelize } from 'sequelize-typescript';
import { Song } from './models/Song';
import { Playlist } from './models/Playlist';
import { Logger } from '../shared/Logger';
import { Op, WhereAttributeHash } from 'sequelize';
import { BasicTrackInfo } from '../types/BasicTrackInfo';
import { IgnitionToSpotifyData } from '../types/IgnitionToSpotifyData';
import _ from 'lodash';
import { ServerStatsData } from '../types/ServerStatsData';
import mysql2 from 'mysql2';

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

	addPlaylist(playlistId: number, spotifyPlaylistId: string): Promise<Playlist> {
		return Playlist.create({ id: playlistId, spotifyPlaylistId });
	}

	getPlaylistById(id: number): Promise<Playlist|null> {
		return Playlist.findOne({
			having: {
				id
			}
		});
	}

	getAllPlaylists(): Promise<Playlist[]> {
		return Playlist.findAll();
	}

	getSongsThatNeedSpotifyTrackId(limit: number, offset: number): Promise<Song[]> {
		return Song.findAll({
			limit,
			offset,
			where: {
				spotifyTrackId: null
			}
		});
	}

	getCountSongsThatNeedSpotifyTrackId(): Promise<number> {
		return Song.count({
			where: {
				spotifyTrackId: null
			}
		});
	}

	getSongsWithSpotifyTrack(offset: number, limit: number): Promise<Song[]> {
		return Song.findAll({
			limit,
			offset,
			where: {
				spotifyTrackId: {
					[Op.not]: null
				}
			}
		});
	}

	public async getServerStats(): Promise<ServerStatsData> {
		return {
			totalSongs: await Song.count(),
			songsWithSpotifyTrack: await Song.count(
				{ where: { spotifyTrackId: { [Op.not]: null } } }
			)
		};
	}

	tryAddSong(song: object): Promise<[Song, boolean | null]> {
		return Song.upsert(song);
	}

	public getCountSongsFromIgnitionToSpotifyData(data: IgnitionToSpotifyData): Promise<number> {
		const where: WhereAttributeHash = _.omit(data, 'playlistInfo') as WhereAttributeHash;
		where.spotifyTrackId = { [Op.not]: null };
		return Song.count({
			where
		});
	}

	public getSongsFromIgnitionToSpotifyData(data: IgnitionToSpotifyData, offset: number, limit: number): Promise<Song[]> {
		const where: WhereAttributeHash = _.omit(data, 'playlistInfo') as WhereAttributeHash;
		where.spotifyTrackId = { [Op.not]: null };
		return Song.findAll({
			limit,
			offset,
			where
		});
	}

	public async getIgnitionInfo(track: BasicTrackInfo): Promise<Song[]> {
		let index: number = 0;
		let songs: Song[];
		do {
			songs = await Song.findAll({
				where: {
					[Op.or]: [
						{ spotifyTrackId: track.spotifyId },
						{
							title: track.title,
							artist: track.artists[index]
						}
					]
				}
			});
			index++;
		} while (index < track.artists.length && songs.length === 0);
		return songs;
	}

	private async init(): Promise<any> {
		this.sequelize = new Sequelize(process.env.DATABASE_URL!, {
			logging: (msg: string): void => { Logger.getInstance().debug(msg); },
			pool: {
				max: Number(process.env.MYSQL_POOL_CONNECTION_LIMIT)
			},
			dialect: "mysql",
			dialectModule: mysql2, // https://github.com/sequelize/sequelize/issues/9489
			define: { // Use case-insensitive collation to allow for case-insensitive searching of database
				charset: 'utf8',
				collate: 'utf8_general_ci'
			},
		});
		this.sequelize.addModels([Song, Playlist]);

		return this.sequelize.authenticate()
			.then(this.syncTables.bind(this));
	}

	private syncTables(): Promise<any> {
		return Promise.all([
			Song.sync(),
			Playlist.sync()
		]);
	}
}
