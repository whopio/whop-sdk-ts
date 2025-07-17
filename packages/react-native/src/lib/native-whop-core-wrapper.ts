import nativeWhopCore from "./native-whop-core";

// biome-ignore lint/complexity/noBannedTypes: allow here
type EmptyObject = {};

export interface ExecSyncApi {
	getAppApiOrigin(params: EmptyObject): { apiOrigin: string };
	cacheGet(params: { key?: string | null }): { data?: string | null };
	cacheSet(params: { key?: string | null; data?: string | null }): EmptyObject;
	routerPush(params: {
		path: string[];
		params: Record<string, string>;
	}): EmptyObject;
	routerPop(params: EmptyObject): EmptyObject;
}

export interface ExecAsyncApi extends ExecSyncApi {}

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
