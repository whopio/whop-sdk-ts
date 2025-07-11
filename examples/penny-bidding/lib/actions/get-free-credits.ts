"use server";

import { db } from "@/lib/db";
import { headers } from "next/headers";
import { whopSdk } from "../whop-sdk";
import { appendCredits } from "./append-credits";
import { sendWebsocketMessage } from "./send-websocket-message";

export async function createFreeCredits() {
	const { userId } = await whopSdk.verifyUserToken(await headers());

	if (userId !== "user_v9KUoZvTGp6ID") return;

	const credits = await db.transaction((tx) => appendCredits(userId, 10, tx));

	await sendWebsocketMessage(
		{ user: userId },
		{ type: "credits", data: credits },
	);
}
