import { whopSdk } from "@/lib/whop-sdk";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";

const prisma = new PrismaClient();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ experienceId: string }> },
) {
	try {
		const { experienceId } = await params;

		if (!experienceId) {
			return NextResponse.json(
				{ error: "Missing experienceId" },
				{ status: 400 },
			);
		}

		const headersList = await headers();
		const userToken = await whopSdk.verifyUserToken(headersList);
		if (!userToken) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const hasAccess = await whopSdk.access.checkIfUserHasAccessToExperience({
			userId: userToken.userId,
			experienceId,
		});

		if (!hasAccess.hasAccess) {
			return NextResponse.json(
				{ error: "Unauthorized, no access" },
				{ status: 401 },
			);
		}

		const [publicUser, experience] = await Promise.all([
			whopSdk.users.getUser({
				userId: userToken.userId,
			}),
			prisma.experience.findUnique({
				where: {
					id: experienceId,
				},
			}),
		]);

		if (!request.body || !experience?.prompt) {
			return NextResponse.json(
				{ error: "Image and prompt are required" },
				{ status: 400 },
			);
		}

		const originalFile = new File(
			[
				await sharp(await request.clone().arrayBuffer())
					.png()
					.toBuffer(),
			],
			`${Date.now()}-original.png`,
			{
				type: "image/png",
			},
		);

		// Generate image using DALL-E with prompt
		const response = await openai.images.edit({
			model: "gpt-image-1",
			image: originalFile,
			prompt: experience.prompt,
			n: 1,
			size: "auto",
			quality: "low",
		});

		console.log("Response:", response);

		// Get the base64 image data from the response
		const base64Image = response.data?.[0]?.b64_json;
		if (!base64Image) {
			throw new Error("No image data returned from OpenAI");
		}
		const generatedImageBuffer = Buffer.from(base64Image, "base64");

		const generationId = crypto.randomUUID();

		const [originalFileUploadResponse, uploadResponse] = await Promise.all([
			whopSdk.attachments.uploadAttachment({
				file: originalFile,
				record: "forum_post",
			}),
			whopSdk.attachments.uploadAttachment({
				file: new File(
					[generatedImageBuffer],
					`${generationId}-generated.png`,
					{
						type: "image/png",
					},
				),
				record: "forum_post",
			}),
		]);

		const whopExperience = await whopSdk.experiences.getExperience({
			experienceId,
		});
		const companyId = whopExperience.company.id;

		const generatedAttachmentId = uploadResponse.directUploadId;
		const originalAttachmentId = originalFileUploadResponse.directUploadId;

		const forum = await whopSdk.forums.findOrCreateForum({
			experienceId: experience.id,
			name: "AI Uploads",
		});

		const forumId = forum?.id;
		if (!forumId) {
			throw new Error("Failed to find or create forum");
		}

		const post = await whopSdk.forums.createForumPost({
			forumExperienceId: forumId,
			content: `@${publicUser?.username} generated this image with the prompt: "${experience.prompt}"\n\nTry it yourself here: https://whop.com/hub/${companyId}/${experience.id}/app\n\nBefore vs After ⬇️`,
			attachments: [
				{ directUploadId: originalAttachmentId },
				{ directUploadId: generatedAttachmentId },
			],
		});

		return NextResponse.json({
			success: true,
			imageUrl: uploadResponse.attachment.source.url,
			postId: post?.id,
		});
	} catch (error) {
		console.error("Error generating image:", error);
		return NextResponse.json(
			{ error: "Failed to generate image" },
			{ status: 500 },
		);
	}
}
