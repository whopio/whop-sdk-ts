"use client";

import type React from "react";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Stroke } from "./drawing-types";
import {
  Button,
  DropdownMenu,
  IconButton,
  Popover,
  Separator,
  Slider,
  Text,
  Tooltip,
  Drawer,
  Spinner,
} from "frosted-ui";
import { DrawingPreview } from "./drawing-preview";
import { exportUserDrawing } from "@/utils/drawing-export";
import { GuestsList } from "./GuestsList";
import { getRandomColor } from "@/utils/get-random-color";

// Define min and max zoom levels
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;
const ZOOM_STEPS = [0.1, 0.25, 0.5, 1, 2, 3, 4, 5];
const BASE_TOUCHPAD_ZOOM_STEP = 0.08; // Base step that will be scaled

export function DrawingCanvas({
  onAddStroke,
  onClearStrokes,
  shapes,
  onDrawingStateChange,
  isReadOnly = false,
  userId,
  onDeleteDrawing,
  isDeleting = false,
  hasSubmitted = false,
  isSubmitting = false,
  userStrokesCount = 0,
  onSubmit,
  experienceId,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  guestUserIds = [],
  guestUserDrawings = [],
}: {
  onAddStroke: (stroke: Stroke) => Promise<void>;
  onClearStrokes: () => void;
  shapes: Stroke[];
  onDrawingStateChange?: (isDrawing: boolean) => void;
  isReadOnly?: boolean;
  userId?: string;
  onDeleteDrawing?: () => Promise<void>;
  isDeleting?: boolean;
  hasSubmitted?: boolean;
  isSubmitting?: boolean;
  userStrokesCount?: number;
  onSubmit?: () => void;
  experienceId: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  guestUserIds?: string[];
  guestUserDrawings?: {
    userId: string;
    drawingId: string;
    strokes: Stroke[];
    createdAt?: string;
  }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isPanActive, setIsPanActive] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const lastPanPosition = useRef({ x: 0, y: 0 });
  const lastWheelTime = useRef(0);
  const accumulatedDelta = useRef(0);

  const [currentShape, setCurrentShape] = useState<Stroke | null>(null);
  const [color, setColor] = useState(getRandomColor());
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  const lastTouchDistance = useRef<number | null>(null);

  // Set panning mode by default when in read-only mode
  useEffect(() => {
    if (isReadOnly) {
      setIsPanning(true);
    }
  }, [isReadOnly]);

  // Function to redraw all shapes on the canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations (pan and zoom)
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw all saved shapes
    shapes.forEach((shape) => {
      if (shape.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);

      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }

      ctx.strokeStyle = shape.color;
      // Store original shape width - no adjustment needed since we're using scale
      ctx.lineWidth = shape.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    });

    // Restore context
    ctx.restore();
  }, [shapes, panOffset, zoomLevel]);

  // Update canvas size based on container size
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Get the container dimensions
    const rect = container.getBoundingClientRect();
    const newWidth = rect.width;
    const newHeight = rect.height;

    // Only update if size has changed
    if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
      setCanvasSize({ width: newWidth, height: newHeight });

      // Update canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Redraw after resize
      redrawCanvas();
    }
  }, [canvasSize, redrawCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize();
    };

    // Set initial size
    handleResize();

    // Add event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [updateCanvasSize]);

  // Redraw canvas whenever shapes change
  useEffect(() => {
    // Only redraw if canvas is available and has proper dimensions
    if (canvasRef.current && canvasSize.width > 0 && canvasSize.height > 0) {
      redrawCanvas();
    }
  }, [shapes, redrawCanvas, canvasSize]);

  // Add CSS to container on mount to block browser navigation gestures
  useEffect(() => {
    // Block browser navigation gestures at the document level
    document.documentElement.style.overscrollBehavior = "none";

    // Prevent Safari's swipe navigation by manipulating history
    // This creates a dummy history entry that effectively traps navigation attempts
    if (typeof window !== "undefined") {
      // Push current state to make back gesture do nothing
      const originalPushState = history.pushState.bind(history);
      history.pushState = function (
        data: unknown,
        unused: string,
        url?: string | URL | null
      ) {
        try {
          return originalPushState(data, unused, url);
        } catch (e) {
          console.error("History pushState error:", e);
          return undefined;
        }
      };

      // Push a dummy state that we'll return to when back is attempted
      history.pushState({}, "", window.location.pathname);

      // When user swipes back, immediately push them forward again
      const handlePopState = () => {
        history.pushState({}, "", window.location.pathname);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        // Restore default behavior on unmount
        document.documentElement.style.overscrollBehavior = "";
        window.removeEventListener("popstate", handlePopState);
        // Restore original pushState
        history.pushState = originalPushState;
      };
    }

    return () => {
      // Restore default behavior on unmount if window is undefined
      document.documentElement.style.overscrollBehavior = "";
    };
  }, []);

  // Set up additional handlers for horizontal gestures
  useEffect(() => {
    // Function to handle all horizontal touchpad/trackpad gestures
    const preventHorizontalSwipe = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Custom swipe events (these may not be standard but some libraries use them)
    document.addEventListener("swipe", preventHorizontalSwipe, {
      passive: false,
      capture: true,
    });
    document.addEventListener("swipeleft", preventHorizontalSwipe, {
      passive: false,
      capture: true,
    });
    document.addEventListener("swiperight", preventHorizontalSwipe, {
      passive: false,
      capture: true,
    });

    return () => {
      // Remove all event listeners on cleanup
      document.removeEventListener("swipe", preventHorizontalSwipe, {
        capture: true,
      });
      document.removeEventListener("swipeleft", preventHorizontalSwipe, {
        capture: true,
      });
      document.removeEventListener("swiperight", preventHorizontalSwipe, {
        capture: true,
      });
    };
  }, []);

  // Set up handlers for browser navigation swipe gestures
  useEffect(() => {
    // Function to handle navigation swipe gestures only
    const preventSwipeNavigation = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Only prevent browser-level navigation swipe gestures
    // But NOT basic touch interactions
    document.addEventListener("swipe", preventSwipeNavigation, {
      passive: false,
      capture: true,
    });
    document.addEventListener("swipeleft", preventSwipeNavigation, {
      passive: false,
      capture: true,
    });
    document.addEventListener("swiperight", preventSwipeNavigation, {
      passive: false,
      capture: true,
    });

    return () => {
      // Remove event listeners on cleanup
      document.removeEventListener("swipe", preventSwipeNavigation, {
        capture: true,
      });
      document.removeEventListener("swipeleft", preventSwipeNavigation, {
        capture: true,
      });
      document.removeEventListener("swiperight", preventSwipeNavigation, {
        capture: true,
      });
    };
  }, []);

  // Set up non-passive wheel event listener to properly prevent default behavior
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Block navigation gestures at the document level for maximum effectiveness
    const blockBrowserGestures = (e: Event) => {
      // Always prevent default for these events
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        e.stopImmediatePropagation();
      }
      return false;
    };

    // This handler will be called before React's, allowing us to properly prevent defaults
    const handleWheelCapture = (e: WheelEvent) => {
      // Always prevent default for horizontal wheel events
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      // For pinch gestures (ctrl/cmd + wheel) - handle zooming
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        // Apply the zoom directly in this handler since we're stopping propagation
        const now = Date.now();
        const isTouchpad =
          Math.abs(e.deltaY) < 40 || now - lastWheelTime.current < 50;
        lastWheelTime.current = now;

        // Dynamic zoom step based on current zoom level - logarithmic scaling
        // More sensitive when zoomed in, less sensitive when zoomed out
        const dynamicFactor = 0.5 + (0.5 * zoomLevel) / MAX_ZOOM; // Scale factor between 0.5 and 1.0
        const step = isTouchpad
          ? BASE_TOUCHPAD_ZOOM_STEP * dynamicFactor * zoomLevel // Scales with zoom level
          : ZOOM_STEP * dynamicFactor;

        // Accumulate small deltas for touchpad input
        if (isTouchpad) {
          accumulatedDelta.current += e.deltaY;
          // Only apply zoom after accumulating enough movement - reduced threshold for more sensitivity
          if (Math.abs(accumulatedDelta.current) < 5) {
            return;
          }
          // Reset accumulator but keep the sign
          accumulatedDelta.current = accumulatedDelta.current > 0 ? 1 : -1;
        }

        // Determine zoom direction
        const delta = e.deltaY < 0 ? step : -step;

        // Calculate new zoom level
        const newZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, zoomLevel + delta)
        );

        // Only update if the zoom level has changed
        if (newZoom !== zoomLevel) {
          // Get canvas-relative coordinates to center zoom on cursor
          const rect = canvas.getBoundingClientRect();
          const centerX = e.clientX - rect.left;
          const centerY = e.clientY - rect.top;

          // Calculate world coordinates before zoom
          const worldX = (centerX - panOffset.x) / zoomLevel;
          const worldY = (centerY - panOffset.y) / zoomLevel;

          // Calculate new offset to keep the point centered
          const newOffsetX = centerX - worldX * newZoom;
          const newOffsetY = centerY - worldY * newZoom;

          // Update state - use requestAnimationFrame for better performance
          requestAnimationFrame(() => {
            setZoomLevel(newZoom);
            setPanOffset({ x: newOffsetX, y: newOffsetY });
          });
        }
      }
      // Handle two-finger panning (regular wheel event without modifier keys)
      else if (!isDrawing) {
        // Don't pan while drawing
        // Check if it's likely a touchpad gesture
        const now = Date.now();
        const isTouchpad =
          (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 40) &&
          now - lastWheelTime.current < 50;
        lastWheelTime.current = now;

        if (isTouchpad) {
          // IMPORTANT: Always prevent default for any touchpad gesture to block browser navigation
          e.preventDefault();
          e.stopPropagation();
          // Use the most aggressive form of prevention
          e.stopImmediatePropagation();

          // Apply panning based on the delta values
          // Adjust panSpeed to be consistent regardless of zoom level
          // As zoom increases, we need to pan more world units for the same screen distance
          // The panSpeed has a minimum value to prevent it from becoming too slow at lower zooms
          const minPanSpeed = 0.8;
          const zoomAdjustedSpeed = Math.max(minPanSpeed, zoomLevel);

          // Calculate the scaled deltas based on the zoom level
          const scaledDeltaX = e.deltaX * zoomAdjustedSpeed;
          const scaledDeltaY = e.deltaY * zoomAdjustedSpeed;

          setPanOffset((prev) => ({
            x: prev.x - scaledDeltaX,
            y: prev.y - scaledDeltaY,
          }));
        }
      }
    };

    // Add event listener with capture and non-passive options to allow preventDefault
    canvas.addEventListener("wheel", handleWheelCapture, {
      passive: false,
      capture: true,
    });

    // Also listen for mousewheel events (older browsers)
    canvas.addEventListener("mousewheel", handleWheelCapture as EventListener, {
      passive: false,
      capture: true,
    });

    // Add event listeners to block browser navigation
    document.addEventListener("gesturestart", blockBrowserGestures, {
      passive: false,
    });
    document.addEventListener("gesturechange", blockBrowserGestures, {
      passive: false,
    });
    // Safari-specific events
    document.addEventListener("webkitmouseforcechanged", blockBrowserGestures, {
      passive: false,
    });
    document.addEventListener("webkitmouseforcedown", blockBrowserGestures, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("wheel", handleWheelCapture, {
        capture: true,
      });
      canvas.removeEventListener(
        "mousewheel",
        handleWheelCapture as EventListener,
        {
          capture: true,
        }
      );
      document.removeEventListener("gesturestart", blockBrowserGestures);
      document.removeEventListener("gesturechange", blockBrowserGestures);
      document.removeEventListener(
        "webkitmouseforcechanged",
        blockBrowserGestures
      );
      document.removeEventListener(
        "webkitmouseforcedown",
        blockBrowserGestures
      );
    };
  }, [zoomLevel, panOffset, isDrawing]);

  // Handle mouse wheel for zooming - this is now a fallback and may not be needed
  // since we're handling the zoom in the capture phase
  const handleWheel = () => {
    // No need to do anything here, as we're handling it in the capture phase
    // This prevents duplicate zoom handling
  };

  // Zoom functions with point-centered zooming
  const zoomAtPoint = useCallback(
    (newZoom: number, centerX: number, centerY: number) => {
      if (newZoom < MIN_ZOOM || newZoom > MAX_ZOOM) return;

      // Convert center point to canvas coordinates before zoom
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      // Get canvas-relative coordinates
      const canvasX = centerX - canvasRect.left;
      const canvasY = centerY - canvasRect.top;

      // Calculate world coordinates before zoom
      const worldX = (canvasX - panOffset.x) / zoomLevel;
      const worldY = (canvasY - panOffset.y) / zoomLevel;

      // Calculate new offset to keep the point centered
      const newOffsetX = canvasX - worldX * newZoom;
      const newOffsetY = canvasY - worldY * newZoom;

      // Update state
      setZoomLevel(newZoom);
      setPanOffset({ x: newOffsetX, y: newOffsetY });
    },
    [panOffset, zoomLevel]
  );

  // Button-based zoom functions (centered on viewport)
  const zoomIn = useCallback(
    (zoomLevel: number) => {
      const newZoom = zoomLevel;

      // Zoom centered on viewport center
      const canvas = canvasRef.current;
      if (canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        zoomAtPoint(newZoom, centerX, centerY);
      }
    },
    [zoomAtPoint]
  );

  // Calculate the world coordinates of the top left corner
  const getTopLeftWorldCoords = useCallback(() => {
    // The screen coordinates of the top-left is (0, 0)
    // Convert to world coordinates using the same transformation as in screenToCanvasCoords
    const worldX = (0 - panOffset.x) / zoomLevel;
    const worldY = (0 - panOffset.y) / zoomLevel;

    return { x: worldX, y: worldY };
  }, [panOffset, zoomLevel]);

  // Convert screen coordinates to canvas coordinates accounting for pan and zoom
  const screenToCanvasCoords = useCallback(
    (screenX: number, screenY: number, canvasRect: DOMRect) => {
      // Adjust for canvas position
      const canvasX = screenX - canvasRect.left;
      const canvasY = screenY - canvasRect.top;

      // Reverse the transformations (pan and zoom)
      const x = (canvasX - panOffset.x) / zoomLevel;
      const y = (canvasY - panOffset.y) / zoomLevel;

      return { x, y };
    },
    [panOffset, zoomLevel]
  );

  // Start drawing
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    // Don't allow drawing in read-only mode
    if (isReadOnly) return;

    setIsDrawing(true);
    onDrawingStateChange?.(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert screen coordinates to canvas coordinates
    const { x, y } = screenToCanvasCoords(clientX, clientY, rect);

    const newShape: Stroke = {
      points: [{ x, y }],
      color,
      width: strokeWidth,
    };

    setCurrentShape(newShape);
  };

  // Handle mouse/touch move for panning or drawing
  const handleMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if ("touches" in e) {
      // Touch event handling
      if (e.touches.length >= 2) {
        // Always prevent default and stop propagation for multi-touch
        e.preventDefault();
        e.stopPropagation();

        // Force pan mode to be active for multi-touch
        setIsPanActive(true);

        // Get the first two touches for consistency
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate midpoint for panning
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;

        // Handle panning - completely separate from zooming logic
        const deltaX = midX - lastPanPosition.current.x;
        const deltaY = midY - lastPanPosition.current.y;

        // Use a very small threshold to ensure even tiny movements are tracked
        // This makes panning feel perfectly responsive without jitter
        if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
          // Apply pan directly without any smoothing for perfect tracking
          setPanOffset((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
        }

        // Update pan position immediately to prevent drift
        lastPanPosition.current = { x: midX, y: midY };

        // Handle pinch zoom as a completely separate operation
        if (lastTouchDistance.current !== null) {
          // Calculate new distance between fingers
          const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );

          // Calculate zoom factor with a higher threshold for stability
          // Increasing this threshold prevents accidental zooming during vertical panning
          const zoomDelta = distance / lastTouchDistance.current;

          // Only apply zoom if the change is significant (2.5% threshold)
          // This higher threshold prevents zoom flickering during vertical panning
          if (Math.abs(zoomDelta - 1) > 0.025) {
            // Get canvas-relative coordinates
            const canvas = canvasRef.current;
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const centerX = midX - rect.left;
              const centerY = midY - rect.top;

              // Get world coordinates under midpoint
              const worldX = (centerX - panOffset.x) / zoomLevel;
              const worldY = (centerY - panOffset.y) / zoomLevel;

              // Calculate new zoom level
              const newZoom = Math.max(
                MIN_ZOOM,
                Math.min(MAX_ZOOM, zoomLevel * zoomDelta)
              );

              // Calculate new offset to keep point centered
              const newOffsetX = centerX - worldX * newZoom;
              const newOffsetY = centerY - worldY * newZoom;

              // Update state directly - no easing or adjustments
              setZoomLevel(newZoom);
              setPanOffset({ x: newOffsetX, y: newOffsetY });
            }
          }

          // Always update distance reference to prevent accumulation of errors
          lastTouchDistance.current = distance;
        }
      } else if (isPanActive && e.touches.length === 1) {
        // Always prevent default for single-finger panning
        e.preventDefault();
        e.stopPropagation();

        // Single-finger panning
        const touch = e.touches[0];

        // Calculate delta with high precision
        const deltaX = touch.clientX - lastPanPosition.current.x;
        const deltaY = touch.clientY - lastPanPosition.current.y;

        // Use minimal threshold to ensure perfect tracking
        if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
          // Apply pan directly with no damping or smoothing
          setPanOffset((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
        }

        // Update position immediately to prevent drift
        lastPanPosition.current = { x: touch.clientX, y: touch.clientY };
      } else if (!isPanning && !isReadOnly && isDrawing) {
        // Prevent default when drawing to avoid interference
        e.preventDefault();
        // Handle drawing with single finger
        draw(e);
      }
    } else {
      // Mouse event handling - improve precision
      if ((isPanning && isPanActive) || (isReadOnly && isPanActive)) {
        // Calculate delta with high precision
        const deltaX = e.clientX - lastPanPosition.current.x;
        const deltaY = e.clientY - lastPanPosition.current.y;

        // Use minimal threshold for perfect tracking
        if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
          // Apply pan directly with no smoothing
          setPanOffset((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
        }

        // Update position immediately to prevent drift
        lastPanPosition.current = { x: e.clientX, y: e.clientY };
      } else if (!isPanning && !isReadOnly) {
        // Handle drawing
        draw(e);
      }
    }
  };

  // Start panning or drawing
  const handleMouseDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if ("touches" in e) {
      // Always prevent default to stop browser gestures
      e.preventDefault();
      e.stopPropagation();

      // Touch event handling
      if (e.touches.length >= 2) {
        // Two fingers down - always pan
        setIsPanActive(true);

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Get the midpoint as reference point for panning
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;

        // Store midpoint for panning reference - exact position
        lastPanPosition.current = { x: midX, y: midY };

        // Store distance for pinch zoom - exact measurement
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        lastTouchDistance.current = distance;
      } else if (!isReadOnly) {
        // Single finger in drawing mode
        startDrawing(e);
      } else {
        // Single finger in read-only mode = pan
        setIsPanActive(true);
        lastPanPosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    } else {
      // Mouse event handling
      if (isPanning || isReadOnly) {
        setIsPanActive(true);
        lastPanPosition.current = { x: e.clientX, y: e.clientY };
      } else if (!isReadOnly) {
        startDrawing(e);
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = async (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent default to ensure we capture all events
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 0) {
      // All fingers lifted
      lastTouchDistance.current = null;
      setIsPanActive(false);

      // If we were drawing, stop
      if (isDrawing) {
        await stopDrawing();
      }
    } else if (e.touches.length === 1) {
      // Went from multi-touch to single touch
      lastTouchDistance.current = null;

      // Update pan position for the remaining finger
      lastPanPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      // If not in read-only and not explicitly in pan mode, can start drawing
      if (!isReadOnly && !isPanning && !isDrawing) {
        startDrawing(e);
      }
    }
  };

  // Handle mouse up for panning or drawing
  const handleMouseUp = async () => {
    // Reset touch tracking
    lastTouchDistance.current = null;

    if ((isPanning && isPanActive) || (isReadOnly && isPanActive)) {
      // Stop panning
      setIsPanActive(false);
    } else if (!isPanning && !isReadOnly) {
      // Stop drawing (only if not in read-only mode)
      await stopDrawing();
    }
  };

  // Draw
  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    // Don't allow drawing in read-only mode
    if (isReadOnly) return;

    if (!isDrawing || !currentShape) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      // Touch event - make sure we're only drawing with one finger
      if (e.touches.length !== 1) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert screen coordinates to canvas coordinates
    const { x, y } = screenToCanvasCoords(clientX, clientY, rect);

    // Add point to current shape
    const updatedShape = {
      ...currentShape,
      points: [...currentShape.points, { x, y }],
    };

    setCurrentShape(updatedShape);

    // Draw the line segment
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.beginPath();
    ctx.moveTo(
      currentShape.points[currentShape.points.length - 1].x,
      currentShape.points[currentShape.points.length - 1].y
    );
    ctx.lineTo(x, y);
    ctx.strokeStyle = currentShape.color;
    // Store original stroke width - scale takes care of the visual thickness
    ctx.lineWidth = currentShape.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  };

  // Stop drawing
  const stopDrawing = async () => {
    if (isDrawing && currentShape) {
      // Save the current shape
      await onAddStroke(currentShape);
      setCurrentShape(null);
    }
    setIsDrawing(false);
    onDrawingStateChange?.(false);
  };

  // Function to animate pan and zoom changes
  const animatePanAndZoom = useCallback(
    (targetX: number, targetY: number, targetZoom: number, duration = 500) => {
      const startTime = Date.now();
      // Capture current values in local variables to avoid stale closure issues
      const startPanX = panOffset.x;
      const startPanY = panOffset.y;
      const startZoom = zoomLevel;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth transition
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);

        // Calculate the current position and zoom
        const currentX = startPanX + (targetX - startPanX) * easeOutCubic;
        const currentY = startPanY + (targetY - startPanY) * easeOutCubic;
        const currentZoom = startZoom + (targetZoom - startZoom) * easeOutCubic;

        // Update the state
        setPanOffset({ x: currentX, y: currentY });
        setZoomLevel(currentZoom);

        // Continue animation if not finished
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    },
    [panOffset, zoomLevel]
  );

  // Reset all transformations
  const resetView = useCallback(() => {
    animatePanAndZoom(0, 0, 1);
  }, [animatePanAndZoom]);

  // Function to focus on a specific user's drawing
  const focusOnDrawing = useCallback(
    (userId: string) => {
      // Find the user's drawing in our cached data
      const userDrawing = guestUserDrawings.find(
        (drawing) => drawing.userId === userId
      );

      // If user drawing not found or has no strokes, we can't focus on it
      if (!userDrawing || userDrawing.strokes.length === 0) {
        console.log(`No drawing found for user: ${userId}`);
        return;
      }

      const strokesToFocus = userDrawing.strokes;

      // Exit if no strokes or no canvas ref
      if (!strokesToFocus.length || !canvasRef.current) return;

      // Calculate bounds of the strokes
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      strokesToFocus.forEach((stroke) => {
        stroke.points.forEach((point) => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });

      // Check if bounds are valid
      if (
        minX === Infinity ||
        minY === Infinity ||
        maxX === -Infinity ||
        maxY === -Infinity
      ) {
        return;
      }

      // Calculate width and height of the strokes
      const width = maxX - minX;
      const height = maxY - minY;

      // Get the canvas dimensions
      const canvas = canvasRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Add padding around the drawing (20% of the drawing size)
      const paddingX = width * 0.2;
      const paddingY = height * 0.2;

      // Calculate new zoom level to fit the drawing with padding
      const zoomX = canvasWidth / (width + paddingX * 2);
      const zoomY = canvasHeight / (height + paddingY * 2);
      const newZoomLevel = Math.min(zoomX, zoomY, MAX_ZOOM); // Don't zoom in more than MAX_ZOOM

      // Calculate the center of the drawing
      const centerX = minX + width / 2;
      const centerY = minY + height / 2;

      // Calculate the new pan offset to center the drawing
      const newPanOffsetX = canvasWidth / 2 - centerX * newZoomLevel;
      const newPanOffsetY = canvasHeight / 2 - centerY * newZoomLevel;

      // Animate the transition
      animatePanAndZoom(newPanOffsetX, newPanOffsetY, newZoomLevel);
    },
    [guestUserDrawings, canvasRef, animatePanAndZoom]
  );

  // Handle save drawing button click
  const handleSaveDrawing = useCallback(async () => {
    if (!userId) return;

    try {
      setIsSaving(true);

      // Find the user's drawing in our cached data
      const userDrawing = guestUserDrawings.find(
        (drawing) => drawing.userId === userId
      );

      // Use the found drawing strokes, or fall back to shapes
      const strokesToExport = userDrawing?.strokes || shapes;

      // Pass the strokes directly to exportUserDrawing
      await exportUserDrawing(userId, experienceId, strokesToExport);
    } catch (error) {
      console.error("Error saving drawing:", error);
      alert("Could not save your drawing. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [userId, experienceId, guestUserDrawings, shapes]);

  // Now add the keyboard shortcut handler after the functions are defined
  useEffect(() => {
    // Don't enable keyboard shortcuts in read-only mode
    if (isReadOnly) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Prevent handling keyboard shortcuts while drawing
      if (isDrawing) return;

      // Check for undo: Ctrl+Z or Command+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (onUndo && canUndo) {
          onUndo();
        }
      }

      // Check for redo: Ctrl+Y or Command+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        if (onRedo && canRedo) {
          onRedo();
        }
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isReadOnly, isDrawing, onUndo, onRedo, canUndo, canRedo]);

  // Add wrapper for onSubmit
  const handleSubmit = useCallback(() => {
    // Call the original onSubmit handler
    if (onSubmit) {
      onSubmit();
    }
  }, [onSubmit]);

  // Add wrapper for onDeleteDrawing
  const handleDelete = useCallback(async () => {
    // Call the original onDeleteDrawing handler
    if (onDeleteDrawing) {
      await onDeleteDrawing();
    }
  }, [onDeleteDrawing]);

  // Wrapper for DrawingPreview onPreviewClick that adapts to our simplified focusOnDrawing function
  const handlePreviewClick = useCallback(() => {
    // When a preview is clicked, we want to focus on the current user's drawing
    if (userId) {
      focusOnDrawing(userId);
    }
  }, [userId, focusOnDrawing]);

  const currentUserDrawing = useMemo(() => {
    return guestUserDrawings.find((drawing) => drawing.userId === userId)
      ?.strokes;
  }, [guestUserDrawings, userId]);

  return (
    <div
      className="relative flex flex-1 w-full h-full overflow-hidden overscroll-none bg-white"
      ref={containerRef}
      style={{
        overscrollBehavior: "none",
        touchAction: "none",
      }}
    >
      {/* Guests Drawer */}
      <Drawer.Root>
        <Drawer.Trigger>
          <Button className="absolute top-4 right-4 z-[1]" variant="classic">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="size-5"
            >
              <path
                d="M8.75 3.25H7.25C5.59315 3.25 4.25 4.59315 4.25 6.25V17.75C4.25 19.4069 5.59315 20.75 7.25 20.75H8.75M8.75 3.25H16.75C18.4069 3.25 19.75 4.59315 19.75 6.25V17.75C19.75 19.4069 18.4069 20.75 16.75 20.75H8.75M8.75 3.25V20.75M12.75 7.75H15.75M12.75 11.75H15.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Guest Book
          </Button>
        </Drawer.Trigger>
        <Drawer.Content className="w-[250px] max-w-full">
          <Drawer.Header className="border-b border-stroke">
            <Drawer.Title>Guest Book</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="p-0">
            <GuestsList
              experienceId={experienceId}
              userIds={guestUserIds}
              onFocus={focusOnDrawing}
              userDrawings={guestUserDrawings}
            />
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>

      {/* Canvas takes up full container space */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full overscroll-none ${
          isPanning || isReadOnly ? "cursor-grab" : "cursor-crosshair"
        } ${isPanActive ? "cursor-grabbing" : ""}`}
        style={{
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) =>
          (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId)
        }
      />

      {/* Zoom level indicator */}
      <div className="absolute top-4 min-w-20 left-4 border bg-clip-border border-stroke bg-panel-translucent dark:bg-black-a9 backdrop-blur-2xl p-1 rounded-lg flex flex-col gap-1 shadow-sm">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="ghost" color="gray" size="2">
              {Math.round(zoomLevel * 100)}%
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {ZOOM_STEPS.map((step) => (
              <DropdownMenu.Item key={step} onSelect={() => zoomIn(step)}>
                {step * 100}%
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {/* Display world coordinates of top-left corner */}
        {(() => {
          const topLeft = getTopLeftWorldCoords();
          return (
            <>
              <Text size="0" className="px-2 tabular-nums">
                x: {topLeft.x.toFixed(0)}
              </Text>
              <Text size="0" className="px-2 tabular-nums">
                y: {topLeft.y.toFixed(0)}
              </Text>
            </>
          );
        })()}
        <Button size="1" variant="soft" color="gray" onClick={resetView}>
          RESET
        </Button>
      </div>

      {/* Controls overlay at the bottom */}
      {!isReadOnly && (
        <nav className="absolute rounded-xl bottom-4 left-1/2 transform -translate-x-1/2 fui-TooltipContent p-2 flex gap-2 items-center shadow-lg bg-panel-solid dark:bg-black-a9 dark:backdrop-blur-2xl">
          {/*  Panning mode toggle  */}
          <Tooltip content="Move" sideOffset={12}>
            <IconButton
              variant={isPanning ? "solid" : "ghost"}
              color={isPanning ? "orange" : "gray"}
              onClick={() => {
                setIsPanning(!isPanning);
                // Reset current drawing if switching modes
                if (isDrawing) {
                  setIsDrawing(false);
                  setCurrentShape(null);
                  onDrawingStateChange?.(false);
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
              >
                <path
                  d="M3.50795 5.41515L8.63436 20.2482C9.08587 21.5546 10.9142 21.6068 11.4395 20.3283L13.7902 14.6071C13.9425 14.2364 14.2368 13.942 14.6076 13.7897L20.3288 11.439C21.6073 10.9137 21.5551 9.08538 20.2487 8.63387L5.41564 3.50746C4.23295 3.09871 3.0992 4.23246 3.50795 5.41515Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>
          </Tooltip>
          <Separator orientation="vertical" size="1" />
          <div className="-mb-2 relative flex items-end  shrink-0 size-10">
            <div className="absolute bottom-0 flex items-end h-[100px] pointer-events-none [&>*]:pointer-events-auto overflow-hidden">
              <Popover.Root>
                <Tooltip content="Draw" sideOffset={12}>
                  <Popover.Trigger>
                    <IconButton
                      color={"gray"}
                      variant={isPanning ? "ghost" : "soft"}
                      className="tabular-nums flex items-end rounded-b-none group"
                      onClick={() => {
                        setIsPanning(false);
                      }}
                      size="3"
                    >
                      <div
                        id="pencil"
                        className={`drop-shadow-sm transition-transform  ${
                          isPanning
                            ? "translate-y-6 group-hover:translate-y-4"
                            : "translate-y-3"
                        }`}
                        style={
                          { "--pencil-color": color } as React.CSSProperties
                        }
                      >
                        <div id="pencil-tip"></div>
                        <div id="pencil-eraser"></div>
                      </div>
                    </IconButton>
                  </Popover.Trigger>
                </Tooltip>
                <Popover.Content
                  className="flex items-center gap-3 p-2 rounded-xl dark:bg-black-a9 dark:backdrop-blur-2xl"
                  sideOffset={24}
                >
                  <IconButton
                    variant="soft"
                    color="gray"
                    asChild
                    size="1"
                    className="size-[28px] p-0 overflow-hidden hover:opacity-80 cursor-pointer"
                  >
                    <label htmlFor="color-picker" className="relative">
                      <input
                        id="color-picker"
                        type="color"
                        className="absolute inset-0 opacity-0"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                      <span
                        className="size-full"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  </IconButton>
                  <div className="bg-gray-a3 rounded-lg py-1 px-2 flex items-center">
                    <Text
                      size="2"
                      weight="medium"
                      color="gray"
                      className="tabular-nums min-w-8"
                    >
                      {strokeWidth}
                    </Text>
                    <Slider
                      id="stroke-width"
                      className="w-32"
                      min={1}
                      max={20}
                      value={[strokeWidth]}
                      onValueChange={(v) => setStrokeWidth(v[0])}
                    />
                  </div>
                </Popover.Content>
              </Popover.Root>
            </div>
          </div>
          <Separator orientation="vertical" size="1" />
          <Tooltip content="Undo" sideOffset={12}>
            <IconButton
              variant="ghost"
              color="gray"
              size="2"
              onClick={() => {
                if (onUndo && canUndo) {
                  onUndo();
                }
              }}
              disabled={!canUndo || isReadOnly || isDrawing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6.7801 18.4697C7.073 18.7626 7.073 19.2374 6.7801 19.5303C6.48721 19.8232 6.01234 19.8232 5.71944 19.5303L2.7801 16.591C1.90142 15.7123 1.90143 14.2877 2.7801 13.409L5.71944 10.4697C6.01234 10.1768 6.48721 10.1768 6.7801 10.4697C7.073 10.7626 7.073 11.2374 6.7801 11.5303L4.06043 14.25H16.625C18.7651 14.25 20.5 12.5151 20.5 10.375C20.5 8.2349 18.7651 6.5 16.625 6.5H11.75C11.3358 6.5 11 6.16421 11 5.75C11 5.33579 11.3358 5 11.75 5H16.625C19.5935 5 22 7.40647 22 10.375C22 13.3435 19.5935 15.75 16.625 15.75H4.06043L6.7801 18.4697Z"
                  fill="currentColor"
                />
              </svg>
            </IconButton>
          </Tooltip>
          <Tooltip content="Redo" sideOffset={12}>
            <IconButton
              variant="ghost"
              color="gray"
              size="2"
              onClick={() => {
                if (onRedo && canRedo) {
                  onRedo();
                }
              }}
              disabled={!canRedo || isReadOnly || isDrawing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M17.2199 5.53033C16.927 5.23744 16.927 4.76256 17.2199 4.46967C17.5128 4.17678 17.9877 4.17678 18.2806 4.46967L21.2199 7.40901C22.0986 8.28769 22.0986 9.71231 21.2199 10.591L18.2806 13.5303C17.9877 13.8232 17.5128 13.8232 17.2199 13.5303C16.927 13.2374 16.927 12.7626 17.2199 12.4697L19.9396 9.75H7.375C5.2349 9.75 3.5 11.4849 3.5 13.625C3.5 15.7651 5.2349 17.5 7.375 17.5H12.25C12.6642 17.5 13 17.8358 13 18.25C13 18.6642 12.6642 19 12.25 19H7.375C4.40647 19 2 16.5935 2 13.625C2 10.6565 4.40647 8.25 7.375 8.25H19.9396L17.2199 5.53033Z"
                  fill="currentColor"
                />
              </svg>
            </IconButton>
          </Tooltip>
          <Separator orientation="vertical" size="1" />
          <Button
            onClick={onClearStrokes}
            variant="soft"
            color="gray"
            disabled={userStrokesCount === 0 || isReadOnly}
          >
            Clear
          </Button>
          {!hasSubmitted && !isSubmitting && (
            <Button
              onClick={handleSubmit}
              variant="solid"
              color="blue"
              disabled={userStrokesCount === 0 || isReadOnly}
            >
              Submit
            </Button>
          )}
        </nav>
      )}

      {/* Read-only mode navigation controls */}
      {isReadOnly && (
        <div className="absolute bottom-0 border-t sm:max-w-[460px] border-stroke sm:border rounded-none sm:rounded-b-xl w-full sm:w-auto sm:rounded-xl sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-panel-translucent dark:bg-black-a9 backdrop-blur-2xl p-2 flex flex-col gap-2 items-center z-10">
          <div className="flex items-center gap-3">
            {userId ? (
              <Spinner loading={!currentUserDrawing}>
                <DrawingPreview
                  userId={userId}
                  className="cursor-pointer hover:brightness-90 border border-stroke rounded-md bg-white"
                  size={60}
                  canvasId={experienceId}
                  onPreviewClick={handlePreviewClick}
                  strokes={currentUserDrawing}
                />
              </Spinner>
            ) : (
              <div
                className="cursor-not-allowed opacity-50 border border-stroke rounded-md bg-white"
                style={{ width: 60, height: 60 }}
              />
            )}
            <div className="flex flex-col gap-1">
              <Text size="2" weight="medium">
                Your Submitted Drawing
              </Text>
              <Text size="1" color="gray">
                Click preview to focus on your drawing, or use pan and zoom to
                explore the full canvas.
              </Text>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                size="1"
                variant="soft"
                color="gray"
                onClick={handleSaveDrawing}
                disabled={
                  isSaving ||
                  !userId ||
                  // Check if there are any strokes to save
                  (shapes.length === 0 &&
                    // Check if the user's drawing exists in guestUserDrawings and has strokes
                    !guestUserDrawings.some(
                      (drawing) =>
                        drawing.userId === userId &&
                        drawing.strokes &&
                        drawing.strokes.length > 0
                    ))
                }
                loading={isSaving}
              >
                Download
              </Button>
              {onDeleteDrawing ? (
                <Button
                  size="1"
                  variant="soft"
                  color="danger"
                  onClick={handleDelete}
                  disabled={isDeleting || !userId}
                  loading={isDeleting}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
