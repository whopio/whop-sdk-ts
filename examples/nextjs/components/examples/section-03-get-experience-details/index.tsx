import { whopSdk } from "@/lib/whop-sdk";

export async function SectionGetExperienceDetails({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	const thisExperience = await whopSdk.experiences.getExperience({
		experienceId: experienceId,
	});

	return (
		<div>
			Experience ID: <code>{experienceId}</code>
			<pre>{JSON.stringify(thisExperience, null, 2)}</pre>
		</div>
	);
}
