import { UserCreditBalance } from "@/components/credit-balance";
import { ListingGrid } from "@/components/listing-grid";
import { Button } from "@/components/ui/button";
import { verifyUser } from "@/lib/verify-user";
import Link from "next/link";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { accessLevel, userId, experienceId } = await verifyUser(
		"customer",
		params,
	);

	return (
		<>
			{/* Header with admin controls */}
			<div className="flex justify-between items-center">
				<UserCreditBalance experienceId={experienceId} />
				<div className="space-x-4">
					{accessLevel === "admin" && (
						<Button asChild>
							<Link href={`/experiences/${experienceId}/create`}>
								Create New Listing
							</Link>
						</Button>
					)}
				</div>
			</div>

			<ListingGrid
				experienceId={experienceId}
				emptyMessage={
					accessLevel === "admin"
						? "No active listings yet, create one in the top right to get started"
						: "Wait for the creator to create a new listing"
				}
				currentUserId={userId}
				isAdmin={accessLevel === "admin"}
			/>
		</>
	);
}
