import { md5 as jsMd5 } from "js-md5";

export async function md5(stream: ReadableStream<Uint8Array>) {
  const hasher = jsMd5.create();
  await stream.pipeTo(
    new WritableStream({
      write(chunk) {
        hasher.update(chunk);
      },
    })
  );

  return hasher.arrayBuffer();
}
