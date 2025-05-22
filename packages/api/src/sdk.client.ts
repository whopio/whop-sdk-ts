import { type Requester, getSdk } from "@/codegen/generated-api";
import { wrappedFetch } from "@/sdk.common";
import type { DocumentNode } from "graphql";
import { GraphQLClient, type Variables } from "graphql-request";
import { fileSdkExtensions } from "./attachments/file-sdk-extensions";
import { makeConnectToWebsocketFunction } from "./websockets/client.browser";

/**
 * SDK options for client side use
 */
export interface WhopClientSdkOptions {
	/** the origin of the API */
	apiOrigin?: string;
	/** the path of the API */
	apiPath?: string;
}

export function WhopClientSdk(options?: WhopClientSdkOptions) {
	const baseSdk = getSdk(
		makeRequester({
			apiPath: "/_whop/public-graphql",
			...options,
		}),
	);

	const fileSdk = fileSdkExtensions(baseSdk);

	const ConnectToWebsocket = makeConnectToWebsocketFunction();

	const sdk = {
		...baseSdk,
		ConnectToWebsocket,
		...fileSdk,
	};

	return sdk;
}

export type WhopClientSdk = ReturnType<typeof WhopClientSdk>;

export function makeRequester(
	apiOptions: WhopClientSdkOptions,
): Requester<RequestInit> {
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

function getEndpoint(apiOptions: WhopClientSdkOptions) {
	if (typeof document === "undefined") {
		throw new Error("WhopApi.client() is only available in the browser");
	}

	const url = new URL(
		apiOptions.apiPath ?? "/public-graphql",
		apiOptions.apiOrigin ?? window.location.origin,
	);

	return url.href;
}

function makeClient(apiOptions: WhopClientSdkOptions) {
	return new GraphQLClient(getEndpoint(apiOptions), {
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
