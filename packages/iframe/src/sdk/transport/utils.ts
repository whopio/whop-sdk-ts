export class TimeoutError extends Error {
	constructor() {
		super("Timeout");
	}
}

export function randomId(length: number) {
	const alphabet =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let str = "";
	for (let i = 0; i < length; i++) {
		str += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return str;
}
