import { verifyUserToken, whopApi } from "@/lib/whop-api";
import { Button, TextField } from "@whop/react/components";
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
		return (
			<div className="p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/50 dark:text-red-400">
				You do not have access to this experience
			</div>
		);
	}

	async function sendMessage(formData: FormData) {
		"use server";

		const message = formData.get("message");

		if (!message || typeof message !== "string") {
			throw new Error("Message is required");
		}

		await whopApi.sendWebsocketMessage({
			message: message,
			target: { experience: experienceId },
		});
	}

	return (
		<div className="space-y-6">
			<div className="p-4 border border-gray-a6 rounded-lg bg-panel-elevation-a2">
				<h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
					Send a Message from the Server
				</h3>
				<form action={sendMessage} className="flex gap-2">
					<TextField.Root>
						<TextField.Input
							type="text"
							name="message"
							placeholder="Type your message here..."
						/>
					</TextField.Root>
					<Button type="submit" color="blue" variant="solid">
						Send Message
					</Button>
				</form>
			</div>
			<SectionConnectToTheWebsocketClient experienceId={experienceId} />
		</div>
	);
}
