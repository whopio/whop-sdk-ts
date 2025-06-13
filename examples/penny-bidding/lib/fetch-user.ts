"use server";

import { cache } from "react";
import { whopApi } from "./whop-api";

export const fetchUser = cache(async (userId: string) => {
	const publicUser = await whopApi.getUser(
		{ userId },
		{
			next: { revalidate: 300 },
		},
	);
	return publicUser;
});
