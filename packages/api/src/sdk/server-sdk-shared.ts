import { fileSdkExtensions } from "@/attachments/file-sdk-extensions";
import type { makeUploadAttachmentFunction } from "@/attachments/upload";
import { type Requester, getSdk } from "@/codegen/graphql";
import { DEFAULT_API_ORIGIN, wrappedFetch } from "@/sdk/sdk-common";
import { makeConnectToWebsocketFunction } from "@/websockets/client.server";
import { sendWebsocketMessageFunction } from "@/websockets/server";
import type { DocumentNode } from "graphql";
import { GraphQLClient, type Variables } from "graphql-request";

/**
 * SDK options for server side use
 */
export interface WhopServerSdkOptions {
	/** The API key to use for API calls */
	appApiKey: string;
	/** Use this to make the API calls on behalf of a user */
	onBehalfOfUserId?: string;
	/** Use this to make the API calls on behalf of a company */
	companyId?: string;
	/** the origin of the API */
	apiOrigin?: string;
	/** the path of the API */
	apiPath?: string;
	/** the origin of the server to server websocket api */
	websocketOrigin?: string;
}

function BaseWhopServerSdk(
	options: WhopServerSdkOptions,
	uploadFile: ReturnType<typeof makeUploadAttachmentFunction>,
) {
	const baseSdk = getSdk(makeRequester(options));

	const sendWebsocketMessage = sendWebsocketMessageFunction(options);
	const connectToWebsocket = makeConnectToWebsocketFunction(options);

	const fileSdk = fileSdkExtensions(baseSdk, uploadFile);

	return {
		...baseSdk,
		...fileSdk,
		sendWebsocketMessage,
		connectToWebsocket,
	};
}

export function makeWhopServerSdk({
	uploadFile,
}: { uploadFile: ReturnType<typeof makeUploadAttachmentFunction> }) {
	return function WhopServerSdk(options: WhopServerSdkOptions): WhopServerSdk {
		const baseSdk = BaseWhopServerSdk(options, uploadFile);

		return {
			...baseSdk,
			withUser: (userId: string) =>
				WhopServerSdk({ ...options, onBehalfOfUserId: userId }),
			withCompany: (companyId: string) =>
				WhopServerSdk({ ...options, companyId }),
		};
	};
}

export type WhopServerSdk = ReturnType<typeof BaseWhopServerSdk> & {
	withUser: (userId: string) => WhopServerSdk;
	withCompany: (companyId: string) => WhopServerSdk;
};

function makeRequester(
	apiOptions: WhopServerSdkOptions,
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

function getEndpoint(apiOptions: WhopServerSdkOptions) {
	const url = new URL(
		apiOptions.apiPath ?? "/public-graphql",
		apiOptions.apiOrigin ?? DEFAULT_API_ORIGIN,
	);
	return url.href;
}

export function makeClient(apiOptions: WhopServerSdkOptions) {
	return new GraphQLClient(getEndpoint(apiOptions), {
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

export function getHeaders(options: WhopServerSdkOptions) {
	const headers = new Headers();

	headers.set("Authorization", `Bearer ${options.appApiKey}`);
	if (options.onBehalfOfUserId)
		headers.set("x-on-behalf-of", options.onBehalfOfUserId);
	if (options.companyId) headers.set("x-company-id", options.companyId);

	return headers;
}
