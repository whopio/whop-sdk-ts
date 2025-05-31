"use server";

import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { type Listing, listingsTable } from "../db/schema";
import { verifyUser } from "../verify-user";
import { whopApi } from "../whop-api";
import { sendListing } from "./send-websocket-message";

export async function markAsFulfilled(listingId: string) {
	const listing = await db.query.listingsTable.findFirst({
		where: eq(listingsTable.id, listingId),
	});

	if (!listing) {
		throw new Error("Listing not found");
	}

	await verifyUser("admin", {
		experienceId: listing.experienceId,
	});

	const [updatedListing] = await db
		.update(listingsTable)
		.set({
			fulfilledAt: new Date().toISOString(),
		})
		.where(eq(listingsTable.id, listingId))
		.returning();

	await sendListing(updatedListing);
	waitUntil(sendNotification(updatedListing));
}

async function sendNotification(updatedListing: Listing) {
	if (updatedListing.lastBidderUserId) {
		await whopApi.sendPushNotification({
			input: {
				title: "Listing fulfilled",
				content: `"${updatedListing.title} was fulfilled"`,
				experienceId: updatedListing.experienceId,
				isMention: true,
				userIds: [updatedListing.lastBidderUserId ?? ""],
			},
		});
	}
}
