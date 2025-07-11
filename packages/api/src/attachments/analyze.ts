import type { BaseSdk } from "./partial-file-sdk-extensions";

/**
 * Analyzes an attachment.
 * @param this The SDK instance.
 * @param signedId The signed ID of the attachment.
 * @param opts The options for the attachment.
 * @returns The attachment.
 */
export async function analyzeAttachment(
	this: Pick<BaseSdk, "attachments">,
	signedId: string,
	opts?: {
		signal?: AbortSignal;
	},
) {
	while (!opts?.signal?.aborted) {
		const attachment = await this.attachments
			.getAttachment({ id: signedId }, { signal: opts?.signal })
			.catch(() => null);

		if (attachment) {
			return attachment;
		}
	}
}
