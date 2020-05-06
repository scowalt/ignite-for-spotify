import * as zod from 'zod';

// Trying to set two different field values with a single form in Formik seems like a bit of an anti-pattern.
// So, make a new compound type, and set that one type in the playlist picker.
// See https://stackoverflow.com/questions/57392290/multiple-field-names-on-single-input, where everyone suggests returning
// a single, compound string.
export const PlaylistInfoSchema = zod.object({
	havePlaylistId: zod.boolean(), // true if the playlist descriptor is an ID. Otherwise, it's a name
	playlistDescriptor: zod.string().refine((value: string): boolean => { return value.length >= 1; }, "Playlist descriptor must be included") // NIT this can be more precise and depend on havePlaylistId
});

export type PlaylistInfo = zod.infer<typeof PlaylistInfoSchema>;

// booleans need special treatment elsewhere in the code and must be kept separate
// For now, this list needs to be repeated and manually kept in-sync
export const IgnitionToSpotifyBoolsKeys: (keyof IgnitionToSpotifyData)[] = ['lead', 'rhythm', 'bass', 'vocals', 'dynamicDifficulty'];
const IgnitionToSpotifyBoolsSchema = zod.object({
	lead: zod.boolean().optional(),
	rhythm: zod.boolean().optional(),
	bass: zod.boolean().optional(),
	vocals: zod.boolean().optional(),
	dynamicDifficulty: zod.boolean().optional(),
});

// Since this is a data type that requires user input, write this as a validation schema.
export const IgnitionToSpotifyDataSchema = zod.object({
	artist: zod.string().optional(),
	album: zod.string().optional(),
	author: zod.string().optional(),
	playlistInfo: PlaylistInfoSchema
}).merge(IgnitionToSpotifyBoolsSchema);

// Return the TypeScript type for use internally
export type IgnitionToSpotifyData = zod.infer<typeof IgnitionToSpotifyDataSchema>;