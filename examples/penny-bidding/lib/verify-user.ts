import { headers } from "next/headers";
import { cache } from "react";
import { SafeError } from "./server-action-errors";
import { verifyUserToken, whopApi } from "./whop-api";

type MaybePromise<T> = T | Promise<T>;

export async function verifyUser(
	minLevel: "admin" | "customer",
	paramsPromise: MaybePromise<{ experienceId: string }>,
) {
	const [headersList, params] = await Promise.all([headers(), paramsPromise]);
	const { userId } = await verifyUserToken(headersList).catch(() => {
		throw new SafeError("Failed to verify user token. Please refresh.");
	});

	const user = await cachedHasAccessToExperience(userId, params.experienceId);

	if (minLevel === "admin" && user.accessLevel !== "admin") {
		throw new SafeError("You need to be an admin to do this.");
	}

	if (minLevel === "customer" && user.accessLevel === "no_access") {
		throw new SafeError("You need to be a customer or admin to do this.");
	}

	return {
		userId,
		accessLevel: user.accessLevel,
		experienceId: params.experienceId,
	};
}

const cachedHasAccessToExperience = cache(
	async (userId: string, experienceId: string) => {
		return whopApi.checkIfUserHasAccessToExperience({
			userId,
			experienceId,
		});
	},
);
