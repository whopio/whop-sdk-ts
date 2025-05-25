"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Stroke } from "./drawing-types";

// Padding around the drawing in the preview (in pixels)
const PREVIEW_PADDING = 10;

interface DrawingPreviewProps {
  userId: string;
  className?: string;
  size?: number;
  canvasId: string;
  onPreviewClick?: (strokes: Stroke[]) => void;
  strokes?: Stroke[];
}

export function DrawingPreview({
  userId,
  className = "",
  size = 100,
  canvasId,
  onPreviewClick,
  strokes = [],
}: DrawingPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Unique identity based on userId and canvasId
  const instanceId = `${userId || "none"}-${canvasId}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    // Handle empty strokes array
    if (!strokes || strokes.length === 0) {
      // Set the canvas size with pixel ratio adjustment
      canvas.width = size * dpr;
      canvas.height = size * dpr;

      // Scale all drawing operations
      ctx.scale(dpr, dpr);

      // Use CSS to keep the visible size the same
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      ctx.clearRect(0, 0, size, size);

      // Draw "No drawing" text
      ctx.fillStyle = "#666";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No drawing found", size / 2, size / 2);
      return;
    }

    // Calculate bounds of all strokes
    const bounds = calculateBounds(strokes);

    // If there are no strokes or invalid bounds, use default size
    if (!bounds) {
      // Set the canvas size with pixel ratio adjustment
      canvas.width = size * dpr;
      canvas.height = size * dpr;

      // Scale all drawing operations
      ctx.scale(dpr, dpr);

      // Use CSS to keep the visible size the same
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      ctx.clearRect(0, 0, size, size);

      // Draw "Invalid drawing" text
      ctx.fillStyle = "#666";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Invalid drawing", size / 2, size / 2);
      return;
    }

    // Set the canvas size with pixel ratio adjustment
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Scale all drawing operations
    ctx.scale(dpr, dpr);

    // Use CSS to keep the visible size the same
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw strokes with offset and scale to account for bounds
    drawStrokes(ctx, strokes, bounds, size, size);
  }, [strokes, size]);

  // Handler for when the preview is clicked
  const handlePreviewClick = useCallback(() => {
    if (onPreviewClick && strokes.length > 0) {
      console.log("Preview clicked with strokes:", strokes.length);
      onPreviewClick(strokes);
    } else {
      console.log("Preview clicked but no strokes or callback available:", {
        hasCallback: !!onPreviewClick,
        strokeCount: strokes.length,
      });
    }
  }, [onPreviewClick, strokes]);

  return (
    <canvas
      key={instanceId}
      ref={canvasRef}
      className={`preview-canvas ${className} ${
        onPreviewClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
      style={{
        width: size,
        height: size,
        aspectRatio: "1/1",
      }}
      onClick={handlePreviewClick}
    />
  );
}

// Calculate the bounds of all strokes
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

  const width = maxX - minX;
  const height = maxY - minY;

  return { minX, minY, maxX, maxY, width, height };
}

// Draw strokes on the canvas, adjusting for bounds and scaling
function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  bounds: { minX: number; minY: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number
) {
  // Calculate scale factor to fit drawing in canvas
  const contentWidth = canvasWidth - PREVIEW_PADDING * 2;
  const contentHeight = canvasHeight - PREVIEW_PADDING * 2;

  const scaleX = contentWidth / bounds.width;
  const scaleY = contentHeight / bounds.height;

  // Use the same scale for both dimensions to preserve aspect ratio
  const scale = Math.min(scaleX, scaleY);

  // Calculate centering offset if there's extra space
  const offsetX = (canvasWidth - bounds.width * scale) / 2;
  const offsetY = (canvasHeight - bounds.height * scale) / 2;

  // Draw all strokes
  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return;

    ctx.beginPath();

    // Move to the first point with the offset to account for bounds and scaling
    const firstPoint = stroke.points[0];
    ctx.moveTo(
      offsetX + (firstPoint.x - bounds.minX) * scale,
      offsetY + (firstPoint.y - bounds.minY) * scale
    );

    // Draw lines to all other points
    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      ctx.lineTo(
        offsetX + (point.x - bounds.minX) * scale,
        offsetY + (point.y - bounds.minY) * scale
      );
    }

    // Set stroke styles - scale the line width to match the overall scale
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = Math.max(1, stroke.width * scale * 0.8); // Scale width but ensure minimum visibility
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  });
}
