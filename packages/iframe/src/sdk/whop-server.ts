import { z } from "zod";
import { frostedV2Theme, withError } from "./utils";

export const whopServerSchema = z.discriminatedUnion("event", [
	z.object({
		event: z.literal("ping"),
		request: z.literal("ping"),
		response: z.literal("pong"),
	}),
	z.object({
		event: z.literal("getTopLevelUrlData"),
		request: z.object({}).optional(),
		response: z.object({
			companyRoute: z.string(),
			experienceRoute: z.string(),
			experienceId: z.string(),
			viewType: z.enum(["app", "admin", "analytics", "preview"]),
			baseHref: z.string(),
			fullHref: z.string(),
		}),
	}),
	z.object({
		event: z.literal("openExternalUrl"),
		request: z.object({
			newTab: z.boolean().optional(),
			url: z.string(),
		}),
		response: z.literal("ok"),
	}),
	z.object({
		event: z.literal("onHrefChange"),
		request: z.object({
			href: z.string(),
		}),
		response: z.literal("ok"),
	}),
	z.object({
		event: z.literal("inAppPurchase"),
		request: z.object({
			/**
			 * ID returned from the `chargeUser` API call.
			 * @example "ch_1234567890"
			 */
			id: z.string().optional(),
			/**
			 * ID of the plan returned from the `chargeUser` API call.
			 * @example "plan_1234567890"
			 */
			planId: z.string(),
		}),
		response: withError(
			z.object({
				sessionId: z.string(),
				/**
				 * The receipt ID can be used to verify the purchase.
				 *
				 * NOTE: When receiving payments you should always listen to webhooks as a fallback
				 * to process the payment. Do not solely rely on the client to process payments. The receipt ID
				 * can be used to deduplicate payment events.
				 */
				receiptId: z.string(),
			}),
			z.string(),
		),
	}),
	z.object({
		event: z.literal("closeApp"),
		request: z.null(),
		response: z.literal("ok"),
	}),
	z.object({
		event: z.literal("openHelpChat"),
		request: z.null(),
		response: z.literal("ok"),
	}),
	z.object({
		event: z.literal("getColorTheme"),
		request: z.void(),
		response: frostedV2Theme,
	}),
	z.object({
		event: z.literal("earliestUnreadNotification"),
		request: z.object({
			experienceId: z.string(),
		}),
		response: z
			.object({
				externalId: z.string(),
			})
			.nullable(),
	}),
	z.object({
		event: z.literal("markExperienceRead"),
		request: z.object({
			experienceId: z.string(),
			notificationExternalId: z.string().optional(),
		}),
		response: z.literal("ok"),
	}),
	z.object({
		event: z.literal("performHaptic"),
		request: z.object({
			type: z.enum(["selection", "impact", "notification"]),
			style: z.enum(["light", "medium", "heavy"]),
		}),
		response: z.literal("ok"),
	}),
]);

export type WhopServerSchema = z.TypeOf<typeof whopServerSchema>;
