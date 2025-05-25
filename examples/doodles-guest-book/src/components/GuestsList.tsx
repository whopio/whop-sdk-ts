"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, Button, HoverCard, Skeleton, Text } from "frosted-ui";
import { Stroke } from "./drawing-types";
import { DrawingPreview } from "./drawing-preview";
import { exportUserDrawing } from "@/utils/drawing-export";

export function GuestsList({
  experienceId,
  userIds,
  onFocus,
  userDrawings,
}: {
  experienceId: string;
  userIds: string[];
  onFocus?: (userId: string) => void;
  userDrawings?: {
    userId: string;
    drawingId: string;
    strokes: Stroke[];
    createdAt?: string;
  }[];
}) {
  if (userIds.length === 0) {
    return <div className="p-5">No guests have submitted drawings yet.</div>;
  }

  return (
    <ul>
      {userIds.map((guest) => {
        // Check if user has drawing data, used for focusing
        const userDrawing = userDrawings?.find(
          (drawing) => drawing.userId === guest
        );
        const hasDrawing = !!userDrawing;

        return (
          <GuestListItem
            key={guest}
            userId={guest}
            experienceId={experienceId}
            onFocus={hasDrawing ? onFocus : undefined}
            userDrawing={userDrawing}
          />
        );
      })}
    </ul>
  );
}

function GuestListItem({
  userId,
  experienceId,
  onFocus,
  userDrawing,
}: {
  userId: string;
  experienceId: string;
  onFocus?: (userId: string) => void;
  userDrawing?: {
    userId: string;
    drawingId: string;
    strokes: Stroke[];
    createdAt?: string;
  };
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<null | {
    username: string;
    name?: string | null;
    id: string;
    profilePicture?: {
      sourceUrl?: string | null;
    } | null;
  }>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        // Import and use the server action to fetch the user profile
        const { fetchPublicUser } = await import("@/app/actions");
        const result = await fetchPublicUser(userId);

        if (result.success && result.data) {
          setUserProfile(result.data);
        } else {
          console.error("Error fetching user profile:", result.error);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [userId]);

  // Handle save drawing button click
  const handleSaveDrawing = useCallback(async () => {
    if (!userDrawing?.strokes?.length) return;

    try {
      setIsSaving(true);
      await exportUserDrawing(userId, experienceId, userDrawing.strokes);
    } catch (error) {
      console.error("Error saving drawing:", error);
      alert("Could not save the drawing. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [userId, experienceId, userDrawing]);

  // Format the timestamp in a readable way
  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) return "";

      // Format: "Jan 1, 2023 at 12:34 PM"
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return "";
    }
  };

  if (!isLoading && !userProfile) return null;

  const handleClick = () => {
    if (onFocus) {
      onFocus(userId);
    }
  };

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <li className="flex w-full">
          <button
            type="button"
            className="px-5 py-3 flex items-center gap-3 hover:bg-gray-a3 w-full"
            onClick={handleClick}
          >
            {!userProfile ? (
              <Skeleton.Avatar size="2" className="rounded-full" />
            ) : (
              <Avatar
                fallback={userProfile.name || userProfile.username}
                size="2"
                src={userProfile.profilePicture?.sourceUrl || undefined}
              />
            )}
            <span className="flex-1 flex flex-col text-start">
              {!userProfile ? (
                <>
                  <Skeleton.Text size="2" className="w-20" />
                  <Skeleton.Text size="1" className="w-16" />
                </>
              ) : (
                <>
                  <Text size="2" weight="medium">
                    {userProfile.name || userProfile.username}
                  </Text>
                  <Text size="1" color="gray">
                    @{userProfile.username}
                  </Text>
                </>
              )}
            </span>
          </button>
        </li>
      </HoverCard.Trigger>
      <HoverCard.Content
        side="left"
        className="p-4 flex flex-col gap-3 dark:bg-black-a9 dark:backdrop-blur-2xl"
      >
        <span className="flex items-center gap-3 justify-between">
          <Text size="3" weight="medium">
            {userProfile?.name || userProfile?.username}
          </Text>
          <Button
            size="1"
            color="gray"
            variant="surface"
            onClick={handleSaveDrawing}
            disabled={!userDrawing?.strokes?.length || isSaving}
            loading={isSaving}
          >
            Download
          </Button>
        </span>
        <DrawingPreview
          userId={userId}
          canvasId={experienceId}
          size={200}
          strokes={userDrawing?.strokes}
          onPreviewClick={() => {
            if (onFocus) {
              onFocus(userId);
            }
          }}
          className="bg-white hover:brightness-90 rounded-md"
        />
        {userDrawing?.createdAt && (
          <Text size="1" color="gray" className="text-start">
            {formatTimestamp(userDrawing.createdAt)}
          </Text>
        )}
      </HoverCard.Content>
    </HoverCard.Root>
  );
}
