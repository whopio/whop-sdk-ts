import type { proto } from ".";

export type ReceivableWebsocketMessage =
	proto.common.WebsocketMessageServerToClient;
export type SendableWebsocketMessage =
	proto.common.WebsocketMessageClientToServer;

export function parseWebsocketMessage(
	data: unknown,
): ReceivableWebsocketMessage {
	if (typeof data === "object" && data !== null) {
		return data as ReceivableWebsocketMessage;
	}

	if (typeof data !== "string") {
		throw new Error("Websocket message must be a string");
	}

	return JSON.parse(data);
}
