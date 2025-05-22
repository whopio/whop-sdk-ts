"use server";

import { verifyUserToken, whopApi } from "@/lib/whop-api";
import { headers } from "next/headers";

export async function requestPayment(formData: FormData) {
	const requestHeaders = await headers();
	const userTokenData = await verifyUserToken(requestHeaders);
	const amount = formData.get("amount");
	const description = formData.get("description");
	const experienceId = formData.get("experienceId");

	if (typeof experienceId !== "string") {
		return undefined;
	}

	const experience = await whopApi.getExperience({ experienceId });
	const companyId = experience.experience.company.id;

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

	const response = await whopApi.withCompany(companyId).chargeUser({
		input: {
			userId: userTokenData.userId,
			amount: Number.parseInt(amount),
			description,
			currency: "usd",
			metadata: {
				creditsPurchased: "100",
				tier: "bronze",
			},
		},
	});

	return response.chargeUser?.checkoutSession?.planId;
}
