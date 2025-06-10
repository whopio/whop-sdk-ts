"use client";

import type { Listing } from "@/lib/db/schema";
import { QUERY_KEY } from "@/lib/query-key";
import type { WebsocketData } from "@/lib/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { proto } from "@whop/api";
import { WhopWebsocketProvider } from "@whop/react";
import { type PropsWithChildren, use } from "react";

const queryClient = new QueryClient();

export default function ExperienceLayoutClient({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ experienceId: string }> }>) {
	const { experienceId } = use(params);

	return (
		<QueryClientProvider client={queryClient}>
			<WhopWebsocketProvider
				joinExperience={experienceId}
				onAppMessage={handleWebsocketMessage}
			>
				{children}
			</WhopWebsocketProvider>
		</QueryClientProvider>
	);
}

function handleWebsocketMessage(message: proto.common.AppMessage) {
	if (!message.isTrusted) return;
	const data = JSON.parse(message.json) as WebsocketData;
	switch (data.type) {
		case "credits":
			console.log("credits", data.data);
			queryClient.setQueryData(QUERY_KEY.CREDITS, {
				credits: data.data.credits,
			});
			break;
		case "listing":
			console.log("listing", data.data);
			queryClient.setQueryData(
				QUERY_KEY.LISTINGS(data.data.experienceId),
				listingListUpdater(data.data),
			);
			break;
	}
}

function listingListUpdater(newListing: Listing) {
	return (oldDataRaw: Listing[] | undefined) => {
		const oldData = oldDataRaw ?? [];
		const updatedData = oldData.filter((l) => l.id !== newListing.id);
		updatedData.push(newListing);
		return updatedData.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);
	};
}
