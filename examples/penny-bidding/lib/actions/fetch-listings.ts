"use server";

import { and, desc, eq, lt } from "drizzle-orm";
import { cache } from "react";
import { db } from "../db";
import { type Listing, listingsTable } from "../db/schema";
import { verifyUser } from "../verify-user";

export const fetchListings = cache(
	async (experienceId: string, before?: string | null | undefined) => {
		const { userId, accessLevel } = await verifyUser("customer", {
			experienceId,
		});

		const listings = await db.query.listingsTable.findMany({
			where: and(
				eq(listingsTable.experienceId, experienceId),
				before ? lt(listingsTable.createdAt, before) : undefined,
			),
			orderBy: [desc(listingsTable.createdAt)],
			limit: 100,
		});

		return listings.map((listing) =>
			redactListing(listing, userId, accessLevel === "admin"),
		);
	},
);

// const fetchMyWonListings = cache(async (experienceId: string) => {
// 	const { userId, accessLevel } = await verifyUser("customer", {
// 		experienceId,
// 	});

// 	const now = new Date();
// 	const listings = await db.query.listingsTable.findMany({
// 		where: and(
// 			eq(listingsTable.experienceId, experienceId),
// 			lt(listingsTable.biddingEndsAt, now.toISOString()),
// 			eq(listingsTable.lastBidderUserId, userId),
// 		),
// 		orderBy: [desc(listingsTable.createdAt)],
// 		limit: 100,
// 	});

// 	return listings.map((listing) =>
// 		redactListing(listing, userId, accessLevel === "admin"),
// 	);
// });

// const fetchActiveBiddingListings = cache(async (experienceId: string) => {
// 	const { userId, accessLevel } = await verifyUser("customer", {
// 		experienceId,
// 	});

// 	const listings = await db.query.listingsTable.findMany({
// 		where: and(
// 			eq(listingsTable.experienceId, experienceId),
// 			lt(listingsTable.biddingEndsAt, new Date().toISOString()),
// 		),
// 		orderBy: [desc(listingsTable.createdAt)],
// 		limit: 100,
// 	});

// 	return listings.map((listing) =>
// 		redactListing(listing, userId, accessLevel === "admin"),
// 	);
// });

// const fetchExpiredListings = cache(async (experienceId: string) => {
// 	const { userId, accessLevel } = await verifyUser("customer", {
// 		experienceId,
// 	});

// 	const listings = await db.query.listingsTable.findMany({
// 		where: and(
// 			eq(listingsTable.experienceId, experienceId),
// 			gt(listingsTable.biddingEndsAt, new Date().toISOString()),
// 		),
// 		orderBy: [desc(listingsTable.createdAt)],
// 		limit: 100,
// 	});

// 	return listings.map((listing) =>
// 		redactListing(listing, userId, accessLevel === "admin"),
// 	);
// });

function redactListing(
	listing: Listing,
	currentUserId: string,
	isAdmin: boolean,
): Listing {
	if (isAdmin || listing.lastBidderUserId === currentUserId) return listing;

	return {
		...listing,
		fulfillmentAnswer: null,
		fulfillmentReceiptId: null,
	};
}
