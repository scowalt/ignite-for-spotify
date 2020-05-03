import * as yup from 'yup';

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

	// true if the playlist descriptor is an ID. Otherwise, it's a name
	havePlaylistId: yup.boolean().required(),
	playlistDescriptor: yup.string().required().min(1) // NIT this can be more precise and depend on havePlaylistId
});

// Return the TypeScript type for use internally
export type IgnitionSearchQuery = yup.InferType<typeof IgnitionSearchQuerySchema>;