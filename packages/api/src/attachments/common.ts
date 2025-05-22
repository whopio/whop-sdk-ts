export const MULTIPART_UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * A task to upload a part of a file.
 */
export interface MultipartUploadTask {
	url: string;
	fullData: File | Blob;
	partNumber: number;
	headers?: Record<string, string>;
	onProgress?: (progress: Pick<ProgressEvent, "loaded" | "total">) => void;
	signal?: AbortSignal;
}
