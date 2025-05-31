"use server";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { listingsTable } from "../db/schema";
import { verifyUser } from "../verify-user";
import { createListingWithData } from "./create-listing";

export async function relistListing(listingId: string) {
	const listing = await db.query.listingsTable.findFirst({
		where: eq(listingsTable.id, listingId),
	});

	if (!listing) {
		throw new Error("Listing not found");
	}

	await verifyUser("admin", {
		experienceId: listing.experienceId,
	});

	await createListingWithData({
		experienceId: listing.experienceId,
		userId: listing.createdByUserId,
		title: listing.title,
		description: listing.description,
		durationAsMilliseconds:
			new Date(listing.biddingEndsAt).getTime() -
			new Date(listing.createdAt).getTime(),
		initialPriceAsNumber: Number.parseFloat(listing.initialPrice),
		fulfillmentQuestion: listing.fulfillmentQuestion,
	});
}
