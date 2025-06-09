import { use } from "react";
import { WhopWebsocketContext } from "./context";

/**
 * A hook that allows you to get the websocket context state.
 * @returns The websocket context state.
 */
export function useWebsocket() {
	const context = use(WhopWebsocketContext);
	return context;
}
