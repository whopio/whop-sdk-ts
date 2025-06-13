"use server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "../db";
import { listingsTable } from "../db/schema";
import { SafeError, wrapServerAction } from "../server-action-errors";
import type { PaymentMetadata } from "../types";
import { verifyUserToken, whopApi } from "../whop-api";
import { sendListing } from "./send-websocket-message";

export const purchaseListing = wrapServerAction(
	async ({
		listingId,
		listingAnswer,
	}: {
		listingId: string;
		listingAnswer?: string | null;
	}) => {
		const { userId } = await verifyUserToken(await headers());

		const listing = await db.query.listingsTable.findFirst({
			where: eq(listingsTable.id, listingId),
		});
		if (!listing) throw new SafeError("Listing not found");

		if (new Date(listing.biddingEndsAt) > new Date())
			throw new SafeError("Listing is not pending purchase");

		if (listing.lastBidderUserId !== userId)
			throw new SafeError("You are not the winning bidder");

		if (listing.fulfillmentQuestion && listing.fulfillmentQuestion.length > 0) {
			if (!listingAnswer || listingAnswer.length === 0)
				throw new SafeError("Question response is required");

			const [updated] = await db
				.update(listingsTable)
				.set({
					fulfillmentAnswer: listingAnswer,
				})
				.where(eq(listingsTable.id, listingId))
				.returning();
			if (!updated) throw new SafeError("Failed to update listing");
			await sendListing(updated);
		}

		// Allow people to purchase listings for free if they are below $1
		if (Number.parseFloat(listing.currentPrice) < 1) {
			const [updated] = await db
				.update(listingsTable)
				.set({
					fulfillmentReceiptId: "free",
				})
				.where(eq(listingsTable.id, listingId))
				.returning();
			if (!updated) throw new SafeError("Failed to update listing");
			await sendListing(updated);
			return;
		}

		const metadata: PaymentMetadata = {
			type: "listing",
			listingId,
			experienceId: listing.experienceId,
		};

		const result = await whopApi.chargeUser({
			amount: Number.parseFloat(listing.currentPrice),
			currency: "usd",
			userId,
			description: `Penny bidding purchase for ${listing.title}`,
			metadata,
		});

		return result?.inAppPurchase;
	},
);
