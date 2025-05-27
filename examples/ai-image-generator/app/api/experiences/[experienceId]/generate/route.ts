import { verifyUserToken, whopApi } from "@/lib/whop-api";
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
		const userToken = await verifyUserToken(headersList);
		if (!userToken) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const hasAccess = await whopApi.checkIfUserHasAccessToExperience({
			userId: userToken.userId,
			experienceId,
		});

		if (!hasAccess.hasAccessToExperience.hasAccess) {
			return NextResponse.json(
				{ error: "Unauthorized, no access" },
				{ status: 401 },
			);
		}

		const publicUser = await whopApi.getUser({
			userId: userToken.userId,
		});

		const { image } = await request.json();

		const experience = await prisma.experience.findUnique({
			where: {
				id: experienceId,
			},
		});

		if (!image || !experience?.prompt) {
			return NextResponse.json(
				{ error: "Image and prompt are required" },
				{ status: 400 },
			);
		}

		// Extract image format from base64 string
		const matches = image.match(/^data:image\/([a-zA-Z]+);base64,/);
		if (!matches || !matches[1]) {
			return NextResponse.json(
				{ error: "Invalid image format" },
				{ status: 400 },
			);
		}
		const imageFormat = matches[1];

		// Convert base64 to buffer
		const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
		const imageBuffer = Buffer.from(base64Data, "base64");

		// Log original image information
		console.log("Original Image Format:", imageFormat);
		console.log("Original Buffer Size:", imageBuffer.length, "bytes");

		// Convert to PNG using sharp
		const pngBuffer = await sharp(imageBuffer).png().toBuffer();

		console.log("PNG Buffer Size:", pngBuffer.length, "bytes");

		// Create a File object from the PNG buffer
		const originalFile = new File([pngBuffer], `${Date.now()}-original.png`, {
			type: "image/png",
		});

		// Log File object information
		console.log("File Size:", originalFile.size, "bytes");
		console.log("File Type:", originalFile.type);
		console.log("File Name:", originalFile.name);

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

		const originalFileUploadResponse = await whopApi.uploadAttachment({
			file: originalFile,
			record: "forum_post",
		});

		const uploadResponse = await whopApi.uploadAttachment({
			file: new File(
				[generatedImageBuffer],
				`creator-app-generated-${Date.now()}.png`,
				{
					type: "image/png",
				},
			),
			record: "forum_post",
		});

		const generatedAttachmentId = uploadResponse.directUploadId;
		const originalAttachmentId = originalFileUploadResponse.directUploadId;

		const forum = await whopApi.findOrCreateForum({
			input: { experienceId: experience.id, name: "AI Uploads" },
		});

		const forumId = forum.createForum?.id;

		const post = await whopApi.createForumPost({
			input: {
				forumExperienceId: forumId,
				content: `@${publicUser.publicUser?.username} generated this image with the prompt: "${experience.prompt}"\n\nTry it yourself here: https://whop.com/${experience.companyId}/${experience.id}/app\n\nBefore vs After ⬇️`,
				attachments: [
					{ directUploadId: originalAttachmentId },
					{ directUploadId: generatedAttachmentId },
				],
			},
		});

		// Convert base64 to data URL for the response
		const imageUrl = `data:image/png;base64,${base64Image}`;

		return NextResponse.json({
			success: true,
			imageUrl,
			postId: post.createForumPost?.id,
		});
	} catch (error) {
		console.error("Error generating image:", error);
		return NextResponse.json(
			{ error: "Failed to generate image" },
			{ status: 500 },
		);
	}
}
