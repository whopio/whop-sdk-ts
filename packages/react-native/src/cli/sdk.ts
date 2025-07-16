import { WhopServerSdk } from "@whop/api";
import { config } from "dotenv";

config({
	path: [".env", ".env.local", ".env.development", ".env.production"],
});

function env(key: string) {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value;
}

export const AGENT_USER_ID = env("NEXT_PUBLIC_WHOP_AGENT_USER_ID");
export const COMPANY_ID = env("NEXT_PUBLIC_WHOP_COMPANY_ID");
export const APP_ID = env("NEXT_PUBLIC_WHOP_APP_ID");

export const whopSdk: WhopServerSdk = WhopServerSdk({
	appApiKey: env("WHOP_API_KEY"),
	appId: APP_ID,
	companyId: COMPANY_ID,
	onBehalfOfUserId: AGENT_USER_ID,
});
