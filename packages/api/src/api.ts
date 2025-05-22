import type { DocumentNode } from "graphql";
import type { Variables } from "graphql-request";
import type { Requester } from "./codegen/generated-api";

import { GraphQLClient } from "graphql-request";

import OperationStoreClient from "./OperationStoreClient";
import { getSdk } from "./codegen/generated-api";

const DEFAULT_API_ORIGIN = "https://api.whop.com";

export interface WhopApiOptions {
	appApiKey: string;
	onBehalfOfUserId?: string;
	companyId?: string;
	apiOrigin?: string;
}

export function WhopApi(options: WhopApiOptions) {
	const sdk = getSdk(makeRequester(options));

	return {
		...sdk,
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

				// Use Operation ID if available
				try {
					console.log("--------------------------------");
					console.log(req.operationName);
					console.log("--------------------------------");
					const operationId = OperationStoreClient.getOperationId(
						req.operationName,
					);
					console.log("--------------------------------");
					console.log(operationId);
					console.log("--------------------------------");

					// delete req.query; // Omit the "query" param
					req.operationId = operationId; // Add "operationId" param
				} catch (e) {
					// If an error occurs (e.g., operation name not found in OperationStoreClient),
					// fall back to sending the full query.
					console.warn(
						`Failed to get operationId for ${req.operationName}:`,
						e,
					);
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
	headers.set("x-hello-world", "hello");
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
