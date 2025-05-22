import type { WhopSdk } from "@/api";

/**
 * Analyzes an attachment.
 * @param this The SDK instance.
 * @param signedId The signed ID of the attachment.
 * @param opts The options for the attachment.
 * @returns The attachment.
 */
export async function analyzeAttachment(
	this: Pick<WhopSdk, "fetchAttachment">,
	signedId: string,
	opts?: {
		signal?: AbortSignal;
	},
) {
	while (!opts?.signal?.aborted) {
		const attachment = await this.fetchAttachment(
			{ id: signedId },
			{ signal: opts?.signal },
		)
			.then((a) => a.attachment)
			.catch(() => null);

		if (attachment?.analyzed) {
			return attachment;
		}
	}
}
