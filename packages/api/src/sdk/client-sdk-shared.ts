import { fileSdkExtensions } from "@/attachments/file-sdk-extensions";
import type { makeUploadAttachmentFunction } from "@/attachments/upload";
import { type Requester, getSdk } from "@/codegen/graphql";
import { wrappedFetch } from "@/sdk/sdk-common";
import { makeConnectToWebsocketFunction } from "@/websockets/client.browser";
import type { DocumentNode } from "graphql";
import { GraphQLClient, type Variables } from "graphql-request";

/**
 * SDK options for client side use
 */
export interface WhopClientSdkOptions {
	/** the origin of the API */
	apiOrigin?: string;
	/** the path of the API */
	apiPath?: string;
}

export function makeWhopClientSdk({
	uploadFile,
}: { uploadFile: ReturnType<typeof makeUploadAttachmentFunction> }) {
	return function WhopClientSdk(options?: WhopClientSdkOptions) {
		const baseSdk = getSdk(
			makeRequester({
				apiPath: "/_whop/public-graphql",
				...options,
			}),
		);

		const fileSdk = fileSdkExtensions(baseSdk, uploadFile);

		const connectToWebsocket = makeConnectToWebsocketFunction();

		const sdk = {
			...baseSdk,
			connectToWebsocket,
			...fileSdk,
		};

		return sdk;
	};
}

export type WhopClientSdk = ReturnType<ReturnType<typeof makeWhopClientSdk>>;

function makeRequester(
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
