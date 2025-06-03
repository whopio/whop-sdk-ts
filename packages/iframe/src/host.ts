import { appsServerSchema } from "@/sdk/apps-server";
import {
	type ServerImplementation,
	createSDK as createPostmessageSdk,
	postmessageTransport,
} from "@/sdk/transport";
import { whopServerSchema } from "@/sdk/whop-server";

/**
 * Create an iframe SDK for the container whop.com app.
 * This will implement the functions required by client apps.
 * Do not use this function when building apps
 */
export function createSdkHost({
	appId,
	onMessage,
	remoteWindow,
	remoteOrigin,
}: {
	appId: string;
	remoteWindow: Window;
	remoteOrigin: string;
	onMessage: ServerImplementation<typeof whopServerSchema, true>;
	isDevelopment?: boolean;
}) {
	return createPostmessageSdk({
		clientSchema: appsServerSchema,
		serverSchema: whopServerSchema,
		forceCompleteness: true,
		serverImplementation: onMessage,
		localAppId: "app_whop",
		remoteAppId: appId,
		transport: postmessageTransport({
			remoteWindow: remoteWindow,
			targetOrigins: [remoteOrigin],
		}),
		serverComplete: false,
		timeout: 200,
	});
}
