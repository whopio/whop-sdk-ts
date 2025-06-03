"use client";

import { fetchListings } from "@/lib/actions/fetch-listings";
import type { Listing } from "@/lib/db/schema";
import { QUERY_KEY } from "@/lib/query-key";
import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "../listing-card";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function useListings({ experienceId }: { experienceId: string }) {
	return useQuery({
		queryKey: QUERY_KEY.LISTINGS(experienceId),
		queryFn: () => fetchListings(experienceId),
	});
}

export function ListingGrid({
	experienceId,
	emptyMessage,
	currentUserId,
	isAdmin,
}: {
	emptyMessage: string;
	experienceId: string;
	currentUserId: string;
	isAdmin: boolean;
}) {
	const { data: listings } = useListings({ experienceId });
	return (
		<section>
			<div className="flex items-center gap-2 mb-4">
				<h2 className="text-2xl font-semibold">Listings</h2>
			</div>
			{listings === undefined ? (
				<ListingGridSkeleton />
			) : listings.length === 0 ? (
				<ListingGridEmpty message={emptyMessage} />
			) : (
				<ListingGridFull
					listings={listings}
					currentUserId={currentUserId}
					isAdmin={isAdmin}
				/>
			)}
		</section>
	);
}

function ListingGridSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			{Array.from({ length: 3 }).map((_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: ok here
				<Skeleton key={index} className="h-48 w-full" />
			))}
		</div>
	);
}

function ListingGridEmpty({ message }: { message: string }) {
	return (
		<Card>
			<CardContent className="p-6 text-center text-muted-foreground">
				{message}
			</CardContent>
		</Card>
	);
}

function ListingGridFull({
	listings,
	currentUserId,
	isAdmin,
}: { listings: Listing[]; currentUserId: string; isAdmin: boolean }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			{listings.map((listing) => (
				<ListingCard
					key={listing.id}
					listing={listing}
					currentUserId={currentUserId}
					isAdmin={isAdmin}
				/>
			))}
		</div>
	);
}
