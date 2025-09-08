import { whopSdk } from "@/lib/whop-sdk";

export async function SectionGetExperienceDetails({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	// Get details about the experience itself.
	const thisExperience = await whopSdk.experiences.getExperience({
		experienceId: experienceId,
	});

	// Get all the access passes that will give a user access to this experience.
	const { accessPasses } =
		await whopSdk.experiences.listAccessPassesForExperience({
			experienceId: experienceId,
		});

	const payments = await whopSdk.payments.listReceiptsForCompany({
		companyId: thisExperience.company.id,
	});

	return (
		<div>
			Experience ID: <code>{experienceId}</code>
			<pre>{JSON.stringify(thisExperience, null, 2)}</pre>
			<pre>{JSON.stringify(accessPasses, null, 2)}</pre>
			<pre>{JSON.stringify(payments, null, 2)}</pre>
		</div>
	);
}
