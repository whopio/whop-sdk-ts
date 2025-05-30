"use server";
import { headers } from "next/headers";
import type { PaymentMetadata } from "../types";
import { verifyUserToken, whopApi } from "../whop-api";

export async function requestTopup(experienceId: string) {
	const { userId } = await verifyUserToken(await headers());
	const metadata: PaymentMetadata = {
		type: "credits",
		experienceId,
	};
	const result = await whopApi.chargeUser({
		input: {
			amount: 20,
			currency: "usd",
			userId,
			description: "Penny bidding credits",
			metadata,
		},
	});

	return result.chargeUser?.checkoutSession;
}
