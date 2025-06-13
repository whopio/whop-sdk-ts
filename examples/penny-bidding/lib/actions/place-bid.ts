"use server";

import { db } from "@/lib/db";
import {
	type Listing,
	bidsTable,
	listingsTable,
	userCreditsTable,
} from "@/lib/db/schema";
import { verifyUser } from "@/lib/verify-user";
import { waitUntil } from "@vercel/functions";
import { and, eq, gt, sql } from "drizzle-orm";
import { SafeError, wrapServerAction } from "../server-action-errors";
import { whopApi } from "../whop-api";
import { sendListing, sendWebsocketMessage } from "./send-websocket-message";

// Ensure that after a bid is placed, the listing will not expire for at least 20 seconds.
const MIN_EXPIRES_IN_DURATION_AFTER_BID = 20 * 1000;

export const placeBid = wrapServerAction(
	async ({ listingId }: { listingId: string }) => {
		// Get the listing
		const listing = await db.query.listingsTable.findFirst({
			where: eq(listingsTable.id, listingId),
		});
		if (!listing) throw new SafeError("Listing not found");

		// Make sure the user is at least a customer
		const { userId } = await verifyUser("customer", {
			experienceId: listing.experienceId,
		});

		// Verify the listing is still active
		if (new Date(listing.biddingEndsAt) < new Date()) {
			throw new SafeError("This listing has expired");
		}

		const [updatedListing, newCredits] = await db.transaction(async (tx) => {
			// Get the listing again, this time with the transaction
			const listing = await tx.query.listingsTable.findFirst({
				where: eq(listingsTable.id, listingId),
			});
			if (!listing) throw new SafeError("Listing not found");

			// Calculate the next bid amount
			const nextBidAmount = (
				Number.parseFloat(listing.currentPrice) +
				Number.parseFloat(listing.increment)
			).toFixed(2);

			const creditUpdate = await db
				.update(userCreditsTable)
				.set({
					credits: sql`credits - 1`,
				})
				.where(
					and(
						eq(userCreditsTable.userId, userId),
						gt(userCreditsTable.credits, 0),
					),
				)
				.returning();

			if (creditUpdate.length === 0)
				throw new SafeError("Insufficient credits");

			const newCredits = creditUpdate[0];

			const bid = await tx
				.insert(bidsTable)
				.values({
					userId,
					listingId,
				})
				.returning();

			if (bid.length === 0) throw new SafeError("Failed to create bid");

			const newBiddingEndsAt = new Date(
				Math.max(
					new Date(listing.biddingEndsAt).getTime(),
					Date.now() + MIN_EXPIRES_IN_DURATION_AFTER_BID,
				),
			);

			// Update the listing with the new bid
			const results = await db
				.update(listingsTable)
				.set({
					currentPrice: nextBidAmount,
					numBids: sql`num_bids + 1`,
					lastBidderUserId: userId,
					biddingEndsAt: newBiddingEndsAt.toISOString(),
				})
				.where(
					and(
						eq(listingsTable.id, listingId),
						gt(listingsTable.biddingEndsAt, new Date().toISOString()),
					),
				)
				.returning();

			const newListing = results.at(0);
			if (!newListing) throw new SafeError("Failed to update listing");

			return [newListing, newCredits] as const;
		});

		await Promise.all([
			sendListing(updatedListing),
			sendWebsocketMessage(
				{ user: userId },
				{ type: "credits", data: newCredits },
			),
		]);

		waitUntil(sendNotification(updatedListing, listing));
	},
);

async function sendNotification(updatedListing: Listing, oldListing: Listing) {
	if (oldListing.lastBidderUserId) {
		const newUser = await whopApi.getUser({
			userId: updatedListing.lastBidderUserId ?? "",
		});

		const newUserName = newUser.name ?? newUser.username;

		await whopApi.sendPushNotification({
			title: `New bid from ${newUserName}`,
			content: `"${newUserName} just bid ${updatedListing.currentPrice} for ${updatedListing.title}. You just lost the top spot!"`,
			experienceId: updatedListing.experienceId,
			isMention: true,
			userIds: [oldListing.lastBidderUserId],
		});
	}
}
