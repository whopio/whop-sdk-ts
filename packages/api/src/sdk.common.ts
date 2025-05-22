import type { getSdk } from "@/codegen/generated-api";

import { analyzeAttachment } from "@/attachments/analyze";
import { prepareAttachmentForUpload } from "@/attachments/prepare";
import { uploadAttachment } from "@/attachments/upload";

export const DEFAULT_API_ORIGIN = "https://api.whop.com";

export type BaseSdk = ReturnType<typeof getSdk<RequestInit>>;

export type ExtendedSdk<S extends BaseSdk = BaseSdk> = S & {
	UploadAttachment(
		...args: Parameters<typeof uploadAttachment>
	): ReturnType<typeof uploadAttachment>;
	PrepareAttachmentForUpload(
		...args: Parameters<typeof prepareAttachmentForUpload>
	): ReturnType<typeof prepareAttachmentForUpload>;
	AnalyzeAttachment(
		...args: Parameters<typeof analyzeAttachment>
	): ReturnType<typeof analyzeAttachment>;
};

/**
 * Extends the base SDK with the custom methods and helpers.
 * @param sdk The base SDK
 * @returns The extended SDK
 */
export function extendSdk<S extends BaseSdk>(sdk: S): ExtendedSdk<S> {
	const boundPrepareAttachmentForUpload = prepareAttachmentForUpload.bind(sdk);
	const boundAnalyzeAttachment = analyzeAttachment.bind(sdk);
	const boundUploadAttachment = uploadAttachment.bind({
		...sdk,
		PrepareAttachmentForUpload: boundPrepareAttachmentForUpload,
		AnalyzeAttachment: boundAnalyzeAttachment,
	});

	return {
		...sdk,
		PrepareAttachmentForUpload: boundPrepareAttachmentForUpload,
		UploadAttachment: boundUploadAttachment,
		AnalyzeAttachment: boundAnalyzeAttachment,
	};
}

export class GQLNetworkError extends Error {
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

export const wrappedFetch: typeof fetch = async (...args) => {
	try {
		return await fetch(...args);
	} catch (e) {
		throw new GQLNetworkError(e);
	}
};
