import type { DocumentNode } from "graphql";
import type { Variables } from "graphql-request";
import type { Requester } from "./codegen/generated-api";

import { GraphQLClient } from "graphql-request";

import { getSdk } from "./codegen/generated-api";
import { sendWebsocketMessageFunction } from "./websockets/server";

const DEFAULT_API_ORIGIN = "https://api.whop.com";

export interface WhopApiOptions {
	appApiKey: string;
	onBehalfOfUserId?: string;
	companyId?: string;
	apiOrigin?: string;
	websocketOrigin?: string;
}

export function WhopApi(options: WhopApiOptions) {
	const sdk = getSdk(makeRequester(options));
	const SendWebsocketMessage = sendWebsocketMessageFunction(options);

	return {
		...sdk,
		SendWebsocketMessage,
		withUser(userId: string) {
			return WhopApi({
				...options,
				onBehalfOfUserId: userId,
			});
		},
		withCompany(companyId: string) {
			return WhopApi({
				...options,
				companyId,
			});
		},
	};
}

function makeRequester(apiOptions: WhopApiOptions): Requester<RequestInit> {
	const client = makeClient(apiOptions);
	return async function fetcher<R, V>(
		doc: DocumentNode,
		vars?: V,
		options?: RequestInit,
	): Promise<R> {
		const headers = new Headers(options?.headers);
		const result = await client.request(doc, vars as Variables, headers);
		return result as R;
	};
}

function makeClient(apiOptions: WhopApiOptions) {
	const url = new URL(
		"/public-graphql",
		apiOptions.apiOrigin ?? DEFAULT_API_ORIGIN,
	);
	return new GraphQLClient(url.href, {
		headers: getHeaders(apiOptions),
		fetch: wrappedFetch,
		requestMiddleware: (req) => {
			// Attach the operation name to the pathname.
			const newUrl = new URL(req.url);
			if (req.operationName) {
				if (newUrl.pathname.endsWith("/")) {
					newUrl.pathname = `${newUrl.pathname}${req.operationName}/`;
				} else {
					newUrl.pathname = `${newUrl.pathname}/${req.operationName}`;
				}
			}
			req.url = newUrl.href;
			return req;
		},
	});
}

function getHeaders(options: WhopApiOptions) {
	const headers = new Headers();
	headers.set("Authorization", `Bearer ${options.appApiKey}`);
	if (options.onBehalfOfUserId)
		headers.set("x-on-behalf-of", options.onBehalfOfUserId);
	if (options.companyId) headers.set("x-company-id", options.companyId);
	return headers;
}

class GQLNetworkError extends Error {
	constructor(e: unknown) {
		const message =
			e instanceof Error
				? e.message
				: typeof e === "string"
					? e
					: "Unknown network error";
		super(message);
		if (e instanceof Error) this.stack = e.stack;
	}
}

const wrappedFetch: typeof fetch = async (...args) => {
	try {
		return await fetch(...args);
	} catch (e) {
		throw new GQLNetworkError(e);
	}
};
