import {
	MULTIPART_UPLOAD_CHUNK_SIZE,
	type MultipartUploadTask,
} from "@/attachments/common";
import { request } from "node:https";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

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

	return new Promise<string>((resolve, reject) => {
		const fullURL = new URL(url);
		const req = request(fullURL, {
			method: "PUT",
			headers: {
				...headers,
				host: fullURL.host,
				"content-length": data.size.toString(),
			},
			signal,
		});

		let uploadedBytes = 0;

		req.on("response", async (res) => {
			const statusCode = res.statusCode ?? 0;
			if (statusCode >= 200 && statusCode < 300) {
				const etag = res.headers.etag;
				if (!etag) {
					reject(new Error("Missing etag on upload response"));
					return;
				}
				resolve(etag.slice(1, -1));
			} else {
				let chunks = "";
				for await (const chunk of res) {
					chunks += chunk.toString();
				}
				reject(
					new Error(
						`Failed to upload part with ${statusCode}: ${res.statusMessage}`,
						{ cause: chunks },
					),
				);
			}
		});

		req.on("error", (error) => {
			reject(error);
		});

		req.on("drain", () => {
			onProgress?.({
				total: data.size,
				loaded: uploadedBytes,
			});
		});

		Readable.fromWeb(data.stream() as NodeReadableStream)
			.on("data", (chunk) => {
				uploadedBytes += chunk.length;
				onProgress?.({
					total: data.size,
					loaded: uploadedBytes,
				});
			})
			.pipe(req);

		onProgress?.({ total: data.size, loaded: 0 });
	});
}
