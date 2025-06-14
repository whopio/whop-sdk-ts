"use server";

import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export async function requestPayment(formData: FormData) {
	const requestHeaders = await headers();
	const userTokenData = await whopSdk.verifyUserToken(requestHeaders);
	const amount = formData.get("amount");
	const description = formData.get("description");
	const experienceId = formData.get("experienceId");

	if (typeof experienceId !== "string") {
		return undefined;
	}

	const experience = await whopSdk.experiences.getExperience({ experienceId });
	const companyId = experience.company.id;

	if (
		!userTokenData?.userId ||
		!amount ||
		!description ||
		typeof userTokenData?.userId !== "string" ||
		typeof amount !== "string" ||
		typeof description !== "string"
	) {
		throw new Error("User ID, amount, and description are required");
	}

	console.log({
		userId: userTokenData.userId,
		amount: Number.parseInt(amount),
		description,
		currency: "usd",
		metadata: {
			creditsPurchased: "100",
			tier: "bronze",
		},
	});

	const response = await whopSdk.withCompany(companyId).payments.chargeUser({
		userId: userTokenData.userId,
		amount: Number.parseInt(amount),
		description,
		currency: "usd",
		metadata: {
			creditsPurchased: "100",
			tier: "bronze",
		},
	});

	return response?.inAppPurchase;
}
