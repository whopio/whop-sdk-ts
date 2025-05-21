import type { WhopSdk } from "@/api";
import type { PreparedAttachment } from "@/attachments/prepare";
import type {
  AttachableRecords,
  AttachmentFragment,
  Media,
} from "@/codegen/generated-api";

import { MULTIPART_UPLOAD_CHUNK_SIZE } from "@/attachments/constants";
import { retry } from "@/utils/retry";
import { sum } from "@/utils/sum";

interface MultipartUploadTask {
  url: string;
  fullData: File | Blob;
  partNumber: number;
  headers?: Record<string, string>;
  onProgress?: (progress: ProgressEvent) => void;
  signal?: AbortSignal;
}

/**
 * Uploads a part of a file.
 * @param task - The task to upload.
 * @returns The etag of the uploaded part.
 */
async function uploadPart({
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
    Math.min(offset + MULTIPART_UPLOAD_CHUNK_SIZE, fullData.size)
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
      }
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
  }: { onProgress?: (progress: number) => void; signal?: AbortSignal }
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
      }))
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
    true
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
  { onProgress, signal }: UploadFileOptions = {}
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
