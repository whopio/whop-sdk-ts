import type { Transport, ValidZodEventSchema } from "./sdk";

export const MESSAGE_TAG = "typed-transport";

export function postmessageTransport<
	ServerSchema extends ValidZodEventSchema | undefined = undefined,
>({
	remoteWindow,
	targetOrigins,
}: {
	remoteWindow: Window | undefined;
	targetOrigins: string[];
}): Transport<ServerSchema> {
	return {
		send(event, data, { remoteAppId, localAppId }) {
			if (!remoteWindow) {
				throw new Error(
					"No remote window. Is the SDK running on a server without a global window object?",
				);
			}
			console.debug(
				"[typed-transport] postmessagetransport. Sending event",
				event,
				data,
			);
			console.debug(
				"[typed-transport] postmessagetransport. target origins =",
				targetOrigins,
			);

			for (const targetOrigin of targetOrigins) {
				console.debug("[typed-transport] remoteWindow.postMessage", {
					event,
					libId: MESSAGE_TAG,
					receiverAppId: remoteAppId,
					senderAppId: localAppId,
				});
				console.debug(
					"[typed-transport] remoteWindow.postMessage.data",
					data,
					JSON.stringify(data),
				);

				remoteWindow.postMessage(
					{
						event,
						data,
						libId: MESSAGE_TAG,
						receiverAppId: remoteAppId,
						senderAppId: localAppId,
					},
					{
						targetOrigin,
					},
				);
			}
			if (targetOrigins.length === 0) {
				remoteWindow.postMessage({
					event,
					data,
					libId: MESSAGE_TAG,
					receiverAppId: remoteAppId,
					senderAppId: localAppId,
				});
			}
		},
		recv(handler, { localAppId, remoteAppId }) {
			const listener = (event: MessageEvent) => {
				console.debug(
					"[typed-transport] postmessagetransport. Receiving event",
					event,
				);

				if (
					event.source !== remoteWindow ||
					(!targetOrigins.includes(event.origin) && targetOrigins.length > 0) ||
					!event.data ||
					!event.data.event ||
					event.data.libId !== MESSAGE_TAG ||
					event.data.receiverAppId !== localAppId ||
					event.data.senderAppId !== remoteAppId
				) {
					return;
				}

				handler(event.data.event, event.data.data);
			};

			if (typeof window === "undefined") {
				// Stop logging this as it's causing more confusion than it's worth.
				// console.warn(
				//   'No window. Is the SDK running on a server without a global window object?',
				// );
				return;
			}

			window.addEventListener("message", listener);

			return () => {
				window.removeEventListener("message", listener);
			};
		},
	};
}

export function reactNativeClientTransport<
	ServerSchema extends ValidZodEventSchema | undefined = undefined,
>({
	postMessage,
	targetOrigin,
}: {
	postMessage: (data: string) => void;
	targetOrigin: string;
}): Transport<ServerSchema> {
	return {
		send(event, data, { remoteAppId, localAppId }) {
			postMessage(
				JSON.stringify({
					event,
					data,
					libId: MESSAGE_TAG,
					receiverAppId: remoteAppId,
					senderAppId: localAppId,
				}),
			);
		},
		recv(handler, { localAppId, remoteAppId }) {
			const listener = (event: MessageEvent) => {
				const dataString = typeof event.data === "string" ? event.data : null;
				if (!dataString) return;

				const data = JSON.parse(dataString);

				if (
					event.origin !== targetOrigin ||
					!data ||
					!data.event ||
					!data.data ||
					data.libId !== MESSAGE_TAG ||
					data.receiverAppId !== localAppId ||
					data.senderAppId !== remoteAppId
				) {
					return;
				}

				handler(data.event, data.data);
			};

			if (typeof window === "undefined") {
				console.warn(
					"No window. Is the SDK running on a server without a global window object?",
				);
				return;
			}

			window.addEventListener("message", listener);

			return () => {
				window.removeEventListener("message", listener);
			};
		},
	};
}
