"use client";

import type { proto } from "@whop/api";
import {
	WhopWebsocketProvider,
	useBroadcastWebsocketMessage,
	useOnWebsocketMessage,
	useWebsocketStatus,
} from "@whop/react";
import { Button, TextField } from "@whop/react/components";
import { useCallback, useState } from "react";

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

	const onAppMessage = useCallback((message: proto.common.AppMessage) => {
		setMessage(message.json);
		setIsTrusted(message.isTrusted);
		setSenderUserId(message.fromUserId);
	}, []);

	return (
		<WhopWebsocketProvider
			joinExperience={experienceId}
			onAppMessage={onAppMessage}
		>
			<ClientSendMessage experienceId={experienceId} />
			<div className="p-4 border rounded-lg bg-panel-elevation-a2 border-gray-a6">
				<WebsocketStatusDisplay />
				<WebsocketMessageDisplay
					message={message}
					isTrusted={isTrusted}
					senderUserId={senderUserId}
				/>
				<InnerNestedMessageHandlerExample />
			</div>
		</WhopWebsocketProvider>
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
			<span className="font-semibold">Message: </span>
			<pre className="mt-1 p-2 bg-background border border-gray-a6 rounded">
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
function WebsocketStatusDisplay() {
	const status = useWebsocketStatus();
	return (
		<div className="mb-4">
			<span className="font-semibold">Status: </span>
			<span
				className={`px-2 py-1 rounded text-sm ${
					status === "connected"
						? "bg-success-1 text-success-12"
						: status === "connecting"
							? "bg-warning-1 text-warning-12"
							: "bg-danger-1 text-danger-12"
				}`}
			>
				{status}
			</span>
		</div>
	);
}

function InnerNestedMessageHandlerExample() {
	const [state, setState] = useState<string>("");
	useOnWebsocketMessage((message) => {
		setState(message.json);
	});
	return (
		<div className="p-4 border rounded-lg bg-panel-elevation-a2 border-gray-a6">
			<h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
				Inner Nested Message Handler Example
			</h3>
			<pre>
				<code>{state}</code>
			</pre>
		</div>
	);
}

// This component allows the client to send a message to the websocket.
// This means that the "sender id" will be included on the receiving side, and the message will not be trusted.
// To send a trusted message, you can use the server-side send message function.
function ClientSendMessage({
	experienceId,
}: {
	experienceId: string;
}) {
	const [message, setMessage] = useState("");
	const broadcastMessage = useBroadcastWebsocketMessage();

	const onSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			broadcastMessage({
				message,
				target: {
					experienceId,
				},
			});
		},
		[experienceId, broadcastMessage, message],
	);

	return (
		<div className="p-4 border rounded-lg bg-panel-elevation-a2 border-gray-a6">
			<h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
				Send a Message from the Client
			</h3>
			<form onSubmit={onSubmit} className="flex gap-2">
				<TextField.Root>
					<TextField.Input
						type="text"
						name="message"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Type your message here..."
					/>
				</TextField.Root>
				<Button type="submit" color="blue" variant="solid">
					Send Message
				</Button>
			</form>
		</div>
	);
}
