"use server";
import { headers } from "next/headers";
import type { PaymentMetadata } from "../types";
import { whopSdk } from "../whop-sdk";

export async function requestTopup(experienceId: string) {
	const { userId } = await whopSdk.verifyUserToken(await headers());
	const metadata: PaymentMetadata = {
		type: "credits",
		experienceId,
	};
	const result = await whopSdk.payments.chargeUser({
		amount: 22.99,
		currency: "usd",
		userId,
		description: "Penny bidding credits",
		metadata,
	});

	return result?.inAppPurchase;
}
