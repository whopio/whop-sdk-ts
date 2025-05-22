import type { getSdk } from "@/codegen/generated-api";
import { partialFileSdkExtensions } from "./partial-file-sdk-extensions";
import { uploadAttachment } from "./upload";

type BaseSdk = ReturnType<typeof getSdk<RequestInit>>;

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
