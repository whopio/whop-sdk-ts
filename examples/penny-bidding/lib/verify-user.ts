import { headers } from "next/headers";
import { cache } from "react";
import { verifyUserToken, whopApi } from "./whop-api";

type MaybePromise<T> = T | Promise<T>;

export async function verifyUser(
	minLevel: "admin" | "customer",
	paramsPromise: MaybePromise<{ experienceId: string }>,
) {
	const [headersList, params] = await Promise.all([headers(), paramsPromise]);
	const { userId } = await verifyUserToken(headersList);

	const user = await cachedHasAccessToExperience(userId, params.experienceId);

	if (minLevel === "admin" && user.accessLevel !== "admin") {
		throw new Error("You need to be an admin to do this.");
	}

	if (minLevel === "customer" && user.accessLevel === "no_access") {
		throw new Error("You need to be a customer to do this.");
	}

	return {
		userId,
		accessLevel: user.accessLevel,
		experienceId: params.experienceId,
	};
}

const cachedHasAccessToExperience = cache(
	async (userId: string, experienceId: string) => {
		const { hasAccessToExperience: user } =
			await whopApi.checkIfUserHasAccessToExperience({
				userId,
				experienceId,
			});
		return user;
	},
);
