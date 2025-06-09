import type { WebsocketBroadcastTarget } from "@whop/api";
import { useEffect, useRef } from "react";
import { useWebsocket } from "./use-websocket";

type BroadcastMessage = {
	message: string;
	target: WebsocketBroadcastTarget;
};

/**
 * A hook that allows you to broadcast a message to the websocket.
 *
 * When a message is sent before the websocket is connected it is added to a queue and sent once
 * the connection is established
 * @returns A function that allows you to broadcast a message to the websocket.
 */
export function useBroadcastWebsocketMessage() {
	const websocket = useWebsocket();
	const queue = useRef<BroadcastMessage[]>([]);

	useEffect(() => {
		if (websocket.status === "connected") {
			for (const message of queue.current) {
				websocket.websocket.broadcast(message);
			}
			queue.current = [];
		}
	}, [websocket]);

	return (message: BroadcastMessage) => {
		if (websocket.status !== "connected") {
			queue.current.push(message);
		} else {
			websocket.websocket.broadcast(message);
		}
	};
}
