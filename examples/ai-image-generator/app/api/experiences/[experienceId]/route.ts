import { verifyUserToken, whopApi } from "@/lib/whop-api";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ experienceId: string }> },
) {
	try {
		const { experienceId } = await params;
		const { prompt } = await request.json();
		const headersList = await headers();
		const userToken = await verifyUserToken(headersList);
		if (!userToken) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!experienceId) {
			return NextResponse.json(
				{ error: "Missing experienceId" },
				{ status: 400 },
			);
		}

		const hasAccess = await whopApi.checkIfUserHasAccessToExperience({
			userId: userToken.userId,
			experienceId,
		});
		if (hasAccess.accessLevel !== "admin") {
			return NextResponse.json(
				{ error: "Unauthorized, not admin" },
				{ status: 401 },
			);
		}

		const updatedExperience = await prisma.experience.update({
			where: {
				id: experienceId,
			},
			data: {
				prompt,
			},
		});

		await whopApi.sendPushNotification({
			content: prompt,
			experienceId,
			title: "Prompt updated ✨",
		});

		return NextResponse.json(updatedExperience);
	} catch (error) {
		console.error("Error updating experience:", error);
		return NextResponse.json(
			{ error: "Failed to update experience" },
			{ status: 500 },
		);
	}
}
