"use client";

import {
	type WebsocketStatus,
	WhopClientSdk,
	type WhopWebsocketClientBase,
} from "@whop/api";
import { useCallback, useEffect, useRef, useState } from "react";

export function SectionConnectToTheWebsocketClient({
	experienceId,
}: {
	experienceId: string;
}) {
	const [message, setMessage] = useState("");
	const [isTrusted, setIsTrusted] = useState(false);
	const [senderUserId, setSenderUserId] = useState<string | undefined>(
		undefined,
	);
	const [status, setStatus] = useState<WebsocketStatus>("disconnected");
	const websocket = useRef<WhopWebsocketClientBase | null>(null);

	useEffect(() => {
		const ws = WhopClientSdk().websocketClient({
			joinExperience: experienceId,
		});

		ws.on("appMessage", (message) => {
			setMessage(message.json);
			setIsTrusted(message.isTrusted);
			setSenderUserId(message.fromUserId);
		});

		ws.on("connectionStatus", (status) => {
			setStatus(status);
		});

		websocket.current = ws;

		return ws.connect();
	}, [experienceId]);

	return (
		<>
			<ClientSendMessage
				experienceId={experienceId}
				websocket={websocket.current}
			/>
			<div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
				<WebsocketStatusDisplay status={status} />
				<WebsocketMessageDisplay
					message={message}
					isTrusted={isTrusted}
					senderUserId={senderUserId}
				/>
			</div>
		</>
	);
}

// This component shows the latest message that was received from the websocket.
function WebsocketMessageDisplay({
	message,
	isTrusted,
	senderUserId,
}: {
	message: string;
	isTrusted: boolean;
	senderUserId: string | undefined;
}) {
	return (
		<div className="flex flex-col gap-2">
			<span className="font-semibold dark:text-gray-200">Message: </span>
			<pre className="mt-1 p-2 bg-white border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200">
				{message}
			</pre>
			<div className="flex gap-2">
				<span className="font-semibold dark:text-gray-200">Is Trusted: </span>
				<span
					className={
						isTrusted
							? "text-green-600 dark:text-green-400"
							: "text-red-600 dark:text-red-400"
					}
				>
					{isTrusted ? "Yes" : "No"}
				</span>
				<span className="font-semibold dark:text-gray-200">
					Sender User ID:{" "}
				</span>
				<span className="text-gray-600 dark:text-gray-400">
					{senderUserId || "None"}
				</span>
			</div>
		</div>
	);
}

// This component shows the status of the websocket connection. (Connected, Disconnected, Connecting)
function WebsocketStatusDisplay({ status }: { status: WebsocketStatus }) {
	return (
		<div className="mb-4">
			<span className="font-semibold dark:text-gray-200">Status: </span>
			<span
				className={`px-2 py-1 rounded text-sm ${
					status === "connected"
						? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
						: status === "connecting"
							? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
							: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
				}`}
			>
				{status}
			</span>
		</div>
	);
}

// This component allows the client to send a message to the websocket.
// This means that the "sender id" will be included on the receiving side, and the message will not be trusted.
// To send a trusted message, you can use the server-side send message function.
function ClientSendMessage({
	experienceId,
	websocket,
}: {
	experienceId: string;
	websocket: WhopWebsocketClientBase | null;
}) {
	const [message, setMessage] = useState("");

	const onSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (!websocket) {
				alert("Websocket not connected");
				return;
			}
			websocket.broadcast({
				message,
				target: {
					experienceId,
				},
			});
		},
		[experienceId, websocket, message],
	);

	return (
		<div className="p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
			<h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
				Send a Message from the Client
			</h3>
			<form onSubmit={onSubmit} className="flex gap-2">
				<input
					type="text"
					name="message"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder="Type your message here..."
					className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
				/>
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
				>
					Send Message
				</button>
			</form>
		</div>
	);
}
