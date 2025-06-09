"use client";

import {
	type WebsocketStatus,
	WhopClientSdk,
	type WhopWebsocketClientBrowser,
	type proto,
} from "@whop/api";
import React, {
	type PropsWithChildren,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	WhopWebsocketContext,
	type WhopWebsocketContextState,
} from "./context";

/**
 * Props for the `WhopWebsocketProvider` component.
 */
export interface WhopWebsocketProviderProps {
	/**
	 * The custom channels to join when connecting to the websocket.
	 */
	joinCustom?: string | string[];
	/**
	 * The experience channels to join when connecting to the websocket.
	 */
	joinExperience?: string | string[];
	/**
	 * A callback that is called when an app message is received.
	 */
	onAppMessage: (message: proto.common.AppMessage) => void;
}

/**
 * A provider that allows you to connect to the websocket and receive app messages.
 */
export function WhopWebsocketProvider({
	children,
	joinCustom,
	joinExperience,
	onAppMessage,
}: PropsWithChildren<WhopWebsocketProviderProps>) {
	const [websocket, setWebsocket] = useState<WhopWebsocketClientBrowser>();
	const [connectionStatus, setConnectionStatus] =
		useState<WebsocketStatus>("disconnected");

	const apiRef = useRef<WhopClientSdk>(null);

	useEffect(() => {
		if (!apiRef.current) {
			apiRef.current = WhopClientSdk();
		}

		const whopApi = apiRef.current;

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

	const value: WhopWebsocketContextState = useMemo(() => {
		if (websocket) {
			return {
				status: connectionStatus,
				websocket,
			};
		}
		return {
			status: "initializing",
		};
	}, [websocket, connectionStatus]);

	return <WhopWebsocketContext value={value}>{children}</WhopWebsocketContext>;
}
