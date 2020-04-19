import { Table, Column, Model, PrimaryKey, Sequelize, UpdatedAt, CreatedAt } from 'sequelize-typescript';

@Table
export class Song extends Model<Song> {
	@PrimaryKey
	@Column
	id!: number;

	@Column({ allowNull: false })
	album!: string;

	@Column({ allowNull: false })
	artist!: string;

	@Column({ allowNull: false })
	title!: string;

	@Column({ allowNull: true })
	spotifyTrackId!: string;

	@CreatedAt
	creationDate!: Date;

	@UpdatedAt
	updatedOn!: Date;
}