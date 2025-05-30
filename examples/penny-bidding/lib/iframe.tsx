import { createAppIframeSDK } from "@whop-apps/iframe";

export const whopIframe = createAppIframeSDK({
	// biome-ignore lint/style/noNonNullAssertion: this is always set
	appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
	overrideParentOrigins: ["https://internal.whop.com", "https://whop.com"],
});
