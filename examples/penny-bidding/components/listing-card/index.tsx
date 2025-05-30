"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { markAsFulfilled } from "@/lib/actions/mark-as-fulfilled";
import { placeBid } from "@/lib/actions/place-bid";
import { purchaseListing } from "@/lib/actions/purchase-listing";
import { relistListing } from "@/lib/actions/relist";
import type { Listing } from "@/lib/db/schema";
import { whopIframe } from "@/lib/iframe";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { LastBidder } from "./last-bidder";
import { ListingTimer } from "./listing-timer";

type ListingStatus =
	| "bid"
	| "already_bid"
	| "message_winner"
	| "purchase"
	| "awaiting_fulfillment"
	| "fulfilled"
	| "waiting_for_purchase"
	| "mark_as_fulfilled"
	| "relist"
	| "nobody_won";

export function ListingCard({
	currentUserId,
	listing,
	isAdmin,
}: { listing: Listing; currentUserId: string; isAdmin: boolean }) {
	return (
		<Card className="flex flex-col h-full">
			<CardHeader className="space-y-0">
				<div className="flex justify-between items-start gap-2">
					<h3 className="text-lg font-semibold line-clamp-2">
						{listing.title}
					</h3>
				</div>
				{listing.description && (
					<p className="text-sm text-muted-foreground line-clamp-2">
						{listing.description}
					</p>
				)}
			</CardHeader>

			<CardContent className="flex-grow space-y-2">
				<div className="flex justify-between items-center">
					<span className="text-sm text-muted-foreground">Current Price</span>
					<span className="text-lg font-semibold">
						${Number.parseFloat(listing.currentPrice).toFixed(2)}
					</span>
				</div>

				<div className="space-y-1">
					<div className="flex justify-between items-center">
						<span className="text-sm text-muted-foreground">Time Left</span>
						<ListingTimer endsAt={new Date(listing.biddingEndsAt)} />
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm text-muted-foreground">Last Bidder</span>
						<LastBidder userId={listing.lastBidderUserId} />
					</div>
				</div>
			</CardContent>

			<CardFooter>
				<div className="w-full">
					<ListingCta
						listing={listing}
						currentUserId={currentUserId}
						isAdmin={isAdmin}
					/>
				</div>
			</CardFooter>
		</Card>
	);
}

function ListingCta({
	listing,
	currentUserId,
	isAdmin,
}: { listing: Listing; currentUserId: string; isAdmin: boolean }) {
	const status = useListingStatus(listing, currentUserId, isAdmin);

	switch (status) {
		case "bid":
			return <BidButton listingId={listing.id} />;
		case "mark_as_fulfilled":
			return <MarkAsFulfilledButton listingId={listing.id} />;
		case "relist":
			return <RelistButton listingId={listing.id} />;
		case "message_winner":
			return (
				<MessageWinnerButton
					winnerUserId={listing.lastBidderUserId ?? "user_v9"}
				/>
			);
		case "purchase":
			return (
				<PurchaseButton
					listingId={listing.id}
					listingQuestion={listing.fulfillmentQuestion}
				/>
			);
		default:
			return <DisabledCta status={status} />;
	}
}

function useListingStatus(
	listing: Listing,
	currentUserId: string,
	isAdmin: boolean,
) {
	const [status, setStatus] = useState<ListingStatus>(
		getListingStatus(listing, currentUserId, isAdmin, new Date()),
	);
	useEffect(() => {
		const interval = setInterval(() => {
			const status = getListingStatus(
				listing,
				currentUserId,
				isAdmin,
				new Date(),
			);
			setStatus(status);
		}, 1000);
		return () => clearInterval(interval);
	}, [listing, currentUserId, isAdmin]);

	return status;
}

function getListingStatus(
	listing: Listing,
	currentUserId: string,
	isAdmin: boolean,
	currentTime: Date,
): ListingStatus {
	const isActive = new Date(listing.biddingEndsAt) > currentTime;
	const isWinner = listing.lastBidderUserId === currentUserId;
	const hasPurchased = listing.fulfillmentReceiptId !== null;
	const isFulfilled = listing.fulfilledAt !== null;

	if (isActive) {
		return isWinner ? "already_bid" : "bid";
	}

	if (listing.lastBidderUserId === null) return "nobody_won";

	if (isWinner) {
		if (!hasPurchased) return "purchase";
		if (isFulfilled) return "fulfilled";
		return "awaiting_fulfillment";
	}

	if (isAdmin) {
		if (!hasPurchased) return "waiting_for_purchase";
		if (isFulfilled) return "relist";
		return "mark_as_fulfilled";
	}

	return "message_winner";
}

function listingCtaText(status: ListingStatus) {
	switch (status) {
		case "bid":
			return "Place bid";
		case "already_bid":
			return "You're winning!";
		case "purchase":
			return "Purchase now";
		case "awaiting_fulfillment":
			return "Awaiting creator fulfillment";
		case "fulfilled":
			return "Fulfilled";
		case "waiting_for_purchase":
			return "Waiting for winner to purchase";
		case "mark_as_fulfilled":
			return "Mark as fulfilled";
		case "relist":
			return "Relist";
		case "message_winner":
			return "Message winner";
		case "nobody_won":
			return "Nobody won";
	}
}

function MarkAsFulfilledButton({ listingId }: { listingId: string }) {
	const { mutate, isPending } = useMutation({
		mutationKey: ["mark-as-fulfilled", listingId],
		mutationFn: () => markAsFulfilled(listingId),
	});

	return (
		<Button
			type="button"
			className="w-full"
			disabled={isPending}
			onClick={() => mutate()}
		>
			{isPending ? "Marking as fulfilled..." : "Mark as fulfilled"}
		</Button>
	);
}

function RelistButton({ listingId }: { listingId: string }) {
	const { mutate, isPending } = useMutation({
		mutationKey: ["relist", listingId],
		mutationFn: () => relistListing(listingId),
	});

	return (
		<Button
			type="button"
			className="w-full"
			disabled={isPending}
			onClick={() => mutate()}
		>
			{isPending ? "Relisting..." : "Relist"}
		</Button>
	);
}

function MessageWinnerButton({ winnerUserId }: { winnerUserId: string }) {
	return (
		<Button type="button" className="w-full" asChild>
			<Link
				href={`https://whop.com/messages/?toUserId=${winnerUserId}`}
				target="_blank"
			>
				Message winner
			</Link>
		</Button>
	);
}

function DisabledCta({ status }: { status: ListingStatus }) {
	return (
		<Button type="button" className="w-full" disabled>
			{listingCtaText(status)}
		</Button>
	);
}

function PurchaseButton({
	listingId,
	listingQuestion,
}: {
	listingId: string;
	listingQuestion?: string | null;
}) {
	const { mutateAsync, isPending, error, reset } = useMutation({
		mutationKey: ["purchase-listing", listingId],
		mutationFn: async (formData: FormData) => {
			const listingAnswer = formData.get("listingAnswer");
			if (listingAnswer && typeof listingAnswer !== "string")
				throw new Error("Listing answer is required");
			const checkoutSession = await purchaseListing({
				listingId,
				listingAnswer,
			});
			console.log("GOT CHECKOUT SESSION", checkoutSession);
			if (!checkoutSession) throw new Error("Failed to purchase listing");
			const response = await whopIframe.inAppPurchase(checkoutSession);
			if (response.status === "error") throw new Error(response.error);
		},
	});

	function mutateAsyncWithoutThrowing(formData: FormData) {
		mutateAsync(formData).catch((error) => {
			console.error(error);
		});
	}

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) reset();
			}}
		>
			<DialogTrigger asChild>
				<Button type="button" className="w-full">
					Purchase now
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Purchase now</DialogTitle>
					<DialogDescription>
						You won this listing! Click the button below to purchase it.
					</DialogDescription>
				</DialogHeader>

				<form action={mutateAsyncWithoutThrowing}>
					{listingQuestion && (
						<div className="space-y-2 pb-3">
							<p className="text-sm text-muted-foreground">{listingQuestion}</p>
							<Input
								placeholder="Enter your answer"
								required
								name="listingAnswer"
								className="w-full"
								disabled={isPending}
							/>
						</div>
					)}

					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Purchasing..." : "Purchase now"}
					</Button>

					{error && (
						<p className="text-sm text-destructive pt-2 text-center">
							{error.message}
						</p>
					)}
				</form>
			</DialogContent>
		</Dialog>
	);
}

function BidButton({
	listingId,
}: {
	listingId: string;
}) {
	const { mutate, isPending, error, reset } = useMutation({
		mutationKey: ["place-bid", listingId],
		mutationFn: () => placeBid({ listingId }),
	});

	return (
		<>
			<Button
				type="button"
				className="w-full"
				disabled={isPending}
				onClick={() => mutate()}
			>
				{isPending ? "Placing Bid..." : "Place Bid"}
			</Button>
			{error && (
				<p className="text-sm text-destructive pt-2 text-center">
					{error.message}
				</p>
			)}
		</>
	);
}
