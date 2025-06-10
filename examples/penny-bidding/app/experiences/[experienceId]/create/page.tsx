import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createListing } from "@/lib/actions/create-listing";
import { verifyUser } from "@/lib/verify-user";
import Link from "next/link";
import { SubmitButton } from "./page.client";

export default async function CreateListingPage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	await verifyUser("admin", params);
	const { experienceId } = await params;

	return (
		<div className="max-w-2xl mx-auto p-6">
			<Card>
				<CardHeader>
					<CardTitle>Create New Listing</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={createListing} className="space-y-6">
						<input type="hidden" name="experienceId" value={experienceId} />

						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								name="title"
								required
								placeholder="Enter listing title"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								required
								rows={4}
								placeholder="Enter listing description"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="durationMinutes">Duration in minutes</Label>
							<Input
								id="durationMinutes"
								name="durationMinutes"
								required
								type="number"
								min={10}
								defaultValue={60}
								placeholder="Enter duration in minutes"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="fulfillmentQuestion">
								Optional Fulfillment Question
							</Label>
							<Textarea
								id="fulfillmentQuestion"
								name="fulfillmentQuestion"
								rows={4}
								placeholder="Enter fulfillment question (optional)"
							/>
						</div>

						<div className="space-y-2">
							<SubmitButton />

							<Button
								type="button"
								variant="secondary"
								className="w-full"
								asChild
							>
								<Link href={`/experiences/${experienceId}`}>Go back</Link>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
