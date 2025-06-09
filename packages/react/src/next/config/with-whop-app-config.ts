import type { NextConfigObject, WhopAppOptions } from "./types";

export function withWhopAppConfig<C extends NextConfigObject>(
	next: C | ((phase: string, args: { defaultConfig: C }) => C | Promise<C>),
	whopAppOptions: WhopAppOptions = {},
) {
	return async function applyWhopAppConfig(
		phase: string,
		defaults: { defaultConfig: C },
	) {
		const resolvedConfig =
			typeof next === "function" ? await next(phase, defaults) : next;

		resolvedConfig.experimental ??= {};

		// Server actions
		resolvedConfig.experimental.serverActions ??= {};
		resolvedConfig.experimental.serverActions.allowedOrigins ??= [];
		resolvedConfig.experimental.serverActions.allowedOrigins.push(
			`${whopAppOptions.domainId ?? "*"}.apps.whop.com`,
		);

		// Package imports
		resolvedConfig.experimental.optimizePackageImports ??= [];
		resolvedConfig.experimental.optimizePackageImports.push("frosted-ui");

		return resolvedConfig;
	};
}
