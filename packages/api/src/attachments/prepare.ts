import type { AttachableRecords, Sdk } from "@/codegen/generated-api";

import { MULTIPART_UPLOAD_CHUNK_SIZE } from "@/attachments/common";
import { b64 } from "@/utils/b64";
import { md5 } from "@/utils/md5";

/**
 * Prepares a file for upload.
 * @param data The file to upload.
 * @param record The record to upload the file to.
 * @returns The prepared file.
 */
export async function prepareAttachmentForUpload(
	this: Sdk,
	data: File | Blob,
	record: AttachableRecords,
) {
	const isMultipart = data.size > MULTIPART_UPLOAD_CHUNK_SIZE;
	const res = await this.uploadMedia({
		input: {
			byteSizeV2: data.size.toString(),
			record,
			filename: data instanceof File ? data.name : crypto.randomUUID(),
			contentType: data.type,
			checksum: await b64(md5(data.stream())),
			multipart: isMultipart,
		},
	});

	if (isMultipart) {
		if (
			!res.mediaDirectUpload?.multipartUploadId ||
			!res.mediaDirectUpload.multipartUploadUrls
		) {
			throw new Error("Failed to prepare file");
		}

		return {
			data,
			id: res.mediaDirectUpload.id,
			multipartUploadUrls: res.mediaDirectUpload.multipartUploadUrls,
			multipartUploadId: res.mediaDirectUpload.multipartUploadId,
			record,
			multipart: true as const,
		};
	}

	if (!res.mediaDirectUpload?.id || !res.mediaDirectUpload.uploadUrl) {
		throw new Error("Failed to prepare file");
	}

	return {
		data,
		id: res.mediaDirectUpload.id,
		uploadUrl: res.mediaDirectUpload.uploadUrl,
		headers: res.mediaDirectUpload.headers as Record<string, string>,
		record,
		multipart: false as const,
	};
}

export type PreparedAttachment = Awaited<
	ReturnType<typeof prepareAttachmentForUpload>
>;
