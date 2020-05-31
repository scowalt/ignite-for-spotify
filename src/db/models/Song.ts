import { Table, Column, Model, PrimaryKey, UpdatedAt, CreatedAt } from 'sequelize-typescript';

@Table
export class Song extends Model<Song> {
	@PrimaryKey
	@Column
	id!: number;

	@Column({ allowNull: false })
	artist!: string;

	@Column({ allowNull: false })
	title!: string;

	@Column({ allowNull: false })
	album!: string;

	@Column({ allowNull: true })
	tuning!: string;

	@Column({ allowNull: true })
	version!: string;

	@Column({ allowNull: true })
	author!: string;

	@Column({ allowNull: true })
	dateAddedToIgnition!: Date;

	@Column({ allowNull: true })
	dateUpdatedInIgnition!: Date;

	@Column({ allowNull: false })
	lead!: boolean;

	@Column({ allowNull: false })
	rhythm!: boolean;

	@Column({ allowNull: false })
	bass!: boolean;

	@Column({ allowNull: false })
	vocals!: boolean;

	@Column({ allowNull: false })
	dynamicDifficulty!: boolean;

	@Column({ allowNull: false })
	downloadLink!: string;

	@Column({ allowNull: true })
	spotifyTrackId!: string;

	@CreatedAt
	creationDate!: Date;

	@UpdatedAt
	updatedOn!: Date;
}
