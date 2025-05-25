import type { Stroke } from "@/components/drawing-types";

// Padding around the drawing (in pixels)
const EXPORT_PADDING = 50;

// Default background color
const DEFAULT_BACKGROUND = "#ffffff";

// Default resolution (dots per pixel) for export
const DEFAULT_RESOLUTION = 2;

/**
 * Creates a downloadable image from a set of strokes
 *
 * @param strokes - The strokes to render
 * @param options - Configuration options for the export
 * @returns A Promise that resolves with the data URL of the exported image
 */
export async function createDownloadableImage(
  strokes: Stroke[],
  options: {
    filename?: string;
    backgroundColor?: string;
    resolution?: number;
    format?: "png" | "jpeg";
    quality?: number;
  } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Default options
      const {
        backgroundColor = DEFAULT_BACKGROUND,
        resolution = DEFAULT_RESOLUTION,
        format = "png",
        quality = 0.95,
      } = options;

      // Create a temporary canvas for rendering
      const canvas = document.createElement("canvas");

      // Set initial dimensions (even before calculating bounds)
      canvas.width = 400;
      canvas.height = 300;

      const ctx = canvas.getContext("2d", {
        alpha: false, // Disable alpha channel for better performance
        willReadFrequently: true, // Optimize for reading pixel data
      });

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Start with a solid background to avoid transparency issues
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // If no strokes, create a simple placeholder
      if (!strokes.length) {
        ctx.fillStyle = "#333";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "No drawing content available",
          canvas.width / 2,
          canvas.height / 2
        );
        const emptyDataUrl = canvas.toDataURL(
          format === "png" ? "image/png" : "image/jpeg",
          quality
        );
        resolve(emptyDataUrl);
        return;
      }

      // Calculate bounds of the drawing
      const bounds = calculateBounds(strokes);
      if (!bounds) {
        // Create a fallback image
        ctx.fillStyle = "#333";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Unable to determine drawing bounds",
          canvas.width / 2,
          canvas.height / 2
        );
        const fallbackDataUrl = canvas.toDataURL(
          format === "png" ? "image/png" : "image/jpeg",
          quality
        );
        resolve(fallbackDataUrl);
        return;
      }

      // Add padding to the drawing bounds
      const width = Math.max(bounds.width + EXPORT_PADDING * 2, 100);
      const height = Math.max(bounds.height + EXPORT_PADDING * 2, 100);

      // Resize canvas to the appropriate dimensions with resolution factor
      canvas.width = width * resolution;
      canvas.height = height * resolution;

      // Get fresh context after resize (resize can reset context)
      const resizedCtx = canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: true,
      });

      if (!resizedCtx) {
        throw new Error("Failed to get canvas context after resize");
      }

      // Clear canvas and fill background
      resizedCtx.clearRect(0, 0, canvas.width, canvas.height);
      resizedCtx.fillStyle = backgroundColor;
      resizedCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale everything by the resolution factor
      resizedCtx.scale(resolution, resolution);

      // Enable high quality rendering
      resizedCtx.imageSmoothingEnabled = true;
      resizedCtx.imageSmoothingQuality = "high";

      // Draw all strokes with offset to account for padding and bounds
      try {
        drawStrokes(resizedCtx, strokes, bounds, EXPORT_PADDING);
      } catch (drawErr) {
        console.error("Error drawing strokes:", drawErr);
        // Try fallback rendering if normal rendering fails
        try {
          // Simple fallback rendering without advanced features
          fallbackDrawing(resizedCtx, strokes, bounds, EXPORT_PADDING);
        } catch (fallbackErr) {
          console.error("Fallback drawing also failed:", fallbackErr);
          // Last resort: just render text
          resizedCtx.fillStyle = "#333";
          resizedCtx.font = "20px Arial";
          resizedCtx.fillText("Error rendering drawing", 50, 50);
        }
      }

      // Try to generate data URL immediately first
      try {
        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, quality);

        if (isValidDataUrl(dataUrl)) {
          resolve(dataUrl);
          return;
        }
      } catch (immediateErr) {
        console.warn(
          "Immediate data URL generation failed, trying delayed approach:",
          immediateErr
        );
      }

      // If immediate generation failed, try with delay
      setTimeout(() => {
        try {
          const mimeType = format === "png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(mimeType, quality);

          if (isValidDataUrl(dataUrl)) {
            resolve(dataUrl);
          } else {
            // Last attempt: create a simple canvas with just text
            const fallbackCanvas = document.createElement("canvas");
            fallbackCanvas.width = 400;
            fallbackCanvas.height = 200;

            const fallbackCtx = fallbackCanvas.getContext("2d");
            if (fallbackCtx) {
              fallbackCtx.fillStyle = backgroundColor;
              fallbackCtx.fillRect(0, 0, 400, 200);
              fallbackCtx.fillStyle = "#333";
              fallbackCtx.font = "16px Arial";
              fallbackCtx.textAlign = "center";
              fallbackCtx.textBaseline = "middle";
              fallbackCtx.fillText(
                "Drawing export failed - Please try again",
                200,
                100
              );

              const fallbackUrl = fallbackCanvas.toDataURL("image/png");
              resolve(fallbackUrl);
            } else {
              reject(new Error("Failed to create fallback image"));
            }
          }
        } catch (delayedErr) {
          console.error("Delayed data URL generation failed:", delayedErr);
          reject(delayedErr);
        }
      }, 200);
    } catch (err) {
      console.error("Error in createDownloadableImage:", err);
      reject(err);
    }
  });
}

/**
 * Draw strokes on a canvas with specified bounds and padding
 */
function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  bounds: { minX: number; minY: number },
  padding: number
): void {
  // Draw all strokes with offset to account for padding and bounds
  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return;

    ctx.beginPath();

    // Calculate offset to center the drawing
    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    // Start at the first point
    const firstPoint = stroke.points[0];
    ctx.moveTo(firstPoint.x + offsetX, firstPoint.y + offsetY);

    // Draw lines to all other points
    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      ctx.lineTo(point.x + offsetX, point.y + offsetY);
    }

    // Set stroke styling
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Apply a subtle shadow for better quality
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = 1;

    ctx.stroke();
  });

  // Reset shadow to avoid affecting other elements
  ctx.shadowBlur = 0;
}

/**
 * Simple fallback drawing method without advanced features
 */
function fallbackDrawing(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  bounds: { minX: number; minY: number },
  padding: number
): void {
  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return;

    // Calculate offset
    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    // Use simpler drawing approach
    ctx.beginPath();
    ctx.strokeStyle = stroke.color || "#000000";
    ctx.lineWidth = stroke.width || 1;

    // No shadows or other advanced features
    const firstPoint = stroke.points[0];
    ctx.moveTo(firstPoint.x + offsetX, firstPoint.y + offsetY);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      ctx.lineTo(point.x + offsetX, point.y + offsetY);
    }

    ctx.stroke();
  });
}

/**
 * Check if a data URL is valid
 */
function isValidDataUrl(dataUrl: string): boolean {
  return Boolean(
    dataUrl &&
      dataUrl.length > 100 &&
      dataUrl !== "data:," &&
      !dataUrl.endsWith(",") &&
      dataUrl !== "data:image/png;base64," &&
      dataUrl !== "data:image/jpeg;base64,"
  );
}

/**
 * Downloads an image from a data URL
 */
export function downloadImage(dataUrl: string, filename: string): void {
  // Create a temporary link element
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);

  // Trigger the download
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Export a drawing by ID - fetch from backend and generate downloadable image
 */
export async function exportDrawingById(
  drawingId: string,
  userId: string
): Promise<void> {
  try {
    // Import the Supabase client dynamically to avoid circular dependencies
    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient(userId);

    // Fetch the strokes for this drawing
    const { data: strokesData, error } = await supabase
      .from("strokes")
      .select("stroke_data")
      .eq("drawing_id", drawingId)
      .order("created_at", { ascending: true });

    if (error || !strokesData || strokesData.length === 0) {
      throw new Error("No drawing found with this ID");
    }

    // Extract the stroke data
    const strokes = strokesData.map((row) => row.stroke_data);

    // Create a high-quality export canvas
    const exportCanvas = document.createElement("canvas");
    const exportWidth = 1200;
    const exportHeight = 800;
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;

    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) {
      throw new Error("Could not get export canvas context");
    }

    // Fill with white background
    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, exportWidth, exportHeight);

    // Calculate bounds for the strokes
    const bounds = calculateDrawingBounds(strokes);

    if (bounds) {
      // Calculate dimensions with padding
      const paddingFactor = 0.2; // 20% padding
      const paddingX = bounds.width * paddingFactor;
      const paddingY = bounds.height * paddingFactor;

      // Calculate center of drawing
      const centerX = bounds.minX + bounds.width / 2;
      const centerY = bounds.minY + bounds.height / 2;

      // Calculate ideal zoom to fit the drawing
      const idealZoomX = exportWidth / (bounds.width + paddingX * 2);
      const idealZoomY = exportHeight / (bounds.height + paddingY * 2);
      const idealZoom = Math.min(idealZoomX, idealZoomY, 5); // Cap at reasonable zoom

      // Draw all strokes at the appropriate scale
      exportCtx.save();

      // Center the drawing
      exportCtx.translate(exportWidth / 2, exportHeight / 2);
      exportCtx.scale(idealZoom, idealZoom);
      exportCtx.translate(-centerX, -centerY);

      // Draw the strokes
      strokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;

        exportCtx.beginPath();
        exportCtx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          exportCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }

        exportCtx.strokeStyle = stroke.color;
        exportCtx.lineWidth = stroke.width;
        exportCtx.lineCap = "round";
        exportCtx.lineJoin = "round";
        exportCtx.stroke();
      });

      exportCtx.restore();
    } else {
      // If bounds calculation fails, show an error message
      exportCtx.font = "24px Arial";
      exportCtx.fillStyle = "#000000";
      exportCtx.textAlign = "center";
      exportCtx.fillText(
        "Could not determine drawing bounds",
        exportWidth / 2,
        exportHeight / 2
      );
    }

    // Generate the image
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, ""); // Remove milliseconds

    const shortId = drawingId.substring(0, 8); // Use just first 8 chars of ID
    const filename = `drawing_${shortId}_${timestamp}.png`;

    // Get the data URL from our canvas
    const dataUrl = exportCanvas.toDataURL("image/png", 0.95);

    // Download using the utility function
    downloadImage(dataUrl, filename);
  } catch (error) {
    console.error("Error exporting drawing:", error);
    throw error;
  }
}

/**
 * Helper function to calculate the bounds of a drawing
 */
function calculateDrawingBounds(
  strokes: Array<{ points: Array<{ x: number; y: number }> }>
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} | null {
  if (!strokes.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  strokes.forEach((stroke) => {
    stroke.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  // If we couldn't find valid bounds
  if (
    minX === Infinity ||
    minY === Infinity ||
    maxX === -Infinity ||
    maxY === -Infinity
  ) {
    return null;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return { minX, minY, maxX, maxY, width, height };
}

/**
 * Calculate the bounds of all strokes
 */
function calculateBounds(strokes: Stroke[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} | null {
  if (!strokes.length) return null;

  // Find min/max coordinates across all stroke points
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  strokes.forEach((stroke) => {
    stroke.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  // If we didn't find valid bounds, return null
  if (
    minX === Infinity ||
    minY === Infinity ||
    maxX === -Infinity ||
    maxY === -Infinity
  ) {
    return null;
  }

  const width = Math.max(maxX - minX, 1); // Ensure width is at least 1
  const height = Math.max(maxY - minY, 1); // Ensure height is at least 1

  return { minX, minY, maxX, maxY, width, height };
}

/**
 * Export a drawing by user ID - lookup the drawing ID and export
 */
export async function exportUserDrawing(
  userId: string,
  experienceId: string,
  providedStrokes?: Stroke[]
): Promise<void> {
  // If strokes are provided directly, use them
  if (providedStrokes && providedStrokes.length > 0) {
    try {
      // Generate a default filename - sanitize to remove problematic characters
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, ""); // Remove milliseconds

      const cleanExperienceId = experienceId
        .replace(/[^\w-]/g, "_") // Replace any non-word chars with underscore
        .substring(0, 8); // Limit the length

      const filename = `drawing_${cleanExperienceId}_${timestamp}.png`;

      // Create and download the image directly
      const dataUrl = await createDownloadableImage(providedStrokes, {
        filename,
        backgroundColor: "#ffffff",
        resolution: 2,
        format: "png",
      });

      downloadImage(dataUrl, filename);
      return;
    } catch (err) {
      console.error("Error creating downloadable image:", err);
      throw err;
    }
  }

  // Otherwise, proceed with the database approach
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient(userId);

  try {
    // Find this user's drawing
    const { data: drawing, error: drawingError } = await supabase
      .from("user_drawings")
      .select("id")
      .eq("canvas_id", experienceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (drawingError || !drawing) {
      console.error("Drawing not found", drawingError || "No data returned");
      throw new Error("Drawing not found");
    }

    await exportDrawingById(drawing.id, userId);
  } catch (err) {
    console.error("Error exporting user drawing:", err);
    throw err;
  }
}
