import type {
	MultipartUploadTask,
	UploadPartFunction,
} from "@/attachments/common";

import { retry } from "@/utils/retry";

/**
 * A global queue of tasks to upload a single or multiple files in parts.
 */
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
async function uploadWorker(uploadPart: UploadPartFunction) {
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
 * @param tasks The tasks to upload.
 * @param priority Whether to upload the tasks in priority.
 * @returns The etags of the uploaded parts.
 */
export function uploadParts(
	tasks: MultipartUploadTask[],
	uploadPart: UploadPartFunction,
	priority = false,
) {
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
		void uploadWorker(uploadPart);
	}

	return Promise.all(promises);
}
