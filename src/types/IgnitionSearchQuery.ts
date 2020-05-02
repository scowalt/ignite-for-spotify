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
});

// Return the TypeScript type for use internally
export type IgnitionSearchQuery = yup.InferType<typeof IgnitionSearchQuerySchema>;