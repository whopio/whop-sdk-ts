import { appsServerSchema } from "@/sdk/apps-server";
import {
	getReactNativePostMessage,
	getSwiftPostMessage,
} from "@/sdk/mobile-app-postmessage";
import { syncHref } from "@/sdk/sync-href";
import {
	type ServerImplementation,
	createSDK as createPostmessageSdk,
	postmessageTransport,
} from "@/sdk/transport";
import { reactNativeClientTransport } from "@/sdk/transport/postmessage";
import type { frostedV2Theme } from "@/sdk/utils";
import { whopServerSchema } from "@/sdk/whop-server";
import type { z } from "zod";

export { appsServerSchema, whopServerSchema };

function setColorTheme(theme: z.infer<typeof frostedV2Theme>) {
	document.documentElement.dispatchEvent(
		new CustomEvent("frosted-ui:set-theme", {
			detail: theme,
		}),
	);
}

/**
 * Create an iframe SDK for a client app. This will communicate with the parent
 * window which is required to be whop.com.
 */
export function createSdk({
	onMessage = {},
	appId = process.env.NEXT_PUBLIC_WHOP_APP_ID,
	overrideParentOrigins,
}: {
	onMessage?: ServerImplementation<typeof appsServerSchema, false>;
	appId?: string;
	overrideParentOrigins?: string[];
}) {
	const mobileWebView = getSwiftPostMessage() ?? getReactNativePostMessage();

	const remoteWindow =
		typeof window === "undefined" ? undefined : window.parent;

	if (!appId) {
		throw new Error(
			"[createSdk]: appId is required. Please provide an appId or set the NEXT_PUBLIC_WHOP_APP_ID environment variable.",
		);
	}

	const sdk = createPostmessageSdk({
		clientSchema: whopServerSchema,
		serverSchema: appsServerSchema,
		forceCompleteness: false,
		serverImplementation: onMessage,
		localAppId: appId,
		remoteAppId: "app_whop",
		transport: mobileWebView
			? reactNativeClientTransport({
					postMessage: mobileWebView,
					targetOrigin: "com.whop.whopapp",
				})
			: postmessageTransport({
					remoteWindow,
					targetOrigins: overrideParentOrigins ?? [
						"https://whop.com",
						"https://dash.whop.com",
						"http://localhost:8003",
					],
				}),
		serverComplete: true,
		serverMiddleware: [
			{
				onColorThemeChange: setColorTheme,
			},
		],
		timeout: 15000,
		timeouts: {
			inAppPurchase: 1000 * 60 * 60 * 24, // 24 hours, we never want this to timeout.
			onHrefChange: 500, // we don't really care about a response here.
		},
	});

	if (typeof window !== "undefined") {
		sdk
			.getColorTheme()
			.then(setColorTheme)
			.catch(() => null);
		document.documentElement.addEventListener("frosted-ui:mounted", () => {
			sdk
				.getColorTheme()
				.then(setColorTheme)
				.catch(() => null);
		});
	}

	syncHref({ onChange: sdk.onHrefChange });

	return sdk;
}

export type WhopIframeSdk = ReturnType<typeof createSdk>;
