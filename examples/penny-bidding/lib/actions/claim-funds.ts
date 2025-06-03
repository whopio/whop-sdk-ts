"use server";

import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { listingsTable } from "../db/schema";
import { SafeError, wrapServerAction } from "../server-action-errors";
import { verifyUser } from "../verify-user";
import { whopApi } from "../whop-api";
import { sendListing } from "./send-websocket-message";

export const claimFunds = wrapServerAction(async (listingId: string) => {
	const listing = await db.query.listingsTable.findFirst({
		where: eq(listingsTable.id, listingId),
	});

	if (!listing) {
		throw new SafeError("Listing not found");
	}

	if (listing.claimedFundsAt) {
		throw new SafeError("Funds already claimed");
	}

	await verifyUser("admin", {
		experienceId: listing.experienceId,
	});

	const { company } = await whopApi.getCompanyLedgerAccount({
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
	});

	const ledgerAccount = company?.ledgerAccount;
	const ledgerAccountBalance =
		ledgerAccount?.balanceCaches.nodes?.find((acc) => acc?.currency === "usd")
			?.balance ?? 0;

	if (!ledgerAccount) {
		throw new SafeError("App company ledger account not found");
	}

	if (ledgerAccountBalance < listing.numBids) {
		throw new SafeError(
			"Insufficient funds - please wait a few days for all payments to settle.",
		);
	}

	const { experience } = await whopApi.getExperience({
		experienceId: listing.experienceId,
	});

	await whopApi
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		.withCompany(process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!)
		.payUser({
			input: {
				ledgerAccountId: ledgerAccount.id,
				destinationId: experience.company.id,
				amount: listing.numBids,
				currency: "usd",
				// Use this idempotence key to prevent duplicate withdrawals for the same listing.
				idempotenceKey: listing.id,
				notes: `Claimed funds for listing: ${listing.title}`,
				transferFee: ledgerAccount.transferFee,
			},
		});

	const [updatedListing] = await db
		.update(listingsTable)
		.set({
			claimedFundsAt: new Date().toISOString(),
		})
		.where(and(eq(listingsTable.id, listingId)))
		.returning();

	if (!updatedListing) {
		throw new SafeError("Failed to update listing");
	}

	// Update the clients with the new listing data
	await sendListing(updatedListing);
});
