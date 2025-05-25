"use client";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";
import type { Stroke } from "./drawing-types";
import { DrawingCanvas } from "./drawing-canvas";
import simplify from "simplify-js";
import { balloons } from "balloons-js";

// Modified to only check if a user already has a submitted drawing for a specific experience
async function checkUserHasSubmittedForExperience(
  userId: string,
  experienceId: string
): Promise<boolean> {
  const supabase = createClient(userId);

  const { data, error } = await supabase
    .from("user_drawings")
    .select("id")
    .eq("canvas_id", experienceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // If the error is "No rows found", the user hasn't submitted a drawing yet
    if (error.code === "PGRST116") {
      return false;
    }
    console.error("Error checking if user has submitted:", error);
    return false;
  }

  return !!data;
}

// Function to get user's drawing ID for a specific experience
async function getUserDrawingId(
  userId: string,
  experienceId: string
): Promise<string | null> {
  const supabase = createClient(userId);

  const { data, error } = await supabase
    .from("user_drawings")
    .select("id")
    .eq("canvas_id", experienceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    console.error("Error getting user drawing ID:", error);
    return null;
  }

  return data.id;
}

// Function to delete user's drawing and associated strokes for a specific experience
async function deleteUserDrawing(
  userId: string,
  experienceId: string
): Promise<boolean> {
  const supabase = createClient(userId);

  // Get the drawing ID first
  const drawingId = await getUserDrawingId(userId, experienceId);

  if (!drawingId) {
    console.error("No drawing found to delete");
    return false;
  }

  // Delete the strokes first (foreign key constraint)
  const { error: strokesError } = await supabase
    .from("strokes")
    .delete()
    .eq("drawing_id", drawingId);

  if (strokesError) {
    console.error("Error deleting strokes:", strokesError);
    return false;
  }

  // Then delete the drawing record
  const { error: drawingError } = await supabase
    .from("user_drawings")
    .delete()
    .eq("id", drawingId);

  if (drawingError) {
    console.error("Error deleting drawing:", drawingError);
    return false;
  }

  return true;
}

async function submitDrawing(
  userId: string,
  experienceId: string,
  strokes: Stroke[]
) {
  const supabase = createClient(userId);

  // 1. Insert user_drawings row (without strokes)
  const { data: drawingData, error: drawingError } = await supabase
    .from("user_drawings")
    .insert({
      user_id: userId,
      canvas_id: experienceId,
    })
    .select() // get inserted row(s)
    .single();

  if (drawingError || !drawingData) {
    console.error("Error inserting drawing:", drawingError);
    return false;
  }

  const drawingId = drawingData.id;

  // 2. Insert all strokes referencing the drawing_id
  const strokesToInsert = strokes.map((stroke) => ({
    drawing_id: drawingId,
    user_id: userId,
    stroke_data: stroke,
  }));

  const { error: strokesError } = await supabase
    .from("strokes")
    .insert(strokesToInsert);

  if (strokesError) {
    console.error("Error inserting strokes:", strokesError);
    return false;
  }

  return true;
}

export function Canvas({
  userId,
  userProfile /* eslint-disable-line @typescript-eslint/no-unused-vars */,
  experienceId,
}: {
  userId: string;
  userProfile?: unknown;
  experienceId: string;
}) {
  const supabase = createClient(userId);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
  const [userStrokes, setUserStrokes] = useState<Stroke[]>([]);
  // New state to track redo history
  const [redoHistory, setRedoHistory] = useState<Stroke[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"drawing" | "viewing">("drawing");
  const [isActivelyDrawing, setIsActivelyDrawing] = useState(false);
  const [guestUserIds, setGuestUserIds] = useState<string[]>([]);
  // New state to store user drawings with their strokes
  const [guestUserDrawings, setGuestUserDrawings] = useState<
    {
      userId: string;
      drawingId: string;
      strokes: Stroke[];
    }[]
  >([]);

  // Function to fetch all strokes from all users
  const fetchAllStrokes = useCallback(async () => {
    try {
      // Skip fetching if user is actively drawing to prevent flicker
      if (isActivelyDrawing && !hasSubmitted) return;

      const { data: drawings, error: drawingsError } = await supabase
        .from("user_drawings")
        .select("id, user_id, created_at")
        .eq("canvas_id", experienceId);

      if (drawingsError) {
        console.error("Error fetching drawings:", drawingsError);
        return;
      }

      const drawingIds = drawings?.map((d) => d.id) ?? [];

      // Extract unique user IDs from the drawings data
      const uniqueUserIds = [...new Set(drawings?.map((d) => d.user_id) || [])];
      setGuestUserIds(uniqueUserIds);

      if (drawingIds.length === 0) {
        setAllStrokes([]);
        setGuestUserDrawings([]);
        return;
      }

      const { data: strokesData, error: strokesError } = await supabase
        .from("strokes")
        .select("stroke_data, drawing_id")
        .in("drawing_id", drawingIds)
        .order("created_at", { ascending: true });

      if (strokesError) {
        console.error("Error fetching strokes:", strokesError);
        return;
      }

      // Set all strokes
      setAllStrokes(strokesData.map((row) => row.stroke_data));

      // Organize strokes by drawing ID
      const strokesByDrawing = strokesData.reduce((acc, row) => {
        if (!acc[row.drawing_id]) {
          acc[row.drawing_id] = [];
        }
        acc[row.drawing_id].push(row.stroke_data);
        return acc;
      }, {} as Record<string, Stroke[]>);

      // Create the guest user drawings array
      const userDrawings = drawings
        .map((drawing) => ({
          userId: drawing.user_id,
          drawingId: drawing.id,
          strokes: strokesByDrawing[drawing.id] || [],
          createdAt: drawing.created_at,
        }))
        .filter((drawing) => drawing.strokes.length > 0);

      setGuestUserDrawings(userDrawings);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, isActivelyDrawing, hasSubmitted, experienceId]);

  // Check if user has already submitted a drawing
  useEffect(() => {
    async function checkSubmissionStatus() {
      const submitted = await checkUserHasSubmittedForExperience(
        userId,
        experienceId
      );
      setHasSubmitted(submitted);

      // If the user has already submitted, set view mode to viewing
      if (submitted) {
        setViewMode("viewing");

        // Just fetch all strokes
        await fetchAllStrokes();
      } else {
        setViewMode("drawing");
      }
    }

    checkSubmissionStatus();
  }, [userId, fetchAllStrokes, experienceId]);

  // Initial fetch and polling setup
  useEffect(() => {
    // Initial fetch of all drawings from all users
    fetchAllStrokes();

    // Setup polling only for all strokes - local strokes are managed in state
    const interval = setInterval(() => {
      // Only poll if not actively drawing
      if (!isActivelyDrawing || hasSubmitted) {
        fetchAllStrokes();
      }
    }, 3000); // poll every 3 seconds

    // Cleanup polling interval
    return () => clearInterval(interval);
  }, [fetchAllStrokes, isActivelyDrawing, hasSubmitted]);

  // Handle adding a stroke (keeps it in memory only)
  const onAddStroke = useCallback(
    async (stroke: Stroke) => {
      // Don't allow adding strokes if user has already submitted
      if (hasSubmitted || isSubmitting) return;

      // Check if the stroke is from the redo history
      const isRedoStroke =
        redoHistory.length > 0 &&
        JSON.stringify(redoHistory[redoHistory.length - 1]) ===
          JSON.stringify(stroke);

      // Simplify the stroke to reduce data size
      const simplifiedStroke: Stroke = {
        ...stroke,
        points: simplify(stroke.points, 1, true),
      };

      // Add to local state only (don't save to database yet)
      setUserStrokes((prevStrokes) => [...prevStrokes, simplifiedStroke]);

      // If this is a new stroke (not from redo), clear the redo history
      if (!isRedoStroke) {
        setRedoHistory([]);
      } else {
        // If it is a redo stroke, remove it from redo history
        setRedoHistory((prev) => prev.slice(0, -1));
      }
    },
    [hasSubmitted, isSubmitting, redoHistory]
  );

  // Handle undo operation
  const handleUndo = useCallback(() => {
    if (userStrokes.length === 0) return;

    // Get the last stroke
    const lastStroke = userStrokes[userStrokes.length - 1];

    // Remove it from userStrokes
    setUserStrokes((prev) => prev.slice(0, -1));

    // Add it to redo history
    setRedoHistory((prev) => [...prev, lastStroke]);
  }, [userStrokes]);

  // Handle redo operation
  const handleRedo = useCallback(() => {
    if (redoHistory.length === 0) return;

    // Get the last undone stroke
    const redoStroke = redoHistory[redoHistory.length - 1];

    // Add it back to userStrokes
    setUserStrokes((prev) => [...prev, redoStroke]);

    // Remove it from redo history
    setRedoHistory((prev) => prev.slice(0, -1));
  }, [redoHistory]);

  // Clear strokes from memory
  const onClearStrokes = useCallback(() => {
    // Don't allow clearing if user has already submitted
    if (hasSubmitted || isSubmitting) return;

    setUserStrokes([]);
    setRedoHistory([]);
  }, [hasSubmitted, isSubmitting]);

  // Function to submit the drawing
  const handleSubmitDrawing = useCallback(async () => {
    // If user has no strokes, don't allow submission
    if (userStrokes.length === 0) {
      alert("Please draw something before submitting!");
      return;
    }

    // Set submitting state to prevent further drawing during submission
    setIsSubmitting(true);

    try {
      // Submit all strokes at once to the backend
      const success = await submitDrawing(userId, experienceId, userStrokes);

      if (success) {
        balloons();
        // Mark as submitted - this will disable further drawing
        setHasSubmitted(true);

        // Switch to viewing mode
        setViewMode("viewing");

        // Clear the local history stacks
        setRedoHistory([]);

        // Send notification using the server action
        try {
          // We'll dynamically import the server action to avoid bundling issues
          const { uploadAttachment, createForumPost } = await import(
            "@/app/actions"
          );

          // Generate PNG file from user's drawing
          const { createDownloadableImage } = await import(
            "@/utils/drawing-export"
          );

          // Create a high-quality PNG representation of the drawing
          const drawingDataUrl = await createDownloadableImage(userStrokes, {
            backgroundColor: "#ffffff",
            resolution: 2,
            format: "png",
          });

          // Convert the data URL to a File object
          const dataUrlToFile = (dataUrl: string, filename: string): File => {
            const arr = dataUrl.split(",");
            if (arr.length < 2) {
              throw new Error("Invalid data URL");
            }

            const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);

            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }

            return new File([u8arr], filename, { type: mime });
          };

          // Create a File object from the data URL
          const imageFromUsersDrawing = dataUrlToFile(
            drawingDataUrl,
            `drawing-${userId}-${Date.now()}.png`
          );

          const { data: directUploadId } = await uploadAttachment(
            imageFromUsersDrawing
          );

          if (!directUploadId) {
            throw new Error("Failed to upload attachment");
          }

          // Create a forum post with the drawing
          await createForumPost(experienceId, directUploadId, userId);
        } catch (notificationError) {
          console.error("Failed to send notification:", notificationError);
          // This is not critical, so we continue even if notification fails
        }

        // Refresh all strokes to include the submitted drawing
        await fetchAllStrokes();
      } else {
        // If submission failed, allow the user to try again
        alert("Failed to submit drawing. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting drawing:", error);
      alert("An error occurred while submitting your drawing.");
    } finally {
      setIsSubmitting(false);
    }
  }, [userStrokes, userId, experienceId, fetchAllStrokes]);

  // Handle drawing state changes from the canvas component
  const handleDrawingStateChange = useCallback((isDrawing: boolean) => {
    // Update active drawing state to pause polling when drawing
    setIsActivelyDrawing(isDrawing);
  }, []);

  // Function to handle deleting a user's drawing
  const handleDeleteDrawing = useCallback(async () => {
    if (!hasSubmitted) return;

    setIsDeleting(true);

    try {
      const success = await deleteUserDrawing(userId, experienceId);

      if (success) {
        // Switch back to drawing mode
        setHasSubmitted(false);
        setViewMode("drawing");
        setUserStrokes([]);

        // Refresh all strokes to show other users' drawings
        await fetchAllStrokes();
      } else {
        alert("Failed to delete drawing. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting drawing:", error);
      alert("An error occurred while deleting your drawing.");
    } finally {
      setIsDeleting(false);
    }
  }, [hasSubmitted, userId, experienceId, fetchAllStrokes]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        Loading drawing...
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {viewMode === "viewing" ? (
        // When in viewing mode, show all drawings including the user's
        <DrawingCanvas
          onAddStroke={onAddStroke}
          onClearStrokes={onClearStrokes}
          shapes={allStrokes}
          onDrawingStateChange={handleDrawingStateChange}
          isReadOnly={true}
          userId={userId}
          onDeleteDrawing={handleDeleteDrawing}
          isDeleting={isDeleting}
          hasSubmitted={hasSubmitted}
          isSubmitting={isSubmitting}
          userStrokesCount={userStrokes.length}
          experienceId={experienceId}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={userStrokes.length > 0}
          canRedo={redoHistory.length > 0}
          guestUserIds={guestUserIds}
          guestUserDrawings={guestUserDrawings}
        />
      ) : (
        // When in drawing mode, show the canvas with the user's strokes plus all others
        <DrawingCanvas
          onAddStroke={onAddStroke}
          onClearStrokes={onClearStrokes}
          shapes={hasSubmitted ? allStrokes : [...allStrokes, ...userStrokes]}
          onDrawingStateChange={handleDrawingStateChange}
          isReadOnly={isSubmitting}
          hasSubmitted={hasSubmitted}
          isSubmitting={isSubmitting}
          userStrokesCount={userStrokes.length}
          onSubmit={handleSubmitDrawing}
          experienceId={experienceId}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={userStrokes.length > 0}
          canRedo={redoHistory.length > 0}
          guestUserIds={guestUserIds}
          guestUserDrawings={guestUserDrawings}
        />
      )}
    </div>
  );
}
