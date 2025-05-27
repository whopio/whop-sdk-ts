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
			<div className="p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
				<h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
					Send a Message from the Server
				</h3>
				<form action={sendMessage} className="flex gap-2">
					<input
						type="text"
						name="message"
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
			<SectionConnectToTheWebsocketClient experienceId={experienceId} />
		</div>
	);
}
