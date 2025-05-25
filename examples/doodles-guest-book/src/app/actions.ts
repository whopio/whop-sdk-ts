"use server";

import { whopApi } from "../../lib/whop-api";

// Define type for the server action responses
interface ServerActionResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Define the PublicUser type based on the API response structure
interface PublicUser {
  username: string;
  name?: string | null;
  id: string;
  profilePicture?: {
    sourceUrl?: string | null | undefined;
  } | null;
  // Add any other fields that might be in the user profile
}

/**
 * Server action to fetch public user data
 */
export async function fetchPublicUser(
  userId: string
): Promise<ServerActionResult<PublicUser>> {
  try {
    const profile = await whopApi.GetPublicUser({ userId });
    return {
      success: true,
      data: profile.publicUser,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      data: null,
      error: "Failed to fetch user data",
    };
  }
}

// Server action to create a forum post with drawing in attachment
export async function createForumPost(
  experienceId: string,
  directUploadId: string,
  userId: string
) {
  try {
    // Finds or creates a forum with the name "Guest Book"
    const forum = await whopApi.CreateOrFindExistingForum({
      input: {
        name: "Guest Book",
        experienceId,
        whoCanPost: "admins",
      },
    });

    const experience = await whopApi.GetExperience({
      experienceId,
    });

    const companyId = experience.experience?.company.id;

    const {
      publicUser: { username },
    } = await whopApi.GetPublicUser({
      userId,
    });

    const post = await whopApi.CreateForumPost({
      input: {
        forumExperienceId: forum.createForum?.id,
        title: "New Doodle in the Guest Book! 📘",
        content: `@${username} left a drawing. 😍 \n\n Add yours here:\nhttps://whop.com/${companyId}/${experienceId}/app`,
        attachments: [
          {
            directUploadId,
          },
        ],
      },
    });

    return {
      success: true,
      data: post,
      error: null,
    };
  } catch (error) {
    console.error("Error creating forum post:", error);
    return {
      success: false,
      data: null,
      error: "Failed to create forum post",
    };
  }
}

// Upload attachment to Whop
export async function uploadAttachment(file: File) {
  try {
    const attachment = await whopApi.UploadAttachment({
      file,
      record: "forum_post",
    });
    return {
      success: true,
      data: attachment.directUploadId,
    };
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return {
      success: false,
      data: null,
    };
  }
}
