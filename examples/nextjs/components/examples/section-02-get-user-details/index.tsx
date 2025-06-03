import { verifyUserToken, whopApi } from "@/lib/whop-api";
import { headers } from "next/headers";
import Image from "next/image";
import { OpenWhopUserProfile } from "./index.client";

export async function SectionGetUserDetails() {
	const requestHeaders = await headers();
	const userTokenData = await verifyUserToken(requestHeaders);

	if (!userTokenData) {
		return <div className="text-red-500">Invalid or missing user token</div>;
	}

	const user = (
		await whopApi.getUser({
			userId: userTokenData.userId,
		})
	).publicUser;

	const agentUser = (await whopApi.getCurrentUser()).viewer.user;

	return (
		<div className="p-2 max-w-xl">
			<div className="flex flex-col gap-4">
				<ProfileDisplay user={user} />
				<ProfileDisplay user={agentUser} />
			</div>
		</div>
	);
}

function ProfileDisplay({
	user,
}: {
	user: {
		banner?: {
			url?: string | null;
		} | null;
		profilePicture?: {
			url?: string | null;
		} | null;
		name?: string | null;
		username: string;
		bio?: string | null;
		createdAt: number;
		id: string;
		email?: string | null;
	};
}) {
	return (
		<div className="bg-white rounded-xl shadow-lg overflow-hidden">
			{/* Banner Image */}
			{user.banner?.url && (
				<div className="relative h-32 w-full">
					<Image
						src={user.banner.url}
						alt="User banner"
						fill
						className="object-cover"
					/>
				</div>
			)}

			<div className="p-4">
				{/* Profile Picture and Name */}
				<div className="flex items-center space-x-4">
					{user.profilePicture?.url && (
						<div className="relative h-16 w-16 rounded-full overflow-hidden">
							<Image
								src={user.profilePicture.url}
								alt={user.name ?? ""}
								fill
								className="object-cover"
							/>
						</div>
					)}
					<div>
						<h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
						<p className="text-gray-600 font-mono">@{user.username}</p>
					</div>
				</div>

				{/* Bio */}
				{user.bio && <p className="mt-2 text-gray-700">{user.bio}</p>}

				{/* Additional Info */}
				<div className="mt-2 text-sm text-gray-500">
					<p>
						Member since {new Date(user.createdAt * 1000).toLocaleDateString()}
					</p>
					<p>User ID: {user.id}</p>
					{user.email && <p>Email: {user.email}</p>}
				</div>

				<OpenWhopUserProfile username={user.username} />
			</div>
		</div>
	);
}
