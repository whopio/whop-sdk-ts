import type { SendableWebsocketMessage } from "@whop/api";
import { useEffect, useRef } from "react";
import { useWebsocket } from "./use-websocket";

/**
 * A hook that allows you to send a message to the websocket.
 *
 * When a message is sent before the websocket is connected it is added to a queue and sent once
 * the connection is established
 * @returns A function that allows you to send a message to the websocket.
 */
export function useSendWebsocketMessage() {
	const websocket = useWebsocket();
	const queue = useRef<SendableWebsocketMessage[]>([]);

	useEffect(() => {
		if (websocket.status === "connected") {
			for (const message of queue.current) {
				websocket.websocket.send(message);
			}
			queue.current = [];
		}
	}, [websocket]);

	return (message: SendableWebsocketMessage) => {
		if (websocket.status !== "connected") {
			queue.current.push(message);
		} else {
			websocket.websocket.send(message);
		}
	};
}
