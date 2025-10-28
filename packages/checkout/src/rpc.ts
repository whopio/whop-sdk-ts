import {
	WhopCheckoutRpcAbortedError,
	WhopCheckoutRpcTimeoutError,
} from "./errors";
import {
	type WhopCheckoutMessage,
	type WhopCheckoutRpcResponseMessage,
	isWhopCheckoutResponseMessageMessage,
} from "./messages";
import { uuidv4Safe } from "./uuid-v4";

export function rpc<E extends WhopCheckoutRpcResponseMessage["event"], T>(
	frame: HTMLIFrameElement,
	data: { event: string } & Record<string, unknown>,
	responseEvent: E,
	select: (message: Extract<WhopCheckoutRpcResponseMessage, { event: E }>) => T,
	timeout: number | null = 2000,
	abortSignal?: AbortSignal,
) {
	const origin = new URL(frame.src).origin;
	const eventId = uuidv4Safe();
	frame.contentWindow?.postMessage(
		{
			...data,
			__scope: "whop-embedded-checkout",
			event_id: eventId,
		},
		origin,
	);

	return new Promise<T>((resolve, reject) => {
		if (abortSignal?.aborted) {
			reject(new Error("Aborted"));
			return;
		}

		const cleanup = () => {
			if (timeoutId) clearTimeout(timeoutId);
			window.removeEventListener("message", handleMessage);
			abortSignal?.removeEventListener("abort", onAbort);
		};

		const timeoutId =
			timeout !== null
				? setTimeout(() => {
						reject(new WhopCheckoutRpcTimeoutError());
						cleanup();
					}, timeout)
				: null;

		const onAbort = () => {
			reject(new WhopCheckoutRpcAbortedError());
			cleanup();
		};

		abortSignal?.addEventListener("abort", onAbort, { once: true });

		const handleMessage = (
			event: MessageEvent<WhopCheckoutMessage | unknown>,
		) => {
			if (event.source !== frame.contentWindow) return;
			if (!isWhopCheckoutResponseMessageMessage(event, responseEvent)) return;
			if (event.data.event !== responseEvent) return;
			if (event.data.event_id !== eventId) return;
			cleanup();
			try {
				resolve(select(event.data));
			} catch (error) {
				reject(error);
			}
		};

		window.addEventListener("message", handleMessage);
	});
}
