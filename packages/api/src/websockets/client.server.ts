import { DEFAULT_API_ORIGIN } from "@/sdk.common";
import type { WhopServerSdkOptions } from "@/sdk.server";
import type { WebsocketClientOptionsBase } from "./client.common";
import { WhopWebsocketClientBase } from "./client.common";

export interface WebsocketClientOptionsServer
	extends WebsocketClientOptionsBase {}

export class WhopWebsocketClientServer extends WhopWebsocketClientBase {
	private keys: WhopServerSdkOptions;

	constructor(
		baseOptions: WebsocketClientOptionsBase,
		keys: WhopServerSdkOptions,
	) {
		super(baseOptions);
		this.keys = keys;
	}

	protected makeWebsocket(): WebSocket {
		const path = "/v1/websockets/connect";
		const origin = this.keys.apiOrigin ?? DEFAULT_API_ORIGIN;
		const url = new URL(path, origin);

		const headers = {
			Authorization: `Bearer ${this.keys.appApiKey}`,
			"x-on-behalf-of": this.keys.onBehalfOfUserId,
		};

		console.log("Connecting to websocket", url.toString(), headers);

		throw new Error("Not implement yet on server");
	}
}

export function makeConnectToWebsocketFunction(options: WhopServerSdkOptions) {
	return function connectToWebsocket(baseOptions: WebsocketClientOptionsBase) {
		return new WhopWebsocketClientServer(baseOptions, options);
	};
}
