export type IgnitionSearchQuery = {
	readonly artist?: string;
	readonly album?: string;
	readonly author?: string;
	readonly lead?: boolean;
	readonly rhythm?: boolean;
	readonly vocals?: boolean;
	readonly dynamicDifficulty?: boolean;
};