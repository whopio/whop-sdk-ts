import type { proto } from "..";

export type ReceivableWebsocketMessage =
	proto.common.WebsocketMessageServerToClient;
export type SendableWebsocketMessage =
	proto.common.WebsocketMessageClientToServer;

export type WebsocketStatus = "connected" | "disconnected" | "connecting";
export type WebsocketMessageHandler = (
	message: ReceivableWebsocketMessage,
) => unknown;
export type WebsocketStatusHandler = (status: WebsocketStatus) => unknown;

export type WebsocketClientOptionsBase = {
	/// The origin of the API
	apiOrigin?: string | null;

	/// The path used to connect to the websocket
	websocketPath?:
		| "/v1/websockets/connect"
		| "/_whop/ws/v1/websockets/connect"
		| null;

	/// Called when the connection state of the websocket changes
	onStatusChange?: WebsocketStatusHandler;

	/// Called when a message is received from the websocket
	onMessage?: WebsocketMessageHandler;
};

export type WebsocketClientOptionsClient = {
	/// The mode of the websocket client. This will set the origin and path correctly.
	mode?: "client";
};

export type WebsocketClientOptionsServer = {
	/// The mode of the websocket client. This will set the origin and path correctly.
	mode: "server";

	/// Your app API key.
	apiKey: string;

	/// The user ID to connect to the websocket as
	userId: string;
};

export type WebsocketClientOptions =
	| (WebsocketClientOptionsBase & WebsocketClientOptionsClient)
	| (WebsocketClientOptionsBase & WebsocketClientOptionsServer);

export class WhopWebsocketClient {
	private websocket: WebSocket | null = null;
	private failedConnectionAttempts = 0;
	private status: WebsocketStatus = "disconnected";
	private onMessage: WebsocketMessageHandler;
	private onStatusChange: WebsocketStatusHandler;

	private apiOrigin: string | null;
	private websocketPath: string;
	private headers?: Record<string, string>;

	private wantsToBeConnected = false;

	constructor(options: WebsocketClientOptions) {
		this.onMessage = options.onMessage ?? (() => {});
		this.onStatusChange = options.onStatusChange ?? (() => {});

		this.apiOrigin = options.apiOrigin ?? defaultWebsocketOrigin(options.mode);
		this.websocketPath =
			options.websocketPath ?? defaultWebsocketPath(options.mode);

		if (options.mode === "server") {
			this.headers = {
				Authorization: `Bearer ${options.apiKey}`,
				"x-on-behalf-of": options.userId,
			};
		}
	}

	connect() {
		if (this.websocket) {
			this.disconnect();
		}

		this.wantsToBeConnected = true;

		this.setStatus("connecting");
		const url = `${this.apiOrigin ?? ""}${this.websocketPath}`;
		console.log("[WhopWebsocketClient] Connecting to", url);
		const options = this.headers ? { headers: this.headers } : undefined;
		const websocket = new WebSocket(url, options);
		this.websocket = websocket;

		websocket.onopen = () => {
			console.log("[WhopWebsocketClient] Websocket connected");
			this.setStatus("connected");
		};

		websocket.onmessage = (event: MessageEvent) => {
			try {
				this.onMessage(JSON.parse(event.data) as ReceivableWebsocketMessage);
			} catch (error) {
				console.error(
					"[WhopWebsocketClient] Error parsing message",
					event.data,
				);
			}
		};

		websocket.onerror = (event: Event) => {
			console.error("[WhopWebsocketClient] Websocket error", event);
			this.setStatus("disconnected");
		};

		websocket.onclose = (event: Event) => {
			console.log("[WhopWebsocketClient] Websocket closed", event);
			this.setStatus("disconnected");
		};

		return () => {
			this.disconnect();
		};
	}

	disconnect() {
		if (this.websocket) {
			this.websocket.onopen = null;
			this.websocket.onmessage = null;
			this.websocket.onerror = null;
			this.websocket.onclose = null;
			this.websocket.close();
			this.websocket = null;
		}

		this.wantsToBeConnected = false;
	}

	private setStatus(status: WebsocketStatus) {
		if (status === this.status) return;

		this.status = status;

		if (status === "disconnected") {
			const backoff = this.calculateBackoff(this.failedConnectionAttempts);
			this.failedConnectionAttempts++;
			setTimeout(() => {
				if (this.wantsToBeConnected) {
					this.connect();
				}
			}, backoff);
		}

		if (status === "connected") {
			this.failedConnectionAttempts = 0;
		}

		this.onStatusChange(status);
	}

	private calculateBackoff(failedConnectionAttempts: number) {
		return Math.min(50 * 2 ** failedConnectionAttempts, 1000 * 60);
	}
}

function defaultWebsocketOrigin(mode: WebsocketClientOptions["mode"]) {
	if (mode === "server") {
		return "wss://ws-prod.whop.com";
	}

	return null;
}

function defaultWebsocketPath(
	mode: WebsocketClientOptions["mode"],
): NonNullable<WebsocketClientOptions["websocketPath"]> {
	if (mode === "server") {
		return "/v1/websockets/connect";
	}

	return "/_whop/ws/v1/websockets/connect";
}
