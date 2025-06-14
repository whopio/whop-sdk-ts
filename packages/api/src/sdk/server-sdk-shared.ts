import { fileSdkExtensions } from "@/attachments/file-sdk-extensions";
import type { makeUploadAttachmentFunction } from "@/attachments/upload";
import { type Requester, getSdk } from "@/codegen/graphql/server";
import { WhopOAuth } from "@/oauth";
import { DEFAULT_API_ORIGIN, graphqlFetch } from "@/sdk/sdk-common";
import { makeUserTokenVerifier } from "@/verify-user-token";
import { makeConnectToWebsocketFunction } from "@/websockets/client.server";
import { sendWebsocketMessageFunction } from "@/websockets/server";

/**
 * SDK options for server side use
 */
export interface WhopServerSdkOptions {
	/** The API key to use for API calls */
	appApiKey: string;
	/** Required when using the oauth module. Defaults to `NEXT_PUBLIC_WHOP_APP_ID` */
	appId: string;
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
	const websocketClient = makeConnectToWebsocketFunction(options);

	const fileSdk = fileSdkExtensions(baseSdk, uploadFile);
	const oauth = new WhopOAuth(
		options.appId,
		options.appApiKey,
		options.apiOrigin,
	);
	const verifyUserToken = makeUserTokenVerifier({
		appId: options.appId,
		dontThrow: false,
	});

	return {
		...baseSdk,
		attachments: {
			...baseSdk.attachments,
			...fileSdk,
		},
		websockets: {
			sendMessage: sendWebsocketMessage,
			client: websocketClient,
		},
		oauth,
		verifyUserToken,
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
	const endpoint = getEndpoint(apiOptions);
	const headers = getHeaders(apiOptions);
	return async function fetcher<R, V>(
		operationId: string,
		operationName: string,
		operationType: "query" | "mutation",
		vars?: V,
		options?: RequestInit,
	): Promise<R> {
		const customHeaders = new Headers(options?.headers);
		const actualHeaders = new Headers(headers);
		for (const [key, value] of customHeaders.entries()) {
			actualHeaders.set(key, value);
		}
		return graphqlFetch<R, V>(
			endpoint,
			operationId,
			operationName,
			operationType,
			vars,
			actualHeaders,
		);
	};
}

function getEndpoint(apiOptions: WhopServerSdkOptions) {
	const url = new URL(
		apiOptions.apiPath ?? "/public-graphql",
		apiOptions.apiOrigin ?? DEFAULT_API_ORIGIN,
	);
	return url.href;
}

export function getHeaders(options: WhopServerSdkOptions) {
	const headers = new Headers();

	headers.set("Authorization", `Bearer ${options.appApiKey}`);
	if (options.onBehalfOfUserId)
		headers.set("x-on-behalf-of", options.onBehalfOfUserId);
	if (options.companyId) headers.set("x-company-id", options.companyId);

	return headers;
}
