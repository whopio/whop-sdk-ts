import EditExperiencePrompt from "@/components/edit-experience-prompt";

export default async function Page({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	return <EditExperiencePrompt experienceId={experienceId} />;
}
