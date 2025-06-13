import { whopApi } from "@/lib/whop-api";
import { Button, Select, TextArea } from "@whop/react/components";

export async function SectionMakeForumPost({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const experience = await whopApi.getExperience({ experienceId });
	const companyId = experience.company.id;
	// user user_v9KUoZvTGp6ID is an admin of the current company.
	const forumExperiences = await whopApi
		.withUser("user_v9KUoZvTGp6ID")
		.listExperiences({
			companyId,
			appId: "app_dYfm2IdXhDMquv",
			onAccessPass: true,
			first: 20,
		});

	async function makeForumPost(formData: FormData) {
		"use server";
		const experienceId = formData.get("experienceId");
		const content = formData.get("content");

		if (
			!experienceId ||
			!content ||
			typeof experienceId !== "string" ||
			typeof content !== "string"
		) {
			throw new Error("Experience ID and content are required");
		}

		console.log(experienceId, content);

		await whopApi
			.withUser("user_v9KUoZvTGp6ID")
			.withCompany(companyId)
			.createForumPost({
				content,
				forumExperienceId: experienceId,
				title: "Created by the SDK",
			});
	}

	return (
		<div>
			<form action={makeForumPost} className="flex gap-2 items-center flex-col">
				<Select.Root>
					<Select.Trigger className="w-full" name="experienceId" />
					<Select.Content>
						{forumExperiences?.experiencesV2.nodes
							?.filter(notEmpty)
							.map((experience) => (
								<Select.Item key={experience.id} value={experience.id}>
									{experience.name} - {experience.id}
								</Select.Item>
							))}
					</Select.Content>
				</Select.Root>
				<TextArea name="content" className="w-full" placeholder="Content" />

				<Button variant="solid" className="w-full" type="submit">
					Make Forum Post
				</Button>
			</form>
		</div>
	);
}

function notEmpty<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}
