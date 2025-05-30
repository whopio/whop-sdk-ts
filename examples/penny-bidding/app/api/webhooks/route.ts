import { appendCredits } from "@/lib/actions/append-credits";
import {
	sendListing,
	sendWebsocketMessage,
} from "@/lib/actions/send-websocket-message";
import { db } from "@/lib/db";
import { type Listing, listingsTable, paymentsTable } from "@/lib/db/schema";
import type { PaymentMetadata } from "@/lib/types";
import { whopApi } from "@/lib/whop-api";
import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const webhookData = await validateWebhook(request);

	// Handle the webhook event
	if (webhookData.action === "payment.succeeded") {
		const { id, final_amount, amount_after_fees, currency, user_id, metadata } =
			webhookData.data;

		console.log(
			`Payment ${id} succeeded for ${user_id} with amount ${final_amount} ${currency}`,
		);

		await handlePaymentWebhook(
			id,
			user_id,
			final_amount,
			currency,
			amount_after_fees,
			metadata as PaymentMetadata,
		);
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

async function handlePaymentWebhook(
	receiptId: string,
	userId: string | null | undefined,
	amount: number,
	currency: string,
	amount_after_fees: number | string | null | undefined,
	metadata: PaymentMetadata,
) {
	if (!userId) return;
	if (currency.toLowerCase() !== "usd") return;
	if (amount_after_fees === null || amount_after_fees === undefined) return;
	const amountAfterFees =
		typeof amount_after_fees === "string"
			? amount_after_fees
			: amount_after_fees.toFixed(2);

	console.log("handlePaymentWebhook", {
		receiptId,
		userId,
		amount,
		currency,
		amount_after_fees,
		metadata,
		amountAfterFees,
	});

	await db.transaction(async (tx) => {
		const existingTransaction = await tx
			.select()
			.from(paymentsTable)
			.where(eq(paymentsTable.receiptId, receiptId));

		if (existingTransaction.length > 0) return;

		if (metadata.type === "credits") {
			await tx.insert(paymentsTable).values({
				userId,
				receiptId,
				amount: amount.toFixed(2),
				currency,
				amountAfterFees,
				purchaseType: metadata.type,
				experienceId: metadata.experienceId,
			});

			const creditsAmount = Math.floor(Number.parseFloat(amountAfterFees));

			const newCredits = await appendCredits(userId, creditsAmount, tx);

			waitUntil(
				sendWebsocketMessage(
					{ user: userId },
					{ type: "credits", data: newCredits },
				),
			);
		}

		if (metadata.type === "listing") {
			await tx.insert(paymentsTable).values({
				userId,
				receiptId,
				amount: amount.toFixed(2),
				currency,
				amountAfterFees,
				purchaseType: metadata.type,
				experienceId: metadata.experienceId,
				listingId: metadata.listingId,
			});

			const [updatedListing] = await tx
				.update(listingsTable)
				.set({
					fulfillmentReceiptId: receiptId,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(listingsTable.id, metadata.listingId));

			if (updatedListing) {
				waitUntil(sendListing(updatedListing));
				waitUntil(sendNotification(updatedListing));
			}
		}
	});
}

async function sendNotification(updatedListing: Listing) {
	// Get company id
	const { experience } = await whopApi.getExperience({
		experienceId: updatedListing.experienceId,
	});
	const { publicUser: bidderUser } = await whopApi.getUser({
		userId: updatedListing.lastBidderUserId ?? "",
	});

	const name = bidderUser.name ?? bidderUser.username;

	await whopApi.sendPushNotification({
		input: {
			title: `${name} just purchased an item!`,
			content: `${name} just purchased ${updatedListing.title} for ${updatedListing.currentPrice}. You can now fulfill the order.`,
			companyTeamId: experience.company.id,
			isMention: true,
		},
	});
}
