"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUser } from "@/lib/fetch-user";
import { QUERY_KEY } from "@/lib/query-key";
import { useQuery } from "@tanstack/react-query";

export function LastBidder({ userId }: { userId: string | null }) {
	const { data: user } = useQuery({
		queryKey: QUERY_KEY.USER(userId),
		queryFn: () => fetchUser(userId ?? ""),
		enabled: !!userId,
	});

	if (!userId) {
		return (
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">No bids yet</span>
			</div>
		);
	}

	if (!user) {
		return <LastBidderSkeleton />;
	}

	return (
		<div className="flex items-center gap-2">
			<Avatar className="h-6 w-6">
				<AvatarImage
					src={user.profilePicture?.sourceUrl ?? ""}
					alt={user.username ?? ""}
				/>
				<AvatarFallback>
					{user.username?.slice(0, 2).toUpperCase()}
				</AvatarFallback>
			</Avatar>
			<span className="text-sm font-medium">{user.name ?? user.username}</span>
		</div>
	);
}

export function LastBidderSkeleton() {
	return (
		<div className="flex items-center gap-2">
			<Skeleton className="h-6 w-6 rounded-full" />
			<Skeleton className="h-4 w-24" />
		</div>
	);
}
