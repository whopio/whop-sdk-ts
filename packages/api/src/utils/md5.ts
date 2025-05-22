import { md5 as jsMd5 } from "js-md5";

/**
 * Calculates the MD5 hash of a stream.
 * @param stream The stream to calculate the MD5 hash of.
 * @returns The MD5 hash of the stream.
 */
export async function md5(stream: ReadableStream<Uint8Array>) {
	const hasher = jsMd5.create();
	await stream.pipeTo(
		new WritableStream({
			write(chunk) {
				hasher.update(chunk);
			},
		}),
	);

	return hasher.arrayBuffer();
}
