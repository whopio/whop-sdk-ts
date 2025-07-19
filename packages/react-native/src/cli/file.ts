import { createHash } from "node:crypto";
import { AGENT_USER_ID, APP_ID, whopSdk } from "./sdk";

export async function uploadFile(
	data: Buffer<ArrayBufferLike>,
	name: string,
	contentType: string,
) {
	const file = new File([data], name, {
		type: contentType,
	});

	const uploadedFile = await whopSdk
		.withUser(AGENT_USER_ID)
		.attachments.uploadAttachment({
			file,
			record: "app",
			id: APP_ID,
		});

	return uploadedFile;
}

export async function getChecksum(data: Buffer<ArrayBufferLike>) {
	const hash = createHash("sha256");
	hash.update(data);
	return hash.digest("hex");
}
