"use client";

import type { WebsocketStatus, WhopWebsocketClientBrowser } from "@whop/api";
import { createContext } from "react";

export type WhopWebsocketContextState =
	| {
			status: WebsocketStatus;
			websocket: WhopWebsocketClientBrowser;
	  }
	| {
			status: "initializing";
	  };

export const WhopWebsocketContext = createContext<WhopWebsocketContextState>({
	status: "initializing",
});
