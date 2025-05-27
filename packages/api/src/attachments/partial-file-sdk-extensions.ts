import type { getSdk } from "@/codegen/graphql";
import { analyzeAttachment as analyzeAttachmentFn } from "./analyze";
import { prepareAttachmentForUpload as prepareAttachmentForUploadFn } from "./prepare";

export type BaseSdk = ReturnType<typeof getSdk<RequestInit>>;

export function partialFileSdkExtensions(baseSdk: BaseSdk) {
	const prepareAttachmentForUpload = prepareAttachmentForUploadFn.bind(baseSdk);
	const analyzeAttachment = analyzeAttachmentFn.bind(baseSdk);
	return {
		prepareAttachmentForUpload,
		analyzeAttachment,
	};
}

export type PartialFileSdkExtensions = ReturnType<
	typeof partialFileSdkExtensions
>;
