import { makeUploadAttachmentFunction } from "@/attachments/upload";
import { uploadPartImpl } from "@/attachments/upload-part-node";

const uploadFile = makeUploadAttachmentFunction({ uploadPart: uploadPartImpl });

const sdk = makeWhopServerSdk({ uploadFile });

import type { WhopServerSdkOptions } from "./server-sdk-shared";
import { makeWhopServerSdk } from "./server-sdk-shared";

export function WhopServerSdk(options: WhopServerSdkOptions) {
	return sdk(options);
}

export type WhopServerSdk = ReturnType<typeof WhopServerSdk>;
export type { WhopServerSdkOptions };
