"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "../db";
import { userCreditsTable } from "../db/schema";
import { whopSdk } from "../whop-sdk";

export async function fetchCredits() {
	const { userId } = await whopSdk.verifyUserToken(await headers());
	const credits = await db.query.userCreditsTable.findFirst({
		where: eq(userCreditsTable.userId, userId),
	});
	return { credits: credits?.credits ?? 0 };
}
