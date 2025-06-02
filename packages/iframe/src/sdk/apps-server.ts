import { z } from "zod";
import { frostedV2Theme } from "./utils";

export const appsServerSchema = z.discriminatedUnion("event", [
	z.object({
		event: z.literal("appPing"),
		request: z.literal("app_ping"),
		response: z.literal("app_pong"),
	}),
	z.object({
		event: z.literal("onColorThemeChange"),
		request: frostedV2Theme,
		response: z.void(),
	}),
]);

export type AppsServerSchema = z.TypeOf<typeof appsServerSchema>;
