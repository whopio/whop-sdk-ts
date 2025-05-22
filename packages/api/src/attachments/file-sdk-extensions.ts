import {
	type BaseSdk,
	partialFileSdkExtensions,
} from "./partial-file-sdk-extensions";
import { uploadAttachment } from "./upload";

export function fileSdkExtensions(baseSdk: BaseSdk) {
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
