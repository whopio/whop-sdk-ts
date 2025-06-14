import type { AttachableRecords, Sdk } from "@/codegen/graphql/client";

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
	const mediaDirectUpload = await this.attachments.uploadMedia({
		byteSizeV2: data.size.toString(),
		record,
		filename: data instanceof File ? data.name : crypto.randomUUID(),
		contentType: data.type,
		checksum: await b64(md5(data.stream())),
		multipart: isMultipart,
	});

	if (isMultipart) {
		if (
			!mediaDirectUpload?.multipartUploadId ||
			!mediaDirectUpload.multipartUploadUrls
		) {
			throw new Error("Failed to prepare file");
		}

		return {
			data,
			id: mediaDirectUpload.id,
			multipartUploadUrls: mediaDirectUpload.multipartUploadUrls,
			multipartUploadId: mediaDirectUpload.multipartUploadId,
			record,
			multipart: true as const,
		};
	}

	if (!mediaDirectUpload?.id || !mediaDirectUpload.uploadUrl) {
		throw new Error("Failed to prepare file");
	}

	return {
		data,
		id: mediaDirectUpload.id,
		uploadUrl: mediaDirectUpload.uploadUrl,
		headers: mediaDirectUpload.headers as Record<string, string>,
		record,
		multipart: false as const,
	};
}

export type PreparedAttachment = Awaited<
	ReturnType<typeof prepareAttachmentForUpload>
>;
