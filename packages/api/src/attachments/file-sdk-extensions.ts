import {
	type BaseSdk,
	partialFileSdkExtensions,
} from "./partial-file-sdk-extensions";
import type { makeUploadAttachmentFunction } from "./upload";

export function fileSdkExtensions(
	baseSdk: BaseSdk,
	uploadAttachmentFn: ReturnType<typeof makeUploadAttachmentFunction>,
) {
	const partial = partialFileSdkExtensions(baseSdk);

	const uploadAttachment = uploadAttachmentFn.bind({
		...baseSdk,
		...partial,
	});

	return {
		...partial,
		uploadAttachment,
	};
}

export type FileSdkExtensions = ReturnType<typeof fileSdkExtensions>;
