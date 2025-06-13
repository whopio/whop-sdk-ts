import ExperiencePrompt from "@/components/experience-prompt";
import { whopApi } from "@/lib/whop-api";
import { PrismaClient } from "@prisma/client";
import { verifyUserToken } from "@whop/api";
import { headers } from "next/headers";

const prisma = new PrismaClient();

async function findOrCreateExperience(experienceId: string) {
	let experience = await prisma.experience.findUnique({
		where: { id: experienceId },
	});

	if (!experience) {
		experience = await prisma.experience.create({
			data: {
				id: experienceId,
				prompt: "",
			},
		});
	}

	return experience;
}

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const headersList = await headers();
	const { userId } = await verifyUserToken(headersList);

	const { experienceId } = await params;
	const experience = await findOrCreateExperience(experienceId);

	const hasAccess = await whopApi.checkIfUserHasAccessToExperience({
		userId,
		experienceId,
	});

	return (
		<div className="flex flex-col gap-4 p-4 h-screen items-center justify-center">
			<ExperiencePrompt
				prompt={experience.prompt}
				accessLevel={hasAccess.accessLevel}
				experienceId={experienceId}
			/>
		</div>
	);
}
