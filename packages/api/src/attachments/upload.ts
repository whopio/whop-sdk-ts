import type { PreparedAttachment } from "@/attachments/prepare";
import type {
	AttachableRecords,
	AttachmentFragment,
	Media,
	getSdk,
} from "@/codegen/generated-api";

import { uploadParts } from "@/attachments/upload-parts";
import { sum } from "@/utils/sum";
import type { PartialFileSdkExtensions } from "./partial-file-sdk-extensions";

/**
 * Uploads a prepared file, automatically handling multipart uploads.
 * @param preparedFile The prepared file to upload.
 * @param onProgress The callback to call when the progress changes.
 * @param signal The signal to abort the upload.
 * @returns The etags of the uploaded parts.
 */
async function handleUpload(
	{ data, ...preparedFile }: PreparedAttachment,
	{
		onProgress,
		signal,
	}: { onProgress?: (progress: number) => void; signal?: AbortSignal },
) {
	if (preparedFile.multipart) {
		const loaded = Array(preparedFile.multipartUploadUrls.length).fill(0);

		const result = await uploadParts(
			preparedFile.multipartUploadUrls.map((part, index) => ({
				...part,
				fullData: data,
				onProgress: (event) => {
					loaded[index] = event.loaded;
					const total = sum(...loaded);
					onProgress?.(Math.round((total / data.size) * 100));
				},
				signal,
			})),
		);

		return result;
	}

	await uploadParts(
		[
			{
				url: preparedFile.uploadUrl,
				fullData: data,
				partNumber: 1,
				headers: preparedFile.headers,
				onProgress: (event) => {
					onProgress?.(Math.round((event.loaded / data.size) * 100));
				},
				signal,
			},
		],
		true,
	);

	return [];
}

/**
 * The file input for the attachment upload.
 */
type UploadFileInput =
	| {
			file: File | Blob;
			record: AttachableRecords;
	  }
	| PreparedAttachment
	| Promise<PreparedAttachment>;

function getMediaType(data: File | Blob): Media {
	switch (true) {
		case data.type.startsWith("image/"):
			return "image";
		case data.type.startsWith("video/"):
			return "video";
		case data.type.startsWith("audio/"):
			return "audio";
		default:
			return "other";
	}
}

/**
 * Additional options for the attachment upload.
 */
export interface UploadFileOptions {
	/**
	 * This callback is called with the progress of the upload.
	 */
	onProgress?: (progress: number) => void;
	/**
	 * This signal can be used to abort the upload.
	 */
	signal?: AbortSignal;
}

/**
 * Response returned by `UploadAttachment`.
 */
export interface UploadAttachmentResponse {
	/** The direct upload ID - use this to attach the attachment to a resource */
	directUploadId: string;
	/** The record type the attachment was attached to */
	record: AttachableRecords;
	/** The attachment */
	attachment: AttachmentFragment;
}

/**
 * Uploads a file.
 * @param input - The input to upload.
 * @param opts - The options to upload the file.
 * @returns The attachment.
 */
export async function uploadAttachment(
	this: PartialFileSdkExtensions &
		Pick<ReturnType<typeof getSdk<RequestInit>>, "ProcessAttachment">,
	input: UploadFileInput,
	{ onProgress, signal }: UploadFileOptions = {},
): Promise<UploadAttachmentResponse> {
	// prepare the file
	const preparedAttachment =
		"record" in input && "file" in input
			? await this.PrepareAttachmentForUpload(input.file, input.record)
			: await input;

	// upload the file
	const result = await handleUpload(preparedAttachment, { onProgress, signal });
	// get the media type
	const mediaType = getMediaType(preparedAttachment.data);

	// request media processing
	if (preparedAttachment.multipart) {
		await this.ProcessAttachment({
			input: {
				directUploadId: preparedAttachment.id,
				mediaType,
				multipartUploadId: preparedAttachment.multipartUploadId,
				multipartParts: result,
			},
		});
	} else {
		await this.ProcessAttachment({
			input: {
				directUploadId: preparedAttachment.id,
				mediaType,
			},
		});
	}

	const attachment = await this.AnalyzeAttachment(preparedAttachment.id, {
		signal,
	});

	if (!attachment) {
		throw new Error("Failed to analyze Attachment");
	}

	return {
		directUploadId: preparedAttachment.id,
		record: preparedAttachment.record,
		attachment,
	};
}
