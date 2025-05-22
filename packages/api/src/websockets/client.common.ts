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

export interface WebsocketClientOptionsBase {
	/// Called when the connection state of the websocket changes
	onStatusChange?: WebsocketStatusHandler;

	/// Called when a message is received from the websocket
	onMessage?: WebsocketMessageHandler;
}

export class WhopWebsocketClientBase {
	private websocket: WebSocket | null = null;
	private failedConnectionAttempts = 0;
	private status: WebsocketStatus = "disconnected";
	private onMessage: WebsocketMessageHandler;
	private onStatusChange: WebsocketStatusHandler;
	private wantsToBeConnected = false;

	constructor(options: WebsocketClientOptionsBase) {
		this.onMessage = options.onMessage ?? (() => {});
		this.onStatusChange = options.onStatusChange ?? (() => {});
	}

	protected makeWebsocket(): WebSocket {
		throw new Error("Not implemented in base class");
	}

	public connect() {
		if (this.websocket) {
			this.disconnect();
		}

		this.wantsToBeConnected = true;

		this.setStatus("connecting");
		console.log("[WhopWebsocketClient] Connecting to websocket");
		const websocket = this.makeWebsocket();
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

	public disconnect() {
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

	public send(message: SendableWebsocketMessage) {
		if (!this.websocket) {
			throw new Error("Websocket not connected");
		}

		this.websocket.send(JSON.stringify(message));
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
