"use server";

import { db } from "@/lib/db";
import { listingsTable } from "@/lib/db/schema";
import { verifyUser } from "@/lib/verify-user";
import { redirect } from "next/navigation";
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
	const initialPrice = formData.get("initialPrice")?.toString() ?? "1.00";
	const initialPriceAsNumber = Number.parseFloat(initialPrice);
	if (Number.isNaN(initialPriceAsNumber) || initialPriceAsNumber < 1)
		throw new Error("Invalid initial price. Must be at least $1");

	const fulfillmentQuestion = formData.get("fulfillmentQuestion")?.toString();
	if (fulfillmentQuestion && typeof fulfillmentQuestion !== "string")
		throw new Error("Fulfillment question must be a string");

	const [listing] = await db
		.insert(listingsTable)
		.values({
			experienceId,
			createdByUserId: userId,
			title,
			description,
			biddingEndsAt: new Date(
				Date.now() + durationAsMilliseconds,
			).toISOString(),
			initialPrice: initialPriceAsNumber.toFixed(2),
			currentPrice: initialPriceAsNumber.toFixed(2),
			increment: INCREMENT,
			fulfillmentQuestion,
		})
		.returning();

	await sendListing(listing);

	redirect(`/experiences/${experienceId}`);
}
