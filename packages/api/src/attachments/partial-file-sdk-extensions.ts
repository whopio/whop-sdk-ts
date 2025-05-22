import type { getSdk } from "@/codegen/generated-api";
import { analyzeAttachment } from "./analyze";
import { prepareAttachmentForUpload } from "./prepare";

export type BaseSdk = ReturnType<typeof getSdk<RequestInit>>;

export function partialFileSdkExtensions(baseSdk: BaseSdk) {
	const PrepareAttachmentForUpload = prepareAttachmentForUpload.bind(baseSdk);
	const AnalyzeAttachment = analyzeAttachment.bind(baseSdk);
	return {
		PrepareAttachmentForUpload,
		AnalyzeAttachment,
	};
}

export type PartialFileSdkExtensions = ReturnType<
	typeof partialFileSdkExtensions
>;
