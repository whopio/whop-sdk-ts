"use client";

import { type WebsocketStatus, WhopClientSdk } from "@whop/api";
import { useEffect, useState } from "react";

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

	useEffect(() => {
		const ws = WhopClientSdk().ConnectToWebsocket({
			joinExperience: experienceId,
			onMessage: (message) => {
				const obj = message.appMessage;
				if (!obj) return;
				setMessage(obj.json);
				setIsTrusted(obj.isTrusted);
				setSenderUserId(obj.fromUserId);
			},
			onStatusChange: (status) => {
				setStatus(status);
			},
		});

		return ws.connect();
	}, [experienceId]);

	return (
		<div>
			<div>Status: {status}</div>
			<div>
				Latest Message: <pre>{message}</pre>
				<br />
				Is Trusted: {isTrusted ? "Yes" : "No"}
				<br />
				Sender User ID: {senderUserId}
			</div>
		</div>
	);
}
