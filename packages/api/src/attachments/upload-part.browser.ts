import {
	MULTIPART_UPLOAD_CHUNK_SIZE,
	type MultipartUploadTask,
} from "@/attachments/common";

/**
 * Uploads a part of a file.
 * @param task - The task to upload.
 * @returns The etag of the uploaded part.
 */
export async function uploadPartImpl({
	url,
	fullData,
	partNumber,
	headers,
	onProgress,
	signal,
}: MultipartUploadTask) {
	const offset = (partNumber - 1) * MULTIPART_UPLOAD_CHUNK_SIZE;
	const data = fullData.slice(
		offset,
		Math.min(offset + MULTIPART_UPLOAD_CHUNK_SIZE, fullData.size),
	);

	signal?.throwIfAborted();

	const cleanup: (() => void)[] = [];

	return new Promise<string>((resolve, reject) => {
		const fullURL = new URL(url);
		const xhr = new XMLHttpRequest();

		if (signal) {
			const onAbort = () => {
				xhr.abort();
				reject(new Error("Upload aborted"));
			};
			signal.addEventListener("abort", onAbort);
			cleanup.push(() => signal.removeEventListener("abort", onAbort));
		}

		xhr.upload.onprogress = (event) => {
			onProgress?.(event);
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				const etag = xhr.getResponseHeader("Etag");
				if (!etag) {
					reject(new Error("Could not upload file"));
					return;
				}
				resolve(etag.slice(1, -1));
			} else {
				reject(new Error("Could not upload file"));
			}
		};

		xhr.onerror = () => {
			reject(new Error("Could not upload file"));
		};

		xhr.open("PUT", fullURL.href);

		if (headers) {
			for (const [key, value] of Object.entries(headers)) {
				xhr.setRequestHeader(key, value);
			}
		}

		xhr.send(data);
		onProgress?.(new ProgressEvent("upload", { total: data.size, loaded: 0 }));
	}).finally(() => {
		for (const fn of cleanup) {
			fn();
		}
	});
}
