import { verifyUserToken, whopApi } from "@/lib/whop-api";
import { headers } from "next/headers";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The experienceId is a path param
	const { experienceId } = await params;

	// The user token is in the headers
	const { userId } = await verifyUserToken(headersList);

	const result = await whopApi.checkIfUserHasAccessToExperience({
		userId,
		experienceId,
	});

	const user = (await whopApi.getUser({ userId })).publicUser;
	const experience = (await whopApi.getExperience({ experienceId })).experience;

	// Either: 'admin' | 'customer' | 'no_access';
	// 'admin' means the user is an admin of the whop, such as an owner or moderator
	// 'customer' means the user is a common member in this whop
	// 'no_access' means the user does not have access to the whop
	const { accessLevel } = result.hasAccessToExperience;

	return (
		<div className="flex justify-center items-center h-screen px-8">
			<h1 className="text-xl">
				Hi <strong>{user.name}</strong>, you{" "}
				<strong>
					{result.hasAccessToExperience.hasAccess ? "have" : "do not have"}{" "}
					access
				</strong>{" "}
				to this experience. Your access level to this whop is:{" "}
				<strong>{accessLevel}</strong>. <br />
				<br />
				Your user ID is <strong>{userId}</strong> and your username is{" "}
				<strong>@{user.username}</strong>.<br />
				<br />
				You are viewing the experience: <strong>{experience.name}</strong>
			</h1>
		</div>
	);
}
