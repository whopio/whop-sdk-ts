import type { MultipartUploadTask } from "@/attachments/common";

const uploadPartModule =
	typeof document !== "undefined"
		? import("@/attachments/upload-part.browser")
		: import("@/attachments/upload-part.server");

/**
 * Uploads a part of a file.
 * @param task The task to upload.
 * @returns The etag of the uploaded part.
 */
export async function uploadPart(task: MultipartUploadTask) {
	const { uploadPartImpl } = await uploadPartModule;

	return uploadPartImpl(task);
}
