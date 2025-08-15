const HEX_CACHE: string[] = [];

function byteToHex(b: number): string {
	// biome-ignore lint/suspicious/noAssignInExpressions: not sus, if you cant read this stop using javascript <3
	return HEX_CACHE[b] || (HEX_CACHE[b] = (b + 256).toString(16).slice(1));
}

export function uuidv4Safe(): string {
	const bytes = new Uint8Array(16);

	if (
		typeof crypto !== "undefined" &&
		typeof crypto.getRandomValues === "function"
	) {
		crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < 16; i++) {
			bytes[i] = (Math.random() * 256) | 0;
		}
	}

	// Per RFC 4122 §4.4 — set version & variant bits
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	return (
		// biome-ignore lint/style/useTemplate: do disagree
		byteToHex(bytes[0]) +
		byteToHex(bytes[1]) +
		byteToHex(bytes[2]) +
		byteToHex(bytes[3]) +
		"-" +
		byteToHex(bytes[4]) +
		byteToHex(bytes[5]) +
		"-" +
		byteToHex(bytes[6]) +
		byteToHex(bytes[7]) +
		"-" +
		byteToHex(bytes[8]) +
		byteToHex(bytes[9]) +
		"-" +
		byteToHex(bytes[10]) +
		byteToHex(bytes[11]) +
		byteToHex(bytes[12]) +
		byteToHex(bytes[13]) +
		byteToHex(bytes[14]) +
		byteToHex(bytes[15])
	);
}
