"use client";

import {
	type WebsocketStatus,
	WhopClientSdk,
	type WhopWebsocketClientBrowser,
	type proto,
} from "@whop/api";
import {
	type PropsWithChildren,
	createContext,
	use,
	useEffect,
	useState,
} from "react";

const whopApi = WhopClientSdk();
const WebsocketContext = createContext<WhopWebsocketClientBrowser>(
	whopApi.websocketClient({}),
);
const WebsocketStatusContext = createContext<WebsocketStatus>("disconnected");

export function useWebsocket() {
	return use(WebsocketContext);
}

export function useWebsocketStatus() {
	const status = use(WebsocketStatusContext);
	return status;
}

export function WhopWebsocketProvider({
	children,
	joinCustom,
	joinExperience,
	onAppMessage,
}: PropsWithChildren<{
	joinCustom?: string;
	joinExperience?: string;
	onAppMessage: (message: proto.common.AppMessage) => void;
}>) {
	const [websocket, setWebsocket] = useState<WhopWebsocketClientBrowser>(() =>
		whopApi.websocketClient({}),
	);

	const [connectionStatus, setConnectionStatus] =
		useState<WebsocketStatus>("disconnected");

	useEffect(() => {
		const websocket = whopApi.websocketClient({
			joinCustom,
			joinExperience,
		});
		setWebsocket(websocket);
		websocket.on("connectionStatus", setConnectionStatus);
		return websocket.connect();
	}, [joinExperience, joinCustom]);

	useEffect(() => {
		if (websocket) {
			websocket.on("appMessage", onAppMessage);
			return () => {
				websocket.off("appMessage", onAppMessage);
			};
		}
	}, [onAppMessage, websocket]);

	return (
		<WebsocketContext.Provider value={websocket}>
			<WebsocketStatusContext.Provider value={connectionStatus}>
				{children}
			</WebsocketStatusContext.Provider>
		</WebsocketContext.Provider>
	);
}
