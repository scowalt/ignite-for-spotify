import { Table, Column, Model, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table
export class Playlist extends Model {
	@AutoIncrement
	@PrimaryKey
	@Column
	id!: number;

	@Column({ allowNull: false })
	spotifyPlaylistId!: string;
}
