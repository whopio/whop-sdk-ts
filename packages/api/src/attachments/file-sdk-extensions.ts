import {
	type BaseSdk,
	partialFileSdkExtensions,
} from "./partial-file-sdk-extensions";
import type { makeUploadAttachmentFunction } from "./upload";

export function fileSdkExtensions(
	baseSdk: BaseSdk,
	uploadAttachment: ReturnType<typeof makeUploadAttachmentFunction>,
) {
	const partial = partialFileSdkExtensions(baseSdk);

	const UploadAttachment = uploadAttachment.bind({
		...baseSdk,
		...partial,
	});

	return {
		...partial,
		UploadAttachment,
	};
}

export type FileSdkExtensions = ReturnType<typeof fileSdkExtensions>;
