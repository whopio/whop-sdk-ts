"use server";

import { db } from "@/lib/db";
import { listingsTable } from "@/lib/db/schema";
import { verifyUser } from "@/lib/verify-user";
import { waitUntil } from "@vercel/functions";
import { redirect } from "next/navigation";
import { whopApi } from "../whop-api";
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
	const initialPrice = formData.get("initialPrice")?.toString();
	const initialPriceAsNumber = initialPrice
		? Number.parseFloat(initialPrice)
		: undefined;
	if (
		Number.isNaN(initialPriceAsNumber) ||
		(initialPriceAsNumber && initialPriceAsNumber < 1)
	)
		throw new Error("Invalid initial price. Must be at least $1");

	const fulfillmentQuestion = formData.get("fulfillmentQuestion")?.toString();
	if (fulfillmentQuestion && typeof fulfillmentQuestion !== "string")
		throw new Error("Fulfillment question must be a string");

	await createListingWithData({
		experienceId,
		userId,
		title,
		description,
		durationAsMilliseconds,
		initialPriceAsNumber,
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
	initialPriceAsNumber,
	fulfillmentQuestion,
}: {
	experienceId: string;
	userId: string;
	title: string;
	description?: string | null;
	durationAsMilliseconds?: number;
	initialPriceAsNumber?: number;
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
			initialPrice: initialPriceAsNumber?.toFixed(2) ?? "1.00",
			currentPrice: initialPriceAsNumber?.toFixed(2) ?? "1.00",
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
	const { publicUser: user } = await whopApi.getUser({ userId });

	await whopApi.sendPushNotification({
		input: {
			title: "New penny bidding listing",
			content: `"${title}" was just listed by ${user.name ?? user.username}`,
			experienceId: experienceId,
			isMention: true,
		},
	});
}
