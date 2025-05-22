import type { WebsocketClientOptionsBase } from "./client.common";
import { WhopWebsocketClientBase } from "./client.common";

export interface WebsocketClientOptionsClient
	extends WebsocketClientOptionsBase {
	/// Pass an experience ID to join the channel for this experience(s). Access will be restricted to just users with access to the experience(s).
	joinExperience?: string | string[] | null;

	/// Pass a custom string ID to join a custom channel with events from your app.
	joinCustom?: string | string[] | null;

	/// Pass a any string to join a public channel with events from whop.
	joinPublic?: string | string[] | null;
}

export class WhopWebsocketClientBrowser extends WhopWebsocketClientBase {
	private options: WebsocketClientOptionsClient;

	constructor(options: WebsocketClientOptionsClient) {
		super(options);
		this.options = options;
	}

	protected makeWebsocket(): WebSocket {
		const path = "/_whop/ws/v1/websockets/connect";

		const searchParams = new URLSearchParams();
		addChannelIds(searchParams, "joinExperience", this.options.joinExperience);
		addChannelIds(searchParams, "joinCustom", this.options.joinCustom);
		addChannelIds(searchParams, "joinPublic", this.options.joinPublic);

		const url = new URL(path, window.location.origin);
		url.protocol = url.protocol.replace("http", "ws");
		url.search = searchParams.toString();

		return new WebSocket(url.toString());
	}
}

function addChannelIds(
	searchParams: URLSearchParams,
	key: string,
	channels: undefined | string | string[] | null,
) {
	if (!channels) {
		return;
	}

	if (typeof channels === "string" && channels.length > 0) {
		searchParams.set(key, channels);
	}

	for (const channel of channels) {
		searchParams.append(key, channel);
	}
}

export function connectToWebsocketFunction() {
	return function connectToWebsocket(options: WebsocketClientOptionsClient) {
		return new WhopWebsocketClientBrowser(options);
	};
}
