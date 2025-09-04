import { WhopServerSdk } from "@whop/api";

const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
const appApiKey = process.env.WHOP_API_KEY;

if (!appId || !appApiKey) {
	throw new Error("Missing WHOP_APP_ID or WHOP_API_KEY");
}

export const whopSdk = WhopServerSdk({
	appId,
	appApiKey,
});
