"use server";

import { db } from "@/lib/db";
import { listingsTable } from "@/lib/db/schema";
import { verifyUser } from "@/lib/verify-user";
import { waitUntil } from "@vercel/functions";
import { redirect } from "next/navigation";
import { whopSdk } from "../whop-sdk";
import { sendListing } from "./send-websocket-message";

const INCREMENT = "0.01";

export async function createListing(formData: FormData) {
	const experienceId = formData.get("experienceId");
	if (typeof experienceId !== "string")
		throw new Error("Experience ID is required");

	const { userId } = await verifyUser("admin", { experienceId });

	const title = formData.get("title");
	if (typeof title !== "string") throw new Error("Title is required");

	const description = formData.get("description")?.toString();
	const durationMinutes = formData.get("durationMinutes")?.toString() ?? "60";
	const durationAsMilliseconds = Number.parseInt(durationMinutes) * 60 * 1000;

	const fulfillmentQuestion = formData.get("fulfillmentQuestion")?.toString();
	if (fulfillmentQuestion && typeof fulfillmentQuestion !== "string")
		throw new Error("Fulfillment question must be a string");

	await createListingWithData({
		experienceId,
		userId,
		title,
		description,
		durationAsMilliseconds,
		fulfillmentQuestion,
	});

	redirect(`/experiences/${experienceId}`);
}

export async function createListingWithData({
	experienceId,
	userId,
	title,
	description,
	durationAsMilliseconds,
	fulfillmentQuestion,
}: {
	experienceId: string;
	userId: string;
	title: string;
	description?: string | null;
	durationAsMilliseconds?: number;
	fulfillmentQuestion?: string | null;
}) {
	const [listing] = await db
		.insert(listingsTable)
		.values({
			experienceId,
			createdByUserId: userId,
			title,
			description,
			biddingEndsAt: new Date(
				Date.now() + (durationAsMilliseconds ?? 60 * 60 * 1000),
			).toISOString(),
			currentPrice: "0.00",
			increment: INCREMENT,
			fulfillmentQuestion,
		})
		.returning();

	await sendListing(listing);

	waitUntil(
		sendNotification({
			title,
			userId,
			experienceId,
		}),
	);
}

async function sendNotification({
	title,
	userId,
	experienceId,
}: { title: string; userId: string; experienceId: string }) {
	const user = await whopSdk.users.getUser({ userId });

	await whopSdk.notifications.sendPushNotification({
		title: "New penny bidding listing",
		content: `"${title}" was just listed by ${user.name ?? user.username}`,
		experienceId: experienceId,
		isMention: true,
	});
}
