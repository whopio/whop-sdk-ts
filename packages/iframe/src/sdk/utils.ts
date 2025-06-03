import { type ZodSchema, z } from "zod";

export const withError = <T extends ZodSchema, E extends ZodSchema>(
	schema: T,
	error: E,
) => {
	return z.discriminatedUnion("status", [
		z.object({
			status: z.literal("ok"),
			data: schema,
		}),
		z.object({
			status: z.literal("error"),
			error: error,
		}),
	]);
};

export const frostedV2Theme = z
	.object({
		appearance: z.enum(["light", "dark"]),
		accentColor: z.string(),
		dangerColor: z.string(),
		grayColor: z.string(),
		infoColor: z.string(),
		successColor: z.string(),
		warningColor: z.string(),
	})
	.partial();
