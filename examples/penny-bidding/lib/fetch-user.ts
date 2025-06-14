"use server";

import { cache } from "react";
import { whopSdk } from "./whop-sdk";

export const fetchUser = cache(async (userId: string) => {
	const publicUser = await whopSdk.users.getUser(
		{ userId },
		{
			next: { revalidate: 300 },
		},
	);
	return publicUser;
});
