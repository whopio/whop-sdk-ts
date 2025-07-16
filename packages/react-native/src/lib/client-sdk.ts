import { WhopClientSdk } from "@whop/api";
import { Platform } from "react-native";
import nativeWhopCore from "./native-whop-core";

function getAppOrigin() {
	if (Platform.OS === "android" || Platform.OS === "ios") {
		const result = nativeWhopCore.execSync("getAppApiOrigin", "{}");
		if (result.isOk) {
			const { apiOrigin } = JSON.parse(result.data || "{}");
			return apiOrigin;
		}
		throw new Error(`Failed to get app origin: ${result.errorMessage}`);
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
