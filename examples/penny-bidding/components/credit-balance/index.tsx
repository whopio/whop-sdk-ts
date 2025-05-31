"use client";

import { fetchCredits } from "@/lib/actions/fetch-credits";
import { QUERY_KEY } from "@/lib/query-key";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../ui/skeleton";
import { TopUpButton } from "./top-up-button";

export function UserCreditBalance({ experienceId }: { experienceId: string }) {
	const { data: credits } = useQuery({
		queryKey: QUERY_KEY.CREDITS,
		queryFn: () => fetchCredits(),
	});

	if (credits === undefined) {
		return <UserCreditBalanceSkeleton />;
	}

	return (
		<div className="flex items-center gap-4">
			<div className="flex flex-col gap-1">
				<span className="text-sm text-muted-foreground">Your Balance</span>
				<span className="text-3xl font-bold font-mono">
					{credits.credits} CR
				</span>
			</div>
			<TopUpButton mode="real" experienceId={experienceId} />
		</div>
	);
}

export function UserCreditBalanceSkeleton() {
	return (
		<div className="flex items-center gap-4">
			<div className="flex flex-col gap-1">
				<Skeleton className="w-24 h-4" />
				<Skeleton className="w-24 h-6" />
			</div>
			<Skeleton className="w-24 h-6" />
		</div>
	);
}
