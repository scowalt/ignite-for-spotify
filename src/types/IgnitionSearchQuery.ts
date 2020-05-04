import * as yup from 'yup';

// Trying to set two different field values with a single form in Formik seems like a bit of an anti-pattern.
// So, make a new compound type, and set that one type in the playlist picker.
// See https://stackoverflow.com/questions/57392290/multiple-field-names-on-single-input, where everyone suggests returning
// a single, compound string.
export const PlaylistInfoSchema: yup.ObjectSchema = yup.object({
	havePlaylistId: yup.boolean().required(), // true if the playlist descriptor is an ID. Otherwise, it's a name
	playlistDescriptor: yup.string().required().min(1) // NIT this can be more precise and depend on havePlaylistId
});

export type PlaylistInfo = yup.InferType<typeof PlaylistInfoSchema>;

// Since this is a data type that requires user input, write this as a validation schema.
export const IgnitionSearchQuerySchema: yup.ObjectSchema = yup.object({
	artist: yup.string().notRequired(),
	album: yup.string().notRequired(),
	author: yup.string().notRequired(),
	lead: yup.boolean().notRequired(),
	rhythm: yup.boolean().notRequired(),
	bass: yup.boolean().notRequired(),
	vocals: yup.boolean().notRequired(),
	dynamicDifficulty: yup.boolean().notRequired(),
	playlistInfo: PlaylistInfoSchema
});

// Return the TypeScript type for use internally
export type IgnitionSearchQuery = yup.InferType<typeof IgnitionSearchQuerySchema>;