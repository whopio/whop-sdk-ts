"use server";
import type { Listing } from "../db/schema";
import type { WebsocketData } from "../types";
import { whopApi } from "../whop-api";

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
	target: Parameters<typeof whopApi.sendWebsocketMessage>[0]["target"],
	message: WebsocketData,
) {
	return await whopApi.sendWebsocketMessage({
		message: JSON.stringify(message),
		target,
	});
}
