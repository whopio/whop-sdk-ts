import { Platform } from "react-native";
import type { ExecAsyncApi, ExecSyncApi } from "./native-whop-core-wrapper";

export type FunctionCallResult = {
	isOk: boolean;
	data: string | null;
	errorMessage: string | null;
};

type Route = { path: string[]; params: Record<string, string> };

class WhopCoreObservable<T> {
	private subscribers: Set<(value: T) => void> = new Set();
	private value: T;

	constructor(value: T) {
		this.value = value;
	}

	setValue(value: T) {
		this.value = value;
		for (const callback of this.subscribers) {
			callback(value);
		}
	}

	getValue() {
		return this.value;
	}

	subscribe(callback: (value: T) => void) {
		this.subscribers.add(callback);
		return () => {
			this.subscribers.delete(callback);
		};
	}
}

class WhopCoreNavigation {
	public path = new WhopCoreObservable<Route[]>([]);
	public sheet = new WhopCoreObservable<Route | null>(null);

	constructor() {
		this.getFullStack = this.getFullStack.bind(this);
		this.getCurrentSheet = this.getCurrentSheet.bind(this);
		this.subscribeToPath = this.subscribeToPath.bind(this);
		this.subscribeToSheet = this.subscribeToSheet.bind(this);
	}

	push(route: Route) {
		if (this.getCurrent().path.join("/") === route.path.join("/")) {
			return;
		}

		this.path.setValue([...this.path.getValue(), route]);
		if (typeof window !== "undefined" && window.history) {
			try {
				const pathBits = route.path.join("/");
				const paramsBits = Object.entries(route.params)
					.map(([key, value]) => `${key}=${value}`)
					.join("&");
				window.history.pushState(
					{ route, index: this.path.getValue().length },
					"",
					`#${pathBits}?${paramsBits}`,
				);
			} catch {}
		}
	}

	pop() {
		if (typeof window !== "undefined" && window.history) {
			try {
				window.history.back();
			} catch {}
		}
	}

	getFullStack() {
		return this.path.getValue();
	}

	getCurrent() {
		return (
			this.path.getValue()[this.path.getValue().length - 1] ?? {
				path: [],
				params: {},
			}
		);
	}

	presentSheet(route: Route) {
		this.sheet.setValue(route);
	}

	dismissSheet() {
		this.sheet.setValue(null);
	}

	getCurrentSheet() {
		return this.sheet.getValue() ?? null;
	}

	subscribeToPath(callback: (route: Route[]) => void) {
		return this.path.subscribe(callback);
	}

	subscribeToSheet(callback: (route: Route | null) => void) {
		return this.sheet.subscribe(callback);
	}
}

export type TWhopCoreNavigation = WhopCoreNavigation;

const navigation = new WhopCoreNavigation();
if (typeof window !== "undefined" && Platform.OS === "web") {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	(window as any).whopCoreNavigation = navigation;

	window.addEventListener("popstate", (e) => {
		const currentLength = navigation.path.getValue().length;
		if (!e.state) {
			navigation.path.setValue(navigation.path.getValue().slice(0, -1));
			return;
		}
		const index = e.state.index;
		const route = e.state.route;
		if (index < currentLength) {
			navigation.path.setValue(navigation.path.getValue().slice(0, -1));
		} else {
			navigation.path.setValue([...navigation.path.getValue(), route]);
		}
	});
}

function ok(data: unknown): FunctionCallResult {
	return { isOk: true, data: JSON.stringify(data), errorMessage: null };
}

function err(message: string): FunctionCallResult {
	return { isOk: false, data: null, errorMessage: message };
}

function getOrigin(): string {
	if (typeof window !== "undefined" && window.location) {
		return window.location.origin;
	}
	return "";
}

const syncHandlers: ExecSyncApi = {
	getAppApiOrigin() {
		return { apiOrigin: getOrigin() };
	},
	cacheGet({ key }: { key?: string | null }) {
		try {
			if (typeof window !== "undefined" && window.localStorage && key) {
				return { data: window.localStorage.getItem(key) };
			}
			return { data: null };
		} catch {
			return { data: null };
		}
	},
	cacheSet({ key, data }: { key?: string | null; data?: string | null }) {
		try {
			if (typeof window !== "undefined" && window.localStorage && key != null) {
				if (data == null) {
					window.localStorage.removeItem(key);
				} else {
					window.localStorage.setItem(key, data);
				}
			}
		} catch {}
		return {};
	},
	routerPush(route: Route) {
		navigation.push(route);
		return {};
	},
	routerPop() {
		navigation.pop();
		return {};
	},
	routerGetCurrent() {
		return navigation.getCurrent();
	},
	setNavigationBarData() {
		return {};
	},
	routerPresentSheet({ path, params }: Route) {
		navigation.presentSheet({
			path: Array.from(path ?? []),
			params: params ?? {},
		});
		return {};
	},
	routerDismissSheet() {
		navigation.dismissSheet();
		return {};
	},
	routerGetCurrentSheet() {
		return navigation.getCurrentSheet() ?? null;
	},
	downgradeToWebView() {
		return {};
	},
	getHostAppDetails() {
		return {
			build: "web",
			version: "0.0.0",
			platform: "web",
			buildType: "appstore",
		};
	},
	setScreenOrientationMode() {
		return {};
	},
};

let iframeModulePromise: Promise<typeof import("@whop/iframe")> | null = null;

async function loadIframeModule() {
	if (!iframeModulePromise) {
		iframeModulePromise = import("@whop/iframe");
	}
	return await iframeModulePromise;
}

let iframeSdk: ReturnType<typeof import("@whop/iframe").createSdk> | null =
	null;

async function loadIframeSdk() {
	if (!iframeSdk) {
		const module = await loadIframeModule();
		iframeSdk = module.createSdk({
			appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
		});
	}
	return iframeSdk;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type MakeAsync<T extends Record<string, any>> = {
	[K in keyof T]: (params: Parameters<T[K]>[0]) => Promise<ReturnType<T[K]>>;
};

const asyncHandlers: MakeAsync<Pick<ExecAsyncApi, "inAppPurchase">> = {
	inAppPurchase: async ({ planId, id }) => {
		const sdk = await loadIframeSdk();
		const result = await sdk.inAppPurchase({ planId, id: id ?? undefined });
		if (result.status === "ok") {
			return {
				sessionId: result.data.sessionId,
				receiptId: result.data.receiptId,
			};
		}
		throw new Error(result.error);
	},
};

const nativeWhopCoreStub = {
	execSync(name: string, paramsJson: string): FunctionCallResult {
		try {
			const params = paramsJson ? JSON.parse(paramsJson) : {};
			const handler = syncHandlers[name as keyof typeof syncHandlers];
			if (!handler) return err(`Unknown sync method: ${name}`);
			const result = handler(params);
			return ok(result);
		} catch (e) {
			return err(e instanceof Error ? e.message : "Unknown error");
		}
	},
	async execAsync(
		name: string,
		paramsJson: string,
	): Promise<FunctionCallResult> {
		try {
			const params = paramsJson ? JSON.parse(paramsJson) : {};
			const handler = (
				asyncHandlers as Record<string, (p: unknown) => Promise<unknown>>
			)[name];
			if (!handler) return err(`Unknown async method: ${name}`);
			const result = await handler(params);
			return ok(result);
		} catch (e) {
			return err(e instanceof Error ? e.message : "Unknown error");
		}
	},
};

export default nativeWhopCoreStub;
