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
import { whopApi } from "../whop-api";
import { sendListing, sendWebsocketMessage } from "./send-websocket-message";

export async function placeBid({ listingId }: { listingId: string }) {
	// Get the listing
	const listing = await db.query.listingsTable.findFirst({
		where: eq(listingsTable.id, listingId),
	});
	if (!listing) throw new Error("Listing not found");

	// Make sure the user is at least a customer
	const { userId } = await verifyUser("customer", {
		experienceId: listing.experienceId,
	});

	// Verify the listing is still active
	if (new Date(listing.biddingEndsAt) < new Date()) {
		throw new Error("This listing has expired");
	}

	const [updatedListing, newCredits] = await db.transaction(async (tx) => {
		// Get the listing again, this time with the transaction
		const listing = await tx.query.listingsTable.findFirst({
			where: eq(listingsTable.id, listingId),
		});
		if (!listing) throw new Error("Listing not found");

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

		if (creditUpdate.length === 0) throw new Error("Insufficient credits");

		const newCredits = creditUpdate[0];

		const bid = await tx
			.insert(bidsTable)
			.values({
				userId,
				listingId,
			})
			.returning();

		if (bid.length === 0) throw new Error("Failed to create bid");

		// Update the listing with the new bid
		const results = await db
			.update(listingsTable)
			.set({
				currentPrice: nextBidAmount,
				numBids: sql`num_bids + 1`,
				lastBidderUserId: userId,
			})
			.where(
				and(
					eq(listingsTable.id, listingId),
					gt(listingsTable.biddingEndsAt, new Date().toISOString()),
				),
			)
			.returning();

		const newListing = results.at(0);
		if (!newListing) throw new Error("Failed to update listing");

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
}

async function sendNotification(updatedListing: Listing, oldListing: Listing) {
	if (oldListing.lastBidderUserId) {
		const { publicUser: newUser } = await whopApi.getUser({
			userId: updatedListing.lastBidderUserId ?? "",
		});

		const newUserName = newUser.name ?? newUser.username;

		await whopApi.sendNotification({
			input: {
				title: `New bid from ${newUserName}`,
				content: `"${newUserName} just bid ${updatedListing.currentPrice} for ${updatedListing.title}. You just lost the top spot!"`,
				experienceId: updatedListing.experienceId,
				isMention: true,
				userIds: [oldListing.lastBidderUserId],
			},
		});
	}
}
