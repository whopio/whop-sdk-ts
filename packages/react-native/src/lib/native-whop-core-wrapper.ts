import nativeWhopCore from "./native-whop-core";
import type { PathParams } from "./props";

// biome-ignore lint/complexity/noBannedTypes: allow here
type EmptyObject = {};

export interface ExecSyncApi {
	getAppApiOrigin(params: EmptyObject): { apiOrigin: string };
	cacheGet(params: { key?: string | null }): { data?: string | null };
	cacheSet(params: { key?: string | null; data?: string | null }): EmptyObject;
	routerPush(params: PathParams): EmptyObject;
	routerPop(params: EmptyObject): EmptyObject;
	routerGetCurrent(params: EmptyObject): PathParams;
	setNavigationBarData(params: {
		title?: string | null;
		description?: string | null;
	}): EmptyObject;
	routerPresentSheet(params: PathParams): EmptyObject;
	routerDismissSheet(params: EmptyObject): EmptyObject;
	routerGetCurrentSheet(params: EmptyObject): PathParams | null | undefined;
	downgradeToWebView(params: EmptyObject): EmptyObject;
	getHostAppDetails(params: EmptyObject): {
		build: string;
		version: string;
		platform: "ios" | "android" | "web";
		buildType: "appstore" | "testflight" | "debug";
	};
	setScreenOrientationMode(params: {
		targetScreenOrientationMode: "portrait" | "landscape" | "rotate";
	}): EmptyObject;
}

export interface ExecAsyncApi extends ExecSyncApi {
	inAppPurchase(params: {
		id?: string | null;
		planId: string;
	}): {
		sessionId: string;
		receiptId: string;
	};
}

export function __internal_execSync<F extends keyof ExecSyncApi>(
	name: F,
	params: Parameters<ExecSyncApi[F]>[0],
): ReturnType<ExecSyncApi[F]> {
	const resultJson = nativeWhopCore.execSync(name, JSON.stringify(params));
	if (!resultJson.isOk) {
		throw new Error(`Failed to execute ${name}: ${resultJson.errorMessage}`);
	}

	return JSON.parse(resultJson.data || "{}") as ReturnType<ExecSyncApi[F]>;
}

export async function __internal_execAsync<F extends keyof ExecAsyncApi>(
	name: F,
	params: Parameters<ExecAsyncApi[F]>[0],
): Promise<ReturnType<ExecAsyncApi[F]>> {
	const resultJson = await nativeWhopCore.execAsync(
		name,
		JSON.stringify(params),
	);

	if (!resultJson.isOk) {
		throw new Error(`Failed to execute ${name}: ${resultJson.errorMessage}`);
	}

	return JSON.parse(resultJson.data || "{}") as ReturnType<ExecAsyncApi[F]>;
}
