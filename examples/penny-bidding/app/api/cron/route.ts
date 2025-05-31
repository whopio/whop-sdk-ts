import { db } from "@/lib/db";
import { type Listing, listingsTable } from "@/lib/db/schema";
import { whopApi } from "@/lib/whop-api";
import { and, gt, inArray, lt } from "drizzle-orm";

export async function GET() {
	// Send notifications for listing that are about to expire in the next 2 minutes.
	const aboutToFinishListings = await db.query.listingsTable.findMany({
		where: and(
			// Send to all listing that are going to finish in the next 2 minutes.
			lt(
				listingsTable.biddingEndsAt,
				new Date(Date.now() + 2 * 60 * 1000).toISOString(),
			),
			gt(listingsTable.biddingEndsAt, new Date(Date.now()).toISOString()),

			// Make sure we haven't sent a notification for that listing in the last 5 minutes.
			lt(
				listingsTable.lastNotificationSentAt,
				new Date(Date.now() - 5 * 60 * 1000).toISOString(),
			),
		),
	});
	await updateLastNotificationSentAt(aboutToFinishListings);

	const justFinishedListings = await db.query.listingsTable.findMany({
		where: and(
			gt(listingsTable.biddingEndsAt, new Date(Date.now()).toISOString()),
			lt(listingsTable.lastNotificationSentAt, listingsTable.biddingEndsAt),
		),
	});
	await updateLastNotificationSentAt(justFinishedListings);

	await Promise.all(aboutToFinishListings.map(sendAboutToFinishNotification));
	await Promise.all(justFinishedListings.map(sendJustFinishedNotification));
}

async function sendAboutToFinishNotification(listing: Listing) {
	if (!listing.lastBidderUserId) {
		await whopApi.sendPushNotification({
			input: {
				title: "⏰ Auction Ending Soon!",
				content: `"${listing.title}" is about to finish and no bids have been placed yet. Will you be the first?`,
				experienceId: listing.experienceId,
				isMention: true,
			},
		});
		return;
	}

	const { publicUser: currentBidder } = await whopApi.getUser({
		userId: listing.lastBidderUserId,
	});

	const timeLeft = Math.ceil(
		(new Date(listing.biddingEndsAt).getTime() - Date.now()) / 1000,
	);

	await whopApi.sendPushNotification({
		input: {
			title: "⏰ Auction Ending Soon!",
			content: `${currentBidder.name ?? currentBidder.username} is currently winning "${listing.title}" at $${listing.currentPrice} with ${listing.numBids} bids! Only ${timeLeft} seconds left to place your bid!`,
			experienceId: listing.experienceId,
			isMention: true,
		},
	});
}

async function sendJustFinishedNotification(listing: Listing) {
	if (!listing.lastBidderUserId) {
		await whopApi.sendPushNotification({
			input: {
				title: "Auction Ended - No Winner",
				content: `"${listing.title}" has ended with no bids. The item will be relisted soon!`,
				experienceId: listing.experienceId,
				isMention: true,
			},
		});
		return;
	}

	const { publicUser: winner } = await whopApi.getUser({
		userId: listing.lastBidderUserId,
	});

	await whopApi.sendPushNotification({
		input: {
			title: "🎉 Auction Winner!",
			content: `${winner.name ?? winner.username} won "${listing.title}" for $${listing.currentPrice} after ${listing.numBids} bids! They can now purchase the item.`,
			experienceId: listing.experienceId,
			isMention: true,
			userIds: [listing.lastBidderUserId],
		},
	});
}

async function updateLastNotificationSentAt(listings: Listing[]) {
	if (listings.length === 0) return;

	await db
		.update(listingsTable)
		.set({
			lastNotificationSentAt: new Date().toISOString(),
		})
		.where(
			inArray(
				listingsTable.id,
				listings.map((l) => l.id),
			),
		);
}
