import { makeUploadAttachmentFunction } from "@/attachments/upload";
import { uploadPartImpl } from "@/attachments/upload-part-browser";
import { makeWhopClientSdk } from "./client-sdk-shared";

const uploadFile = makeUploadAttachmentFunction({ uploadPart: uploadPartImpl });

const sdk = makeWhopClientSdk({ uploadFile });

import type { WhopClientSdkOptions } from "./client-sdk-shared";

export function WhopClientSdk(options?: WhopClientSdkOptions) {
	return sdk(options);
}

export type WhopClientSdk = ReturnType<typeof WhopClientSdk>;
export type { WhopClientSdkOptions };
