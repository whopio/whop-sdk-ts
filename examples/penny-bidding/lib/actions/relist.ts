"use server";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { listingsTable } from "../db/schema";
import { SafeError, wrapServerAction } from "../server-action-errors";
import { verifyUser } from "../verify-user";
import { createListingWithData } from "./create-listing";

export const relistListing = wrapServerAction(async (listingId: string) => {
	const listing = await db.query.listingsTable.findFirst({
		where: eq(listingsTable.id, listingId),
	});

	if (!listing) {
		throw new SafeError("Listing not found");
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
		fulfillmentQuestion: listing.fulfillmentQuestion,
	});
});
