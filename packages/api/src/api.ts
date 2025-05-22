import type { Requester } from "@/codegen/generated-api";
import type { DocumentNode } from "graphql";
import type { Variables } from "graphql-request";

import { GraphQLClient } from "graphql-request";

import { analyzeAttachment } from "@/attachments/analyze";
import { prepareAttachmentForUpload } from "@/attachments/prepare";
import { uploadAttachment } from "@/attachments/upload";
import { getSdk } from "@/codegen/generated-api";

const DEFAULT_API_ORIGIN = "https://api.whop.com";

export interface WhopApiOptions {
	appApiKey: string;
	onBehalfOfUserId?: string;
	companyId?: string;
	/**
	 * The origin of the API. `undefined` will use the default origin while `null` will omit the origin.
	 */
	apiOrigin?: string;
	apiPath?: string;
}

export interface WhopApiClientOptions {
	/**
	 * The origin of the API. `undefined` will use the default origin while `null` will omit the origin.
	 */
	apiOrigin?: string | null;
	apiPath?: string;
}

type BaseSdk = ReturnType<typeof getSdk<RequestInit>>;

type ExtendedSdk<S extends BaseSdk = BaseSdk> = S & {
	uploadAttachment(
		...args: Parameters<typeof uploadAttachment>
	): ReturnType<typeof uploadAttachment>;
	prepareAttachmentForUpload(
		...args: Parameters<typeof prepareAttachmentForUpload>
	): ReturnType<typeof prepareAttachmentForUpload>;
	analyzeAttachment(
		...args: Parameters<typeof analyzeAttachment>
	): ReturnType<typeof analyzeAttachment>;
};

function extendSdk<S extends BaseSdk>(sdk: S): ExtendedSdk<S> {
	const boundPrepareAttachmentForUpload = prepareAttachmentForUpload.bind(sdk);
	const boundAnalyzeAttachment = analyzeAttachment.bind(sdk);
	const boundUploadAttachment = uploadAttachment.bind({
		...sdk,
		prepareAttachmentForUpload: boundPrepareAttachmentForUpload,
		analyzeAttachment: boundAnalyzeAttachment,
	});

	return {
		...sdk,
		prepareAttachmentForUpload: boundPrepareAttachmentForUpload,
		uploadAttachment: boundUploadAttachment,
		analyzeAttachment: boundAnalyzeAttachment,
	};
}

export function WhopApi(options: WhopApiOptions): ExtendedSdk & {
	withUser(userId: string): ExtendedSdk;
	withCompany(companyId: string): ExtendedSdk;
} {
	const sdk = {
		...getSdk(makeRequester(options)),
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

	return extendSdk(sdk);
}

WhopApi.client = (options?: WhopApiClientOptions) => {
	return extendSdk(
		getSdk(
			makeRequester({
				apiPath: "/_whop/public-graphql",
				apiOrigin: null,
				...options,
			}),
		),
	);
};

export type WhopSdk = ReturnType<typeof WhopApi>;

function makeRequester(
	apiOptions: WhopApiOptions | WhopApiClientOptions,
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

function getEndpoint(apiOptions: WhopApiOptions | WhopApiClientOptions) {
	if ("appApiKey" in apiOptions) {
		const url = new URL(
			apiOptions.apiPath ?? "/public-graphql",
			apiOptions.apiOrigin ?? DEFAULT_API_ORIGIN,
		);
		return url.href;
	}

	if (typeof window === "undefined") {
		throw new Error("WhopApi.client() is only available in the browser");
	}

	const url = new URL(
		apiOptions.apiPath ?? "/public-graphql",
		apiOptions.apiOrigin ?? window.location.origin,
	);

	return url.href;
}

function makeClient(apiOptions: WhopApiOptions | WhopApiClientOptions) {
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

function getHeaders(options: WhopApiOptions | WhopApiClientOptions) {
	const headers = new Headers();
	if ("appApiKey" in options) {
		headers.set("Authorization", `Bearer ${options.appApiKey}`);
		if (options.onBehalfOfUserId)
			headers.set("x-on-behalf-of", options.onBehalfOfUserId);
		if (options.companyId) headers.set("x-company-id", options.companyId);
	}
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
