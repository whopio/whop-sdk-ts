import Whop from "@whop/sdk";
import { Platform } from "react-native";
import { __internal_execSync } from "./native-whop-core-wrapper";

function getAppOrigin() {
	if (Platform.OS === "android" || Platform.OS === "ios") {
		return __internal_execSync("getAppApiOrigin", {}).apiOrigin;
	}

	if (Platform.OS === "web" && typeof window !== "undefined") {
		return window.location.origin;
	}

	throw new Error(`Unsupported platform: ${Platform.OS}`);
}

const appOrigin = getAppOrigin();

export const whopsdk = new Whop({
	apiKey: "client",
	appID: "client",
	baseURL: new URL("/_whop/api/v1/", appOrigin).href,
});

export * from "@whop/sdk";
