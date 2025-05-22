import type { WhopSdk } from "@/api";
import type { MultipartUploadTask } from "@/attachments/common";
import type { PreparedAttachment } from "@/attachments/prepare";
import type {
	AttachableRecords,
	AttachmentFragment,
	Media,
} from "@/codegen/generated-api";

import { uploadPart } from "@/attachments/upload-part";
import { retry } from "@/utils/retry";
import { sum } from "@/utils/sum";

const uploadTasks: {
	task: MultipartUploadTask;
	resolve: (uploadResult: { etag: string; partNumber: number }) => void;
	reject: (error: unknown) => void;
}[] = [];

let workerCount = 0;
const maxWorkers = 10;

/**
 * Drains the upload queue.
 * @returns The etags of the uploaded parts.
 */
async function uploadWorker() {
	if (workerCount >= maxWorkers) {
		return;
	}

	workerCount++;

	while (uploadTasks.length > 0) {
		const task = uploadTasks.shift();
		if (!task) {
			continue;
		}

		try {
			const etag = await retry(uploadPart, 10, task.task.signal, task.task);
			task.resolve({ etag, partNumber: task.task.partNumber });
		} catch (e) {
			task.reject(e);
		}
	}

	workerCount--;
}

/**
 * Enqueues a list of tasks to upload a file in parts.
 * @param tasks - The tasks to upload.
 * @param priority - Whether to upload the tasks in priority.
 * @returns The etags of the uploaded parts.
 */
function uploadParts(tasks: MultipartUploadTask[], priority = false) {
	const promises = tasks.map((task) => {
		return new Promise<{ etag: string; partNumber: number }>(
			(resolve, reject) => {
				if (priority) {
					uploadTasks.unshift({ task, resolve, reject });
				} else {
					uploadTasks.push({ task, resolve, reject });
				}
			},
		);
	});

	for (let i = 0; i < Math.min(tasks.length, maxWorkers); i++) {
		void uploadWorker();
	}

	return Promise.all(promises);
}

/**
 * Uploads a prepared file, automatically handling multipart uploads.
 * @param preparedFile - The prepared file to upload.
 * @param onProgress - The callback to call when the progress changes.
 * @param signal - The signal to abort the upload.
 * @returns The etags of the uploaded parts.
 */
async function handleUpload(
	{ data, ...preparedFile }: PreparedAttachment,
	{
		onProgress,
		signal,
	}: { onProgress?: (progress: number) => void; signal?: AbortSignal },
) {
	console.log(preparedFile);
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

interface UploadFileOptions {
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
 * Uploads a file.
 * @param input - The input to upload.
 * @param opts - The options to upload the file.
 * @returns The attachment.
 */
export async function uploadAttachment(
	this: Pick<
		WhopSdk,
		"prepareAttachmentForUpload" | "processMedia" | "analyzeAttachment"
	>,
	input: UploadFileInput,
	{ onProgress, signal }: UploadFileOptions = {},
): Promise<{
	id: string;
	record: AttachableRecords;
	attachment: AttachmentFragment;
}> {
	// prepare the file
	const preparedAttachment =
		"record" in input && "file" in input
			? await this.prepareAttachmentForUpload(input.file, input.record)
			: await input;

	// upload the file
	const result = await handleUpload(preparedAttachment, { onProgress, signal });
	// get the media type
	const mediaType = getMediaType(preparedAttachment.data);

	// request media processing
	if (preparedAttachment.multipart) {
		await this.processMedia({
			input: {
				directUploadId: preparedAttachment.id,
				mediaType,
				multipartUploadId: preparedAttachment.multipartUploadId,
				multipartParts: result,
			},
		});
	} else {
		await this.processMedia({
			input: {
				directUploadId: preparedAttachment.id,
				mediaType,
			},
		});
	}

	const attachment = await this.analyzeAttachment(preparedAttachment.id, {
		signal,
	});

	if (!attachment) {
		throw new Error("Failed to analyze Attachment");
	}

	return {
		id: preparedAttachment.id,
		record: preparedAttachment.record,
		attachment,
	};
}
