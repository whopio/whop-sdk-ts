import type { WhopWebhookRequestBody } from "./webhook-types";

const DEFAULT_SIGNATURE_HEADER_NAME = "x-whop-signature";

export type { WhopWebhookRequestBody } from "./webhook-types";

export function makeWebhookValidator({
	webhookSecret,
	signatureHeaderName,
}: {
	webhookSecret: string;
	signatureHeaderName?: string | null;
}) {
	const textEncoder = new TextEncoder();
	const encodedKey = textEncoder.encode(webhookSecret);
	const cryptoKeyPromise = crypto.subtle.importKey(
		"raw",
		encodedKey,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	return async function validateWebhookBody<Data = WhopWebhookRequestBody>(
		req: Request,
	): Promise<Data> {
		const body = await req.text();
		const header = req.headers.get(
			signatureHeaderName ?? DEFAULT_SIGNATURE_HEADER_NAME,
		);
		if (!header) throw Error("Missing header containing signature.");
		const [timestampStr, signatureStr] = header.split(",");
		const [, timestamp] = timestampStr.split("=");
		const [version, sentSignature] = signatureStr.split("=");

		const now = Math.round(Date.now() / 1000);

		if (
			Number.isNaN(Number.parseInt(timestamp)) ||
			Math.abs(now - Number.parseInt(timestamp)) > 300
		)
			throw Error("Invalid timestamp");

		const stringToHash = `${timestamp}.${body}`;

		const cryptoKey = await cryptoKeyPromise;

		const signatureBuffer = await crypto.subtle.sign(
			{ name: "HMAC", hash: "SHA-256" },
			cryptoKey,
			textEncoder.encode(stringToHash),
		);
		const signature = buf2hex(signatureBuffer);

		if (version !== "v1") throw Error("Unsupported version");
		if (signature !== sentSignature) throw Error("Signature mismatch");

		const parsedBody = JSON.parse(body) as unknown;
		if (!isValidWebhook(parsedBody)) throw Error("Invalid webhook payload");
		return parsedBody as Data;
	};
}

function buf2hex(buffer: ArrayBuffer) {
	return [...new Uint8Array(buffer)]
		.map((x) => x.toString(16).padStart(2, "0"))
		.join("");
}

// Type guard to check if a webhook is valid
export function isValidWebhook(
	webhook: unknown,
): webhook is WhopWebhookRequestBody {
	if (!webhook || typeof webhook !== "object") return false;
	if (!("api_version" in webhook) || webhook.api_version !== "v5") return false;
	if (!("action" in webhook) || typeof webhook.action !== "string")
		return false;
	if (
		!("data" in webhook) ||
		typeof webhook.data !== "object" ||
		webhook.data === null
	)
		return false;
	return true;
}
