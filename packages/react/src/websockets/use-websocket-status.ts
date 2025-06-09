import { use } from "react";
import { WhopWebsocketContext } from "./context";

/**
 * A hook that allows you to get the status of the websocket.
 * @returns The status of the websocket.
 */
export function useWebsocketStatus() {
	const context = use(WhopWebsocketContext);
	return context.status;
}
