"use server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "../db";
import { listingsTable } from "../db/schema";
import type { PaymentMetadata } from "../types";
import { verifyUserToken, whopApi } from "../whop-api";
import { sendListing } from "./send-websocket-message";

export async function purchaseListing({
	listingId,
	listingAnswer,
}: {
	listingId: string;
	listingAnswer?: string | null;
}) {
	const { userId } = await verifyUserToken(await headers());

	const listing = await db.query.listingsTable.findFirst({
		where: eq(listingsTable.id, listingId),
	});
	if (!listing) throw new Error("Listing not found");

	if (new Date(listing.biddingEndsAt) > new Date())
		throw new Error("Listing is not pending purchase");

	if (listing.lastBidderUserId !== userId)
		throw new Error("You are not the winning bidder");

	if (listing.fulfillmentQuestion && listing.fulfillmentQuestion.length > 0) {
		if (!listingAnswer || listingAnswer.length === 0)
			throw new Error("Question response is required");

		const [updated] = await db
			.update(listingsTable)
			.set({
				fulfillmentAnswer: listingAnswer,
				updatedAt: new Date().toUTCString(),
			})
			.where(eq(listingsTable.id, listingId))
			.returning();
		if (!updated) throw new Error("Failed to update listing");
		await sendListing(updated);
	}

	const metadata: PaymentMetadata = {
		type: "listing",
		listingId,
		experienceId: listing.experienceId,
	};

	const result = await whopApi.chargeUser({
		input: {
			amount: Number.parseFloat(listing.currentPrice),
			currency: "usd",
			userId,
			description: `Penny bidding purchase for ${listing.title}`,
			metadata,
		},
	});

	return result.chargeUser?.inAppPurchase;
}
