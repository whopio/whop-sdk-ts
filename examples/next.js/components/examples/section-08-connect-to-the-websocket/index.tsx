import { verifyUserToken, whopApi } from "@/lib/whop-api";
import { headers } from "next/headers";
import { SectionConnectToTheWebsocketClient } from "./index.client";

export async function SectionConnectToTheWebsocket({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const { userId } = await verifyUserToken(await headers(), {
		dontThrow: false,
	});

	const hasAccess = await whopApi.checkIfUserHasAccessToExperience({
		experienceId,
		userId,
	});

	if (!hasAccess) {
		return <div>You do not have access to this experience</div>;
	}

	async function sendMessage(formData: FormData) {
		"use server";

		const message = formData.get("message");

		if (!message || typeof message !== "string") {
			throw new Error("Message is required");
		}

		await whopApi.SendWebsocketMessage({
			message: message,
			target: { experience: experienceId },
		});
	}

	return (
		<div>
			<form action={sendMessage}>
				<input type="text" name="message" />
				<button type="submit">Send Websocket Message From Server</button>
			</form>
			<SectionConnectToTheWebsocketClient experienceId={experienceId} />
		</div>
	);
}
