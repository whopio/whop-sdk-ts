import type React from "react";
import type { FC } from "react";
import type { TWhopCoreNavigation } from "./native-whop-core-stub";
import type { DiscoverViewProps, ExperienceViewProps } from "./props";

type AppReactComponent = {
	ExperienceView: FC<ExperienceViewProps>;
	DiscoverView: FC<DiscoverViewProps>;
};

function getNavigation(): TWhopCoreNavigation {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const anyWindow = window as any;
	if (typeof anyWindow !== "undefined" && anyWindow.whopCoreNavigation) {
		return anyWindow.whopCoreNavigation;
	}

	throw new Error(
		"window.whopCoreNavigation is not defined. this method is only available in a web build",
	);
}

function parseQueryParams() {
	const params = new URLSearchParams(window.location.search);
	const experienceId = params.get("experienceId");
	const companyId = params.get("companyId");
	const currentUserId = params.get("currentUserId");
	const restPath = params.get("restPath");
	const queryStr = params.get("query");

	let path: string[] = [];
	if (restPath) path = restPath.split("/").filter(Boolean);

	const appParams: Record<string, string> = {};
	if (queryStr) {
		const obj = new URLSearchParams(queryStr);
		for (const [key, value] of obj.entries()) {
			appParams[key] = value;
		}
	}

	return {
		experienceId,
		companyId,
		currentUserId,
		path,
		params: appParams,
	};
}

function usePath(
	R: typeof React,
	initialPath: string[],
	initialParams: Record<string, string>,
): { path: string[]; params: Record<string, string> } {
	const navigation = getNavigation();
	const path = R.useSyncExternalStore(
		navigation.subscribeToPath,
		navigation.getFullStack,
	);
	const route = path.at(path.length - 1);
	const actualPath = route ?? { path: initialPath, params: initialParams };
	return actualPath;
}

export function WhopNavigationWrapper<T extends keyof AppReactComponent>(
	R: typeof React,
	name: T,
	Component: AppReactComponent[T],
) {
	const {
		experienceId,
		companyId,
		currentUserId,
		path: initialPath,
		params,
	} = parseQueryParams();

	if (name === "ExperienceView") {
		if (!experienceId || !companyId) {
			throw new Error("Missing required query params");
		}

		const C = Component as FC<ExperienceViewProps>;

		return function ExperienceViewWrapper() {
			const actualPath = usePath(R, initialPath, params);
			return R.createElement(C, {
				experienceId,
				companyId,
				currentUserId,
				path: actualPath.path,
				params: actualPath.params,
			});
		};
	}

	if (name === "DiscoverView") {
		const C = Component as FC<DiscoverViewProps>;

		return function DiscoverViewWrapper() {
			const actualPath = usePath(R, initialPath, params);
			return R.createElement(C, {
				currentUserId,
				path: actualPath.path,
				params: actualPath.params,
			});
		};
	}

	return () => null;
}
