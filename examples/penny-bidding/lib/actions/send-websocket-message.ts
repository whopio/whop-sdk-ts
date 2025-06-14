"use server";
import type { Listing } from "../db/schema";
import type { WebsocketData } from "../types";
import { whopSdk } from "../whop-sdk";

export async function sendListing(listing: Listing) {
	return await sendWebsocketMessage(
		{
			experience: listing.experienceId,
		},
		{
			type: "listing",
			data: listing,
		},
	);
}

export async function sendWebsocketMessage(
	target: Parameters<typeof whopSdk.websockets.sendMessage>[0]["target"],
	message: WebsocketData,
) {
	return await whopSdk.websockets.sendMessage({
		message: JSON.stringify(message),
		target,
	});
}
