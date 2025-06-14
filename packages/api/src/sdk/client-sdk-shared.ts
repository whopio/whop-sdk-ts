import { fileSdkExtensions } from "@/attachments/file-sdk-extensions";
import type { makeUploadAttachmentFunction } from "@/attachments/upload";
import { type Requester, getSdk } from "@/codegen/graphql/client";
import { graphqlFetch } from "@/sdk/sdk-common";
import { makeConnectToWebsocketFunction } from "@/websockets/client.browser";

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

		const websocketClient = makeConnectToWebsocketFunction();

		const sdk = {
			...baseSdk,
			attachments: {
				...baseSdk.attachments,
				...fileSdk,
			},
			websockets: {
				client: websocketClient,
			},
		};

		return sdk;
	};
}

export type WhopClientSdk = ReturnType<ReturnType<typeof makeWhopClientSdk>>;

function makeRequester(
	apiOptions: WhopClientSdkOptions,
): Requester<RequestInit> {
	const endpoint = getEndpoint(apiOptions);
	return async function fetcher<R, V>(
		operationId: string,
		operationName: string,
		operationType: "query" | "mutation",
		vars?: V,
		options?: RequestInit,
	): Promise<R> {
		const headers = new Headers(options?.headers);
		return graphqlFetch<R, V>(
			endpoint,
			operationId,
			operationName,
			operationType,
			vars,
			headers,
		);
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
