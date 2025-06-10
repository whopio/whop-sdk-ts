"use client";

import type { proto } from "@whop/api";
import { useEffect } from "react";
import { useWebsocket } from "./use-websocket";

/**
 * A hook that allows you to handle incoming websocket messages.
 *
 * Make sure to mount this hook in a component that is a child of the `WhopWebsocketProvider`
 */
export function useOnWebsocketMessage(
	callback: ((message: proto.common.AppMessage) => void) | undefined | null,
) {
	const websocket = useWebsocket();

	useEffect(() => {
		if (websocket.status !== "initializing" && callback) {
			websocket.websocket.on("appMessage", callback);
			return () => {
				websocket.websocket.off("appMessage", callback);
			};
		}
	}, [websocket, callback]);
}
