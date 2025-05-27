import type { WhopServerSdkOptions } from "@/sdk/server-sdk-shared";
import { WhopWebsocketClientBase } from "./client.common";
import { DEFAULT_WEBSOCKET_ORIGIN } from "./server";

export class WhopWebsocketClientServer extends WhopWebsocketClientBase {
	private keys: WhopServerSdkOptions;

	constructor(keys: WhopServerSdkOptions) {
		super();
		this.keys = keys;
	}

	protected makeWebsocket(): WebSocket {
		const path = "/v1/websockets/connect";
		const origin = this.keys.websocketOrigin ?? DEFAULT_WEBSOCKET_ORIGIN;
		const url = new URL(path, origin);
		url.protocol = url.protocol.replace("http", "ws");

		const headers = {
			Authorization: `Bearer ${this.keys.appApiKey}`,
			"x-on-behalf-of": this.keys.onBehalfOfUserId,
		};

		// NodeJS 22 has a built in websocket client,
		// instead of passing protocols as a string, the second parameter accepts an object with headers.
		// However the types don't know about this yet, hence the weird casting...
		return new WebSocket(url, { headers } as unknown as string[]);
	}
}

export function makeConnectToWebsocketFunction(options: WhopServerSdkOptions) {
	return function connectToWebsocket() {
		return new WhopWebsocketClientServer(options);
	};
}
