import { WhopCheckoutRpcTimeoutError } from "./errors";
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
	timeout = 2000,
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
		const timeoutId = setTimeout(() => {
			reject(new WhopCheckoutRpcTimeoutError());
			window.removeEventListener("message", handleMessage);
		}, timeout);

		const handleMessage = (
			event: MessageEvent<WhopCheckoutMessage | unknown>,
		) => {
			if (event.source !== frame.contentWindow) return;
			if (!isWhopCheckoutResponseMessageMessage(event, responseEvent)) return;
			if (event.data.event !== responseEvent) return;
			if (event.data.event_id !== eventId) return;
			clearTimeout(timeoutId);
			window.removeEventListener("message", handleMessage);
			try {
				resolve(select(event.data));
			} catch (error) {
				reject(error);
			}
		};

		window.addEventListener("message", handleMessage);
	});
}
