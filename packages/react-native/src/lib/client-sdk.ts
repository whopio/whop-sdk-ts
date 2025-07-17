import { WhopClientSdk } from "@whop/api";
import { Platform } from "react-native";
import { __internal_execSync } from "./native-whop-core-wrapper";

function getAppOrigin() {
	if (Platform.OS === "android" || Platform.OS === "ios") {
		return __internal_execSync("getAppApiOrigin", "{}").apiOrigin;
	}

	if (Platform.OS === "web" && typeof window !== "undefined") {
		return window.location.origin;
	}

	throw new Error(`Unsupported platform: ${Platform.OS}`);
}

const appOrigin = getAppOrigin();

export const whopSdk: WhopClientSdk = WhopClientSdk({
	apiOrigin: appOrigin,
	apiPath: "/_whop/public-graphql/",
});

export * from "@whop/api";
