import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  FrameData,
  CanvasData,
  Point,
  EditorMode,
  OverlapMode,
  SmartGuide,
  RotationDialogRequest,
  ResizeHandleType,
} from '../types';
import {
  getFrameCenter,
  rotatePoint,
  canvasToFrameLocal,
  calculateRotatedResize,
  checkFramesOverlap,
  calculateSnapping,
  DEG2RAD,
} from '../utils/geometry';
import { buildFramePath } from '../utils/canvasRenderer';
import { getPaperTextureSvgDataUri } from '../utils/texturePatterns';
import { RotateCw, AlertCircle, Type, Upload, Check, RefreshCw, Move, Crop } from 'lucide-react';

interface Props {
  canvas: CanvasData;
  frames: FrameData[];
  selectedFrameIds: string[];
  mode: EditorMode;
  overlapMode: OverlapMode;
  zoom: number;
  showGrid?: boolean;
  onSelectFrames: (ids: string[], isShift: boolean) => void;
  onUpdateFrame: (frameId: string, updates: Partial<FrameData>, commitHistory?: boolean) => void;
  onCommitHistory: () => void;
  onRequestRotationDialog: (req: RotationDialogRequest) => void;
  onPolygonCreated: (points: Point[]) => void;
  onSetMode: (mode: EditorMode) => void;
  onBringFront: (frameId: string) => void;
  onReplaceImage?: (frameId: string, file: File) => void;
  onZoomChange?: (zoom: number) => void;
}

interface DragState {
  type: 'move' | 'resize' | 'rotate' | 'image-move' | 'pan';
  frameId?: string;
  handle?: ResizeHandleType;
  startMouse: Point; // Canvas coords
  startFrameState?: FrameData;
  allStartFrames?: FrameData[]; // For multi-move
  startScreenMouse?: Point;
  // Rotation tracking
  startCenter?: Point;
  startFrameRot?: number;
  startImageRot?: number;
  startMouseAngle?: number;
  rotationOption?: 'follow' | 'doNotFollow';
}

export const CanvasArea: React.FC<Props> = ({
  canvas,
  frames,
  selectedFrameIds,
  mode,
  overlapMode,
  zoom,
  showGrid = false,
  onSelectFrames,
  onUpdateFrame,
  onCommitHistory,
  onRequestRotationDialog,
  onPolygonCreated,
  onSetMode,
  onBringFront,
  onReplaceImage,
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasFileInputRef = useRef<HTMLInputElement>(null);
  const activeReplaceFrameIdRef = useRef<string | null>(null);
  const inlineTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeGuides, setActiveGuides] = useState<SmartGuide[]>([]);
  const [polygonDraftPoints, setPolygonDraftPoints] = useState<Point[]>([]);
  const [overlapNotification, setOverlapNotification] = useState<string | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // In-line editing states
  const [editingTextFrameId, setEditingTextFrameId] = useState<string | null>(null);
  const [editingImageFrameId, setEditingImageFrameId] = useState<string | null>(null);

  // Track Space bar for Figma/Photoshop style canvas panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && !editingTextFrameId) {
          e.preventDefault();
          setIsSpacePressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingTextFrameId]);

  // Support Ctrl / Cmd + Mouse Wheel to zoom canvas around cursor with passive: false
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onZoomChange) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
      const nextZoom = Math.min(2.0, Math.max(0.25, Math.round((zoom + zoomStep) * 100) / 100));
      if (nextZoom === zoom) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + container.scrollLeft;
      const mouseY = e.clientY - rect.top + container.scrollTop;
      const ratio = nextZoom / zoom;
      const newScrollLeft = mouseX * ratio - (e.clientX - rect.left);
      const newScrollTop = mouseY * ratio - (e.clientY - rect.top);

      onZoomChange(nextZoom);

      requestAnimationFrame(() => {
        container.scrollLeft = newScrollLeft;
        container.scrollTop = newScrollTop;
      });
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNative);
    };
  }, [zoom, onZoomChange]);

  // Synchronize editing state with global mode
  useEffect(() => {
    if (mode !== 'text-edit') setEditingTextFrameId(null);
    if (mode !== 'image-edit') setEditingImageFrameId(null);
  }, [mode]);

  // Auto-focus and select all text when entering text edit mode
  useEffect(() => {
    if (editingTextFrameId && inlineTextareaRef.current) {
      inlineTextareaRef.current.focus();
      inlineTextareaRef.current.select();
    }
  }, [editingTextFrameId]);

  // Global Escape key listener to exit editing modes cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingTextFrameId) {
          setEditingTextFrameId(null);
          onSetMode('select');
          onCommitHistory();
        }
        if (editingImageFrameId) {
          setEditingImageFrameId(null);
          onSetMode('select');
          onCommitHistory();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTextFrameId, editingImageFrameId, onSetMode, onCommitHistory]);

  // Helper: Convert Screen Point to Canvas Point
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: (screenX - rect.left) / zoom,
        y: (screenY - rect.top) / zoom,
      };
    },
    [zoom]
  );

  // Show temporary collision notification
  const triggerOverlapAlert = () => {
    setOverlapNotification('禁止重疊：已自動恢復至移動前位置');
    setTimeout(() => setOverlapNotification(null), 2500);
  };

  // Viewport Pan / Background Click Handler
  const handleViewportPointerDown = (e: React.PointerEvent) => {
    if (isSpacePressed || e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      setDragState({
        type: 'pan',
        startMouse: { x: containerRef.current?.scrollLeft || 0, y: containerRef.current?.scrollTop || 0 },
        startScreenMouse: { x: e.clientX, y: e.clientY },
      });
      return;
    }

    const target = e.target as HTMLElement;
    if (target === containerRef.current || target.id === 'canvas-scroll-content') {
      if (editingTextFrameId) {
        setEditingTextFrameId(null);
        onSetMode('select');
        onCommitHistory();
      }
      if (editingImageFrameId) {
        setEditingImageFrameId(null);
        onSetMode('select');
        onCommitHistory();
      }
      onSelectFrames([], false);
    }
  };

  // 1. Mouse Down Handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSpacePressed || e.button === 1) {
      handleViewportPointerDown(e);
      return;
    }
    if (e.button !== 0) return; // Left click only

    const canvasPt = screenToCanvas(e.clientX, e.clientY);

    // Polygon creation mode
    if (mode === 'polygon-create') {
      // Check if clicking close to first point
      if (polygonDraftPoints.length >= 2) {
        const first = polygonDraftPoints[0];
        const dist = Math.hypot(canvasPt.x - first.x, canvasPt.y - first.y);
        if (dist < 15) {
          // Close polygon!
          finishPolygonCreation();
          return;
        }
      }
      setPolygonDraftPoints((prev) => [...prev, canvasPt]);
      return;
    }

    // Check if clicked outside any frame
    const target = e.target as HTMLElement;
    if (target.dataset.role === 'canvas-background') {
      if (editingTextFrameId) {
        setEditingTextFrameId(null);
        onSetMode('select');
        onCommitHistory();
      }
      if (editingImageFrameId) {
        setEditingImageFrameId(null);
        onSetMode('select');
        onCommitHistory();
      }
      onSelectFrames([], false);
    }
  };

  // Image pan inside frame
  const handleImagePointerDown = (e: React.PointerEvent, frame: FrameData) => {
    e.stopPropagation();
    const canvasPt = screenToCanvas(e.clientX, e.clientY);
    setDragState({
      type: 'image-move',
      frameId: frame.id,
      startMouse: canvasPt,
      startFrameState: { ...frame },
    });
  };

  // Image wheel scale
  const handleImageWheel = (e: React.WheelEvent, frame: FrameData) => {
    if (editingImageFrameId !== frame.id || !frame.image) return;
    e.stopPropagation();
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const curScale = frame.image.scale || 1;
    const newScale = Math.min(5, Math.max(0.2, parseFloat((curScale * zoomFactor).toFixed(2))));
    onUpdateFrame(
      frame.id,
      {
        image: {
          ...frame.image,
          scale: newScale,
        },
      },
      false
    );
  };

  const finishPolygonCreation = () => {
    if (polygonDraftPoints.length < 3) {
      alert('多邊形至少需要 3 個頂點才能閉合');
      return;
    }
    // Calculate bounding box of polygon
    const xs = polygonDraftPoints.map((p) => p.x);
    const ys = polygonDraftPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = Math.max(30, maxX - minX);
    const h = Math.max(30, maxY - minY);

    // Relative points 0..1
    const relPoints = polygonDraftPoints.map((p) => ({
      x: (p.x - minX) / w,
      y: (p.y - minY) / h,
    }));

    onPolygonCreated(relPoints);
    setPolygonDraftPoints([]);
    onSetMode('select');
  };

  // 2. Start Frame Drag
  const handleFramePointerDown = (e: React.PointerEvent, frame: FrameData) => {
    if (isSpacePressed || e.button === 1) {
      handleViewportPointerDown(e);
      return;
    }
    e.stopPropagation();
    if (mode === 'polygon-create') return;

    // If currently editing text on this frame, clicks are for text editing/caret
    if (editingTextFrameId === frame.id) {
      return;
    }

    // If currently editing image on this frame, clicks inside the frame pan the image
    if (editingImageFrameId === frame.id) {
      handleImagePointerDown(e, frame);
      return;
    }

    // If clicked on a different frame while editing, close editing mode with history commit
    if (editingTextFrameId && editingTextFrameId !== frame.id) {
      setEditingTextFrameId(null);
      onSetMode('select');
      onCommitHistory();
    }
    if (editingImageFrameId && editingImageFrameId !== frame.id) {
      setEditingImageFrameId(null);
      onSetMode('select');
      onCommitHistory();
    }

    const isShift = e.shiftKey;
    const isAlreadySelected = selectedFrameIds.includes(frame.id);

    if (!isAlreadySelected && !isShift) {
      onSelectFrames([frame.id], false);
    } else if (isShift) {
      onSelectFrames([frame.id], true);
    }

    const canvasPt = screenToCanvas(e.clientX, e.clientY);
    setDragState({
      type: 'move',
      frameId: frame.id,
      startMouse: canvasPt,
      startFrameState: { ...frame },
      allStartFrames: frames.map((f) => ({ ...f })),
    });
  };

  // 3. Start Resize Handle Drag (Section 19)
  const handleResizeHandlePointerDown = (
    e: React.PointerEvent,
    frame: FrameData,
    handle: ResizeHandleType
  ) => {
    e.stopPropagation();
    const canvasPt = screenToCanvas(e.clientX, e.clientY);

    setDragState({
      type: 'resize',
      frameId: frame.id,
      handle,
      startMouse: canvasPt,
      startFrameState: { ...frame },
    });
  };

  // 4. Start Rotation Drag (Section 13, 14, 15, 16, 17)
  const handleRotateHandlePointerDown = (e: React.PointerEvent, frame: FrameData) => {
    e.stopPropagation();
    const canvasPt = screenToCanvas(e.clientX, e.clientY);
    const center = getFrameCenter(frame);
    const startMouseAngle = Math.atan2(canvasPt.y - center.y, canvasPt.x - center.x) * (180 / Math.PI);

    // If frame has an image content, Section 13 requires rotation confirmation dialog!
    if (frame.contentType === 'image' && frame.image?.source) {
      onRequestRotationDialog({
        frameId: frame.id,
        startFrameRotation: frame.rotation,
        startImageRotation: frame.image.rotation || 0,
        onConfirm: (option) => {
          // Begin rotation operation with chosen option
          setDragState({
            type: 'rotate',
            frameId: frame.id,
            startMouse: canvasPt,
            startCenter: center,
            startFrameState: { ...frame },
            startFrameRot: frame.rotation,
            startImageRot: frame.image?.rotation || 0,
            startMouseAngle,
            rotationOption: option,
          });
        },
        onCancel: () => {
          // Cancel: zero changes, no history
          setDragState(null);
        },
      });
      return;
    }

    // Empty or text frame: immediately begin rotation
    setDragState({
      type: 'rotate',
      frameId: frame.id,
      startMouse: canvasPt,
      startCenter: center,
      startFrameState: { ...frame },
      startFrameRot: frame.rotation,
      startImageRot: 0,
      startMouseAngle,
      rotationOption: 'follow',
    });
  };

  // 5. Global Pointer Move & Up listeners while dragging
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const currentCanvasPt = screenToCanvas(e.clientX, e.clientY);

      // A. MOVE FRAME
      if (dragState.type === 'move' && dragState.startFrameState) {
        const dx = currentCanvasPt.x - dragState.startMouse.x;
        const dy = currentCanvasPt.y - dragState.startMouse.y;

        const targetFrame = dragState.startFrameState;
        const rawNewX = targetFrame.x + dx;
        const rawNewY = targetFrame.y + dy;

        // Snapping and smart guides
        const snapTestFrame: FrameData = {
          ...targetFrame,
          x: rawNewX,
          y: rawNewY,
        };

        const otherFrames = frames.filter((f) => f.id !== targetFrame.id);
        const { snappedX, snappedY, guides } = calculateSnapping(
          snapTestFrame,
          otherFrames,
          canvas.width,
          canvas.height
        );

        let finalX = snappedX;
        let finalY = snappedY;

        // When showGrid is enabled, snap to nearest 20px grid line if not already locked to a guide
        if (showGrid) {
          const hasXGuide = guides.some((g) => g.type === 'x');
          const hasYGuide = guides.some((g) => g.type === 'y');
          const gridSize = 20;
          const snapThreshold = 5;

          if (!hasXGuide) {
            const remX = Math.round(finalX) % gridSize;
            if (remX < snapThreshold) {
              finalX -= remX;
            } else if (gridSize - remX < snapThreshold) {
              finalX += gridSize - remX;
            }
          }

          if (!hasYGuide) {
            const remY = Math.round(finalY) % gridSize;
            if (remY < snapThreshold) {
              finalY -= remY;
            } else if (gridSize - remY < snapThreshold) {
              finalY += gridSize - remY;
            }
          }
        }

        setActiveGuides(guides);

        onUpdateFrame(targetFrame.id, { x: finalX, y: finalY }, false);
      }

      // B. RESIZE FRAME (Along Frame Local Axes - Section 19)
      else if (dragState.type === 'resize' && dragState.startFrameState && dragState.handle) {
        const targetFrame = dragState.startFrameState;
        const newGeom = calculateRotatedResize(
          targetFrame,
          dragState.handle,
          currentCanvasPt
        );
        onUpdateFrame(targetFrame.id, newGeom, false);
      }

      // C. ROTATE FRAME (Section 14 & 15)
      else if (
        dragState.type === 'rotate' &&
        dragState.startFrameState &&
        dragState.startCenter &&
        dragState.startMouseAngle !== undefined &&
        dragState.startFrameRot !== undefined
      ) {
        const currentAngle =
          Math.atan2(currentCanvasPt.y - dragState.startCenter.y, currentCanvasPt.x - dragState.startCenter.x) *
          (180 / Math.PI);

        const deltaAngle = currentAngle - dragState.startMouseAngle;
        let newFrameRot = (dragState.startFrameRot + deltaAngle) % 360;
        if (newFrameRot < 0) newFrameRot += 360;

        const targetFrame = dragState.startFrameState;

        // Image local rotation calculation
        if (targetFrame.contentType === 'image' && targetFrame.image) {
          const startImageRot = dragState.startImageRot || 0;

          if (dragState.rotationOption === 'follow') {
            // Section 14: Image follows frame rotation
            // Visual angle changes by deltaAngle => local image rotation remains constant
            onUpdateFrame(
              targetFrame.id,
              {
                rotation: newFrameRot,
                image: {
                  ...targetFrame.image,
                  rotation: startImageRot,
                },
              },
              false
            );
          } else {
            // Section 15: Image does NOT follow frame rotation
            // Visual angle must remain unchanged!
            // visual = frameRot + imageRot = constant
            // imageRot = (startFrameRot + startImageRot) - newFrameRot = startImageRot - deltaAngle
            let newImageLocalRot = (startImageRot - deltaAngle) % 360;
            if (newImageLocalRot < 0) newImageLocalRot += 360;

            onUpdateFrame(
              targetFrame.id,
              {
                rotation: newFrameRot,
                image: {
                  ...targetFrame.image,
                  rotation: newImageLocalRot,
                },
              },
              false
            );
          }
        } else {
          // Empty or Text Frame
          onUpdateFrame(targetFrame.id, { rotation: newFrameRot }, false);
        }
      }

      // D. MOVE IMAGE INSIDE FRAME (Section 9, 20)
      else if (
        dragState.type === 'image-move' &&
        dragState.startFrameState &&
        dragState.startFrameState.image &&
        dragState.startFrameState.image.source
      ) {
        const targetFrame = dragState.startFrameState;
        const currentImage = targetFrame.image;
        if (!currentImage) return;

        const dx = currentCanvasPt.x - dragState.startMouse.x;
        const dy = currentCanvasPt.y - dragState.startMouse.y;

        // Convert canvas delta (dx, dy) into frame's local coordinate system
        const angleRad = (targetFrame.rotation * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const localDx = dx * cos + dy * sin;
        const localDy = -dx * sin + dy * cos;

        const startPos = currentImage.position || { x: 0, y: 0 };
        const newPos = {
          x: Math.round(startPos.x + localDx),
          y: Math.round(startPos.y + localDy),
        };

        onUpdateFrame(
          targetFrame.id,
          {
            image: {
              ...currentImage,
              position: newPos,
            },
          },
          false
        );
      }

      // E. PAN VIEWPORT (Space + Drag or Middle Click Drag)
      else if (dragState.type === 'pan' && containerRef.current && dragState.startScreenMouse) {
        const dx = e.clientX - dragState.startScreenMouse.x;
        const dy = e.clientY - dragState.startScreenMouse.y;
        containerRef.current.scrollLeft = dragState.startMouse.x - dx;
        containerRef.current.scrollTop = dragState.startMouse.y - dy;
      }
    };

    const handlePointerUp = () => {
      setActiveGuides([]);

      if (dragState.type === 'pan') {
        setDragState(null);
        return;
      }

      if (dragState.type === 'image-move') {
        onCommitHistory();
        setDragState(null);
        return;
      }

      // Overlap Forbidden Verification (Section 37)
      if (dragState.type === 'move' && dragState.startFrameState && dragState.frameId) {
        const movedFrameId = dragState.frameId;
        const currentFrame = frames.find((f) => f.id === movedFrameId);

        if (currentFrame && overlapMode === 'forbidden') {
          // Check collision against all other frames
          let hasCollision = false;
          for (const other of frames) {
            if (other.id === movedFrameId) continue;
            if (checkFramesOverlap(currentFrame, other)) {
              hasCollision = true;
              break;
            }
          }

          if (hasCollision) {
            // REVERT TO START POSITION (Section 37)
            onUpdateFrame(
              movedFrameId,
              {
                x: dragState.startFrameState.x,
                y: dragState.startFrameState.y,
              },
              false
            );
            triggerOverlapAlert();
            setDragState(null);
            return;
          }
        }

        // Allowed mode: auto bring to front on whole frame move (Section 21, 35)
        if (overlapMode === 'allowed' && currentFrame) {
          onBringFront(movedFrameId);
        }
      }

      // Commit history for any completed drag operation
      onCommitHistory();
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    dragState,
    frames,
    canvas,
    overlapMode,
    screenToCanvas,
    showGrid,
    onUpdateFrame,
    onCommitHistory,
    onBringFront,
  ]);

  // Double Click Handler (Section 36)
  const handleFrameDoubleClick = (e: React.MouseEvent, frame: FrameData) => {
    e.stopPropagation();
    onSelectFrames([frame.id], false);

    if (frame.contentType === 'text') {
      // Enter inline text editing
      setEditingTextFrameId(frame.id);
      setEditingImageFrameId(null);
      onSetMode('text-edit');
    } else if (frame.contentType === 'image') {
      if (!frame.image?.source) {
        // Empty image frame -> trigger file picker directly
        activeReplaceFrameIdRef.current = frame.id;
        canvasFileInputRef.current?.click();
      } else if (editingImageFrameId === frame.id) {
        // Already in image edit mode and double-clicked again -> open file picker to replace image
        activeReplaceFrameIdRef.current = frame.id;
        canvasFileInputRef.current?.click();
      } else {
        // Enter image-edit mode (pan, zoom, replace toolbar)
        setEditingImageFrameId(frame.id);
        setEditingTextFrameId(null);
        onSetMode('image-edit');
      }
    } else if (frame.contentType === 'empty') {
      // Empty frame -> open file picker directly
      activeReplaceFrameIdRef.current = frame.id;
      canvasFileInputRef.current?.click();
    }
  };

  // Sort frames by zIndex ascending for visual rendering
  const sortedFrames = [...frames].sort((a, b) => a.zIndex - b.zIndex);

  // Scaled dimensions to ensure scrolling bounds are physically accurate at all zoom levels
  const scaledWidth = Math.round(canvas.width * zoom);
  const scaledHeight = Math.round(canvas.height * zoom);

  return (
    <div
      ref={containerRef}
      id="canvas-viewport"
      onPointerDown={handleViewportPointerDown}
      className={`flex-1 bg-[#ede9df] overflow-auto relative select-none ${
        isSpacePressed ? (dragState?.type === 'pan' ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
    >
      {/* Overlap Revert Alert Notification */}
      {overlapNotification && (
        <div className="absolute top-4 z-50 flex items-center gap-2 bg-[#fdf5ed] border border-[#dfbfa8] text-[#874f2d] px-4 py-2 rounded-xl shadow-lg text-xs animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-[#874f2d]" />
          <span>{overlapNotification}</span>
        </div>
      )}

      {/* Polygon Draft Indicator */}
      {mode === 'polygon-create' && (
        <div className="absolute top-4 left-6 z-40 bg-[#faf9f5] border border-[#d8d3c5] text-[#3e372e] px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#9c7a52] animate-pulse" />
          <span>多邊形繪製模式：點擊畫布定點，點擊起點或雙擊閉合 (已設 {polygonDraftPoints.length} 個頂點)</span>
          {polygonDraftPoints.length >= 3 && (
            <button
              onClick={finishPolygonCreation}
              className="ml-2 px-2 py-0.5 bg-[#556354] hover:bg-[#465345] text-white rounded text-[11px] cursor-pointer"
            >
              閉合多邊形
            </button>
          )}
        </div>
      )}

      {/* Grid Active Status Indicator Badge */}
      {showGrid && (
        <div
          id="grid-active-badge"
          className="absolute bottom-4 left-6 z-40 bg-[#faf9f5]/90 backdrop-blur-xs border border-[#d8d3c5] text-[#556354] px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 shadow-xs pointer-events-none select-none animate-in fade-in"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#556354]" />
          <span>對齊格線開啟 (20px / 100px)</span>
        </div>
      )}

      {/* Scroll Content Wrapper: fills viewport when smaller, expands when larger */}
      <div
        id="canvas-scroll-content"
        className="min-w-full min-h-full p-12 flex items-center justify-center shrink-0 box-border"
        style={{
          width: 'max-content',
          height: 'max-content',
        }}
      >
        {/* Scaled Bounds Container: reserves exact layout width and height so scrollbars can reach top & bottom */}
        <div
          id="canvas-scaled-container"
          style={{
            width: scaledWidth,
            height: scaledHeight,
            minWidth: scaledWidth,
            minHeight: scaledHeight,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Actual Canvas */}
          <div
            ref={canvasRef}
            id="canvas-main"
            data-role="canvas-background"
            onPointerDown={handlePointerDown}
            style={{
              width: canvas.width,
              height: canvas.height,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
          backgroundColor:
            canvas.backgroundType === 'solid'
              ? canvas.background || '#ffffff'
              : canvas.backgroundType === 'gradient'
              ? undefined
              : '#ffffff',
          backgroundImage:
            canvas.backgroundType === 'gradient' && canvas.gradient
              ? canvas.gradient.type === 'radial'
                ? `radial-gradient(circle at center, ${canvas.gradient.startColor}, ${canvas.gradient.endColor})`
                : `linear-gradient(${canvas.gradient.angle}deg, ${canvas.gradient.startColor}, ${canvas.gradient.endColor})`
              : canvas.backgroundType === 'image' && canvas.backgroundImage
              ? `url(${canvas.backgroundImage})`
              : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="relative shadow-2xl transition-transform duration-75 shrink-0"
      >
        {/* Pattern overlay if active */}
        {canvas.pattern && canvas.pattern !== 'none' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                canvas.pattern === 'grid'
                  ? 'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)'
                  : canvas.pattern === 'dots'
                  ? 'radial-gradient(circle, rgba(0,0,0,0.1) 1.5px, transparent 1.5px)'
                  : canvas.pattern === 'stripes'
                  ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.04) 10px, rgba(0,0,0,0.04) 20px)'
                  : 'repeating-conic-gradient(rgba(0,0,0,0.05) 0% 25%, transparent 0% 50%)',
              backgroundSize: canvas.pattern === 'checker' ? '24px 24px' : '20px 20px',
            }}
          />
        )}

        {/* Paper Texture Overlay (和紙、牛皮紙、粗糙畫布、典雅羊皮紙) */}
        {canvas.paperTexture && canvas.paperTexture !== 'none' && (
          <div
            id="canvas-paper-texture-overlay"
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={{
              backgroundImage: `url("${getPaperTextureSvgDataUri(canvas.paperTexture)}")`,
              backgroundRepeat: 'repeat',
              backgroundSize:
                canvas.paperTexture === 'canvas'
                  ? '32px 32px'
                  : canvas.paperTexture === 'kraft'
                  ? '260px 260px'
                  : '300px 300px',
              opacity: canvas.paperTextureOpacity ?? 0.6,
              mixBlendMode: 'multiply',
            }}
          />
        )}

        {/* Frames */}
        {sortedFrames.map((frame) => {
          const isSelected = selectedFrameIds.includes(frame.id);

          // Build SVG clip path / border style
          const borderRadius =
            frame.shape === 'circle'
              ? '50%'
              : frame.shape === 'ellipse'
              ? '50% / 50%'
              : `${frame.roundedCorners}px`;

          // Image visual effects (brightness, contrast, grayscale, soft shadow)
          const imgEffects = frame.contentType === 'image' ? frame.image?.effects : undefined;
          const hasShadow = Boolean(imgEffects?.shadow);
          const shadowBlur = imgEffects?.shadowBlur ?? 16;
          const shadowOpacity = imgEffects?.shadowOpacity ?? 0.2;
          const shadowColor = imgEffects?.shadowColor || '#000000';

          const shadowRgba = (() => {
            const hex = shadowColor.replace('#', '');
            const clean = hex.length === 3 ? hex.split('').map((x) => x + x).join('') : hex;
            const parsed = parseInt(clean, 16);
            if (isNaN(parsed)) return `rgba(0,0,0,${shadowOpacity})`;
            return `rgba(${(parsed >> 16) & 255}, ${(parsed >> 8) & 255}, ${parsed & 255}, ${shadowOpacity})`;
          })();

          const brightness = imgEffects?.brightness ?? 100;
          const contrast = imgEffects?.contrast ?? 100;
          const grayscale = imgEffects?.grayscale ?? 0;
          const imageFilter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`;

          return (
            <div
              key={frame.id}
              id={`frame-${frame.id}`}
              onPointerDown={(e) => handleFramePointerDown(e, frame)}
              onDoubleClick={(e) => handleFrameDoubleClick(e, frame)}
              style={{
                position: 'absolute',
                left: frame.x,
                top: frame.y,
                width: frame.width,
                height: frame.height,
                transform: `rotate(${frame.rotation}deg)`,
                transformOrigin: '50% 50%',
                zIndex: frame.zIndex,
                borderRadius: frame.shape !== 'polygon' ? borderRadius : undefined,
                boxShadow: hasShadow && frame.shape !== 'polygon'
                  ? `0 ${Math.max(2, Math.round(shadowBlur * 0.4))}px ${shadowBlur}px ${shadowRgba}`
                  : undefined,
                filter: hasShadow && frame.shape === 'polygon'
                  ? `drop-shadow(0 ${Math.max(2, Math.round(shadowBlur * 0.4))}px ${shadowBlur}px ${shadowRgba})`
                  : undefined,
              }}
              className="cursor-move select-none"
            >
              {/* Frame Content Container with Clipping */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: frame.shape !== 'polygon' ? borderRadius : undefined,
                  clipPath:
                    frame.shape === 'polygon' && frame.polygonPoints && frame.polygonPoints.length >= 3
                      ? `polygon(${frame.polygonPoints.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(', ')})`
                      : undefined,
                  backgroundColor: frame.background || 'transparent',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* 1. Image Content (Section 9, 20) */}
                {frame.contentType === 'image' && frame.image?.source && (
                  <div
                    onPointerDown={(e) => {
                      if (editingImageFrameId === frame.id) {
                        handleImagePointerDown(e, frame);
                      }
                    }}
                    onWheel={(e) => {
                      if (editingImageFrameId === frame.id) {
                        handleImageWheel(e, frame);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translate(${frame.image.position?.x || 0}px, ${
                        frame.image.position?.y || 0
                      }px) rotate(${frame.image.rotation || 0}deg) scale(${frame.image.scale || 1})`,
                      transformOrigin: '50% 50%',
                      opacity: frame.image.opacity ?? 1,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: editingImageFrameId === frame.id ? 'auto' : 'none',
                      cursor:
                        editingImageFrameId === frame.id
                          ? dragState?.type === 'image-move'
                            ? 'grabbing'
                            : 'grab'
                          : 'inherit',
                    }}
                  >
                    {(() => {
                      const crop = frame.image.crop || { x: 0, y: 0, width: 1, height: 1 };
                      const safeCropX = Math.max(0, Math.min(0.99, crop.x || 0));
                      const safeCropY = Math.max(0, Math.min(0.99, crop.y || 0));
                      const safeCropW = Math.max(0.01, Math.min(1 - safeCropX, crop.width || 1));
                      const safeCropH = Math.max(0.01, Math.min(1 - safeCropY, crop.height || 1));

                      const natW = frame.image.naturalWidth || 400;
                      const natH = frame.image.naturalHeight || 300;
                      const croppedAspect = (natW * safeCropW) / (natH * safeCropH);
                      const isCropped = safeCropX > 0 || safeCropY > 0 || safeCropW < 0.999 || safeCropH < 0.999;

                      if (!isCropped) {
                        return (
                          <img
                            src={frame.image.source}
                            alt="frame-content"
                            draggable={false}
                            style={{
                              maxWidth: frame.image.displayMode === 'contain' ? '100%' : 'none',
                              maxHeight: frame.image.displayMode === 'contain' ? '100%' : 'none',
                              width: frame.image.displayMode === 'cover' ? '100%' : 'auto',
                              height: frame.image.displayMode === 'cover' ? '100%' : 'auto',
                              objectFit: frame.image.displayMode,
                              filter: imageFilter,
                            }}
                          />
                        );
                      }

                      return (
                        <div
                          style={{
                            position: 'relative',
                            width: frame.image.displayMode === 'contain' ? 'auto' : '100%',
                            height: frame.image.displayMode === 'contain' ? 'auto' : '100%',
                            maxWidth: frame.image.displayMode === 'contain' ? '100%' : 'none',
                            maxHeight: frame.image.displayMode === 'contain' ? '100%' : 'none',
                            aspectRatio: `${croppedAspect}`,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={frame.image.source}
                            alt="frame-content"
                            draggable={false}
                            style={{
                              position: 'absolute',
                              width: `${(1 / safeCropW) * 100}%`,
                              height: `${(1 / safeCropH) * 100}%`,
                              left: `${(-safeCropX / safeCropW) * 100}%`,
                              top: `${(-safeCropY / safeCropH) * 100}%`,
                              maxWidth: 'none',
                              maxHeight: 'none',
                              objectFit: 'fill',
                              filter: imageFilter,
                            }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Empty Image Placeholder */}
                {frame.contentType === 'image' && !frame.image?.source && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      activeReplaceFrameIdRef.current = frame.id;
                      canvasFileInputRef.current?.click();
                    }}
                    className="w-full h-full flex flex-col items-center justify-center text-[#8c8275] bg-[#f5f2eb]/60 p-2 text-center cursor-pointer hover:bg-[#edeae1]/80 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-[#556354] mb-1" />
                    <span className="text-[11px] font-medium text-[#484138]">點擊或雙擊放入圖片</span>
                  </div>
                )}

                {/* 2. Text Content (Section 10, 23) */}
                {frame.contentType === 'text' && frame.text && (
                  editingTextFrameId === frame.id ? (
                    <textarea
                      ref={inlineTextareaRef}
                      value={frame.text.content}
                      onChange={(e) => {
                        onUpdateFrame(
                          frame.id,
                          {
                            text: {
                              ...frame.text!,
                              content: e.target.value,
                            },
                          },
                          false
                        );
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Escape') {
                          setEditingTextFrameId(null);
                          onSetMode('select');
                          onCommitHistory();
                        }
                      }}
                      onBlur={() => {
                        setEditingTextFrameId(null);
                        onSetMode('select');
                        onCommitHistory();
                      }}
                      placeholder="請在此輸入文字..."
                      style={{
                        width: '100%',
                        height: '100%',
                        padding: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        border: 'none',
                        outline: '2px solid #556354',
                        outlineOffset: '-2px',
                        resize: 'none',
                        textAlign: frame.text.horizontalAlign,
                        fontFamily: frame.text.font,
                        fontSize: `${frame.text.size}px`,
                        fontWeight: frame.text.bold ? 'bold' : 'normal',
                        fontStyle: frame.text.italic ? 'italic' : 'normal',
                        color: frame.text.color,
                        whiteSpace: frame.text.autoWrap ? 'pre-wrap' : 'pre',
                        wordBreak: 'break-word',
                        lineHeight: 1.35,
                        cursor: 'text',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent:
                          frame.text.verticalAlign === 'top'
                            ? 'flex-start'
                            : frame.text.verticalAlign === 'middle'
                            ? 'center'
                            : 'flex-end',
                        textAlign: frame.text.horizontalAlign,
                        fontFamily: frame.text.font,
                        fontSize: `${frame.text.size}px`,
                        fontWeight: frame.text.bold ? 'bold' : 'normal',
                        fontStyle: frame.text.italic ? 'italic' : 'normal',
                        color: frame.text.color,
                        whiteSpace: frame.text.autoWrap ? 'pre-wrap' : 'pre',
                        wordBreak: 'break-word',
                        lineHeight: 1.35,
                        pointerEvents: 'none',
                      }}
                    >
                      {frame.text.content || '雙擊此處輸入文字'}
                    </div>
                  )
                )}
              </div>

              {/* Frame Border (rendered cleanly on top of clipped content) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  borderRadius: frame.shape !== 'polygon' ? borderRadius : undefined,
                  borderWidth:
                    frame.border?.appearance === 'oil-painting'
                      ? `${Math.max(6, frame.border.width)}px`
                      : `${frame.border?.width || 0}px`,
                  borderColor:
                    frame.border?.appearance === 'oil-painting'
                      ? '#b8860b'
                      : frame.border?.color || 'transparent',
                  borderStyle: frame.border?.style || 'solid',
                  boxShadow:
                    frame.border?.appearance === 'oil-painting'
                      ? 'inset 0 0 0 2px #ffd700, inset 0 0 6px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)'
                      : undefined,
                }}
              />

              {/* Floating Badge for Text Editing */}
              {editingTextFrameId === frame.id && (
                <div
                  className="absolute -top-9 left-1/2 -translate-x-1/2 z-40 bg-[#faf9f5] border border-[#d8d3c5] text-[#38332c] px-3 py-1 rounded-lg shadow-md flex items-center gap-2 whitespace-nowrap text-xs animate-in fade-in slide-in-from-bottom-1"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Type className="w-3.5 h-3.5 text-[#556354]" />
                  <span className="text-[11px] text-[#736c62]">文字編輯中 (按 Esc 或點擊外部完成)</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTextFrameId(null);
                      onSetMode('select');
                      onCommitHistory();
                    }}
                    className="ml-1 px-2 py-0.5 bg-[#556354] hover:bg-[#465345] text-white rounded text-[11px] font-medium cursor-pointer transition-colors"
                  >
                    ✓ 完成
                  </button>
                </div>
              )}

              {/* Floating Toolbar and Hints for Image Editing */}
              {editingImageFrameId === frame.id && (
                <>
                  {/* Pan & Zoom Hint Inside Frame */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-[#2c2824]/75 text-white text-[10px] px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 whitespace-nowrap shadow-xs">
                    <Move className="w-2.5 h-2.5" />
                    <span>拖曳平移・滾輪縮放</span>
                  </div>

                  {/* Floating Toolbar Above Frame */}
                  <div
                    className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 bg-[#faf9f5] border border-[#d8d3c5] text-[#38332c] px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap text-xs font-sans animate-in fade-in slide-in-from-bottom-1"
                    onPointerDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        activeReplaceFrameIdRef.current = frame.id;
                        canvasFileInputRef.current?.click();
                      }}
                      title="從電腦選取新圖片更換"
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#556354] hover:bg-[#465345] text-white rounded-lg font-medium cursor-pointer transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>更換圖片</span>
                    </button>

                    <div className="w-px h-4 bg-[#e5e1d8]" />

                    {/* Display Mode toggle */}
                    <button
                      onClick={() => {
                        const newMode = frame.image?.displayMode === 'cover' ? 'contain' : 'cover';
                        onUpdateFrame(
                          frame.id,
                          {
                            image: { ...frame.image!, displayMode: newMode },
                          },
                          true
                        );
                      }}
                      title="切換填滿 (Cover) / 包含 (Contain)"
                      className="px-2 py-1 bg-[#edeae1] hover:bg-[#e2ded3] text-[#484138] rounded-md font-mono text-[11px] cursor-pointer transition-colors"
                    >
                      {frame.image?.displayMode === 'cover' ? '填滿' : '包含'}
                    </button>

                    {/* Scale controls */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-[#8c8275]">縮放:</span>
                      <button
                        onClick={() => {
                          const curScale = frame.image?.scale || 1;
                          const newScale = Math.max(0.2, parseFloat((curScale - 0.1).toFixed(2)));
                          onUpdateFrame(frame.id, { image: { ...frame.image!, scale: newScale } }, true);
                        }}
                        className="w-5 h-5 flex items-center justify-center bg-[#edeae1] hover:bg-[#e2ded3] rounded cursor-pointer transition-colors"
                        title="縮小 10%"
                      >
                        -
                      </button>
                      <span className="font-mono w-9 text-center text-[#556354] font-medium">
                        {Math.round((frame.image?.scale || 1) * 100)}%
                      </span>
                      <button
                        onClick={() => {
                          const curScale = frame.image?.scale || 1;
                          const newScale = Math.min(5, parseFloat((curScale + 0.1).toFixed(2)));
                          onUpdateFrame(frame.id, { image: { ...frame.image!, scale: newScale } }, true);
                        }}
                        className="w-5 h-5 flex items-center justify-center bg-[#edeae1] hover:bg-[#e2ded3] rounded cursor-pointer transition-colors"
                        title="放大 10%"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-px h-4 bg-[#e5e1d8]" />

                    {/* Rotate image +90 deg */}
                    <button
                      onClick={() => {
                        const curRot = frame.image?.rotation || 0;
                        const newRot = (curRot + 90) % 360;
                        onUpdateFrame(frame.id, { image: { ...frame.image!, rotation: newRot } }, true);
                      }}
                      title="圖片自體順時針旋轉 90°"
                      className="p-1 hover:bg-[#edeae1] text-[#736c62] hover:text-[#2c2824] rounded cursor-pointer transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Crop toggle */}
                    <button
                      onClick={() => {
                        const curCrop = frame.image?.crop;
                        const isCropped = curCrop && (curCrop.x > 0 || curCrop.y > 0 || curCrop.width < 0.99 || curCrop.height < 0.99);
                        const nextCrop = isCropped
                          ? { x: 0, y: 0, width: 1, height: 1 }
                          : { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
                        onUpdateFrame(
                          frame.id,
                          { image: { ...frame.image!, crop: nextCrop } },
                          true
                        );
                      }}
                      title={
                        frame.image?.crop && (frame.image.crop.x > 0 || frame.image.crop.width < 0.99)
                          ? '還原為未裁切原圖'
                          : '快速裁切：裁切留存中心 80% (更多精細裁切請見右側屬性面板)'
                      }
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        frame.image?.crop && (frame.image.crop.x > 0 || frame.image.crop.width < 0.99)
                          ? 'bg-[#556354] text-white shadow-xs'
                          : 'hover:bg-[#edeae1] text-[#736c62] hover:text-[#2c2824]'
                      }`}
                    >
                      <Crop className="w-3.5 h-3.5" />
                    </button>

                    {/* Reset Position, Scale & Crop */}
                    <button
                      onClick={() => {
                        onUpdateFrame(
                          frame.id,
                          {
                            image: {
                              ...frame.image!,
                              position: { x: 0, y: 0 },
                              scale: 1,
                              rotation: 0,
                              crop: { x: 0, y: 0, width: 1, height: 1 },
                            },
                          },
                          true
                        );
                      }}
                      title="重設位置、縮放、裁切與自體旋轉"
                      className="p-1 hover:bg-[#edeae1] text-[#736c62] hover:text-[#2c2824] rounded cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-[#e5e1d8]" />

                    {/* Finish Button */}
                    <button
                      onClick={() => {
                        setEditingImageFrameId(null);
                        onSetMode('select');
                        onCommitHistory();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#edeae1] hover:bg-[#e2ded3] text-[#484138] rounded-lg font-medium cursor-pointer border border-[#d8d3c5] transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-[#556354]" />
                      <span>完成</span>
                    </button>
                  </div>
                </>
              )}

              {/* Selection Box & Transform Controls (When Selected & Not in inline editing) */}
              {isSelected && !editingTextFrameId && !editingImageFrameId && (
                <div
                  id={`selection-${frame.id}`}
                  className="absolute inset-0 pointer-events-none border border-[#556354] shadow-xs"
                  style={{
                    borderRadius: frame.shape !== 'polygon' ? borderRadius : undefined,
                  }}
                >
                  {/* Rotation Handle (Top Center Stem + Knob) */}
                  <div
                    onPointerDown={(e) => handleRotateHandlePointerDown(e, frame)}
                    title="旋轉圖框"
                    className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border border-[#556354] rounded-full flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing shadow-xs hover:scale-110 transition-transform"
                  >
                    <RotateCw className="w-2.5 h-2.5 text-[#556354]" />
                  </div>
                  {/* Stem connecting top edge to rotate knob */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-2 bg-[#556354] pointer-events-none" />

                  {/* 8 Resize Handles (NW, N, NE, E, SE, S, SW, W) */}
                  {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const).map((handle) => {
                    let posStyle: React.CSSProperties = {};
                    let cursor = 'nwse-resize';

                    if (handle === 'nw') {
                      posStyle = { top: -5, left: -5 };
                      cursor = 'nwse-resize';
                    } else if (handle === 'n') {
                      posStyle = { top: -5, left: '50%', transform: 'translateX(-50%)' };
                      cursor = 'ns-resize';
                    } else if (handle === 'ne') {
                      posStyle = { top: -5, right: -5 };
                      cursor = 'nesw-resize';
                    } else if (handle === 'e') {
                      posStyle = { top: '50%', right: -5, transform: 'translateY(-50%)' };
                      cursor = 'ew-resize';
                    } else if (handle === 'se') {
                      posStyle = { bottom: -5, right: -5 };
                      cursor = 'nwse-resize';
                    } else if (handle === 's') {
                      posStyle = { bottom: -5, left: '50%', transform: 'translateX(-50%)' };
                      cursor = 'ns-resize';
                    } else if (handle === 'sw') {
                      posStyle = { bottom: -5, left: -5 };
                      cursor = 'nesw-resize';
                    } else if (handle === 'w') {
                      posStyle = { top: '50%', left: -5, transform: 'translateY(-50%)' };
                      cursor = 'ew-resize';
                    }

                    return (
                      <div
                        key={handle}
                        id={`handle-${frame.id}-${handle}`}
                        onPointerDown={(e) => handleResizeHandlePointerDown(e, frame, handle)}
                        style={{
                          position: 'absolute',
                          width: 8,
                          height: 8,
                          backgroundColor: '#ffffff',
                          border: '1.5px solid #556354',
                          borderRadius: 2,
                          cursor,
                          pointerEvents: 'auto',
                          ...posStyle,
                        }}
                        className="hover:scale-125 transition-transform"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Visual Alignment Grid (Optional, controlled by Toolbar) */}
        {showGrid && (
          <svg
            id="canvas-alignment-grid"
            className="absolute inset-0 w-full h-full pointer-events-none"
            width={canvas.width}
            height={canvas.height}
            style={{ zIndex: 35, pointerEvents: 'none' }}
          >
            <defs>
              {/* Minor grid (20px x 20px) */}
              <pattern
                id="alignment-grid-minor"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#556354"
                  strokeWidth="0.75"
                  strokeOpacity="0.14"
                />
              </pattern>
              {/* Major grid (100px x 100px) */}
              <pattern
                id="alignment-grid-major"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <rect width="100%" height="100%" fill="url(#alignment-grid-minor)" />
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="#556354"
                  strokeWidth="1.25"
                  strokeOpacity="0.32"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#alignment-grid-major)" />
          </svg>
        )}

        {/* Smart Guides Overlay (Section 23) */}
        {activeGuides.map((guide, idx) => {
          if (guide.type === 'x') {
            return (
              <div
                key={`guide-x-${idx}`}
                style={{
                  position: 'absolute',
                  left: guide.position,
                  top: guide.start,
                  width: 1,
                  height: guide.end - guide.start,
                  backgroundColor: '#ef4444',
                  zIndex: 9999,
                  pointerEvents: 'none',
                }}
              />
            );
          } else {
            return (
              <div
                key={`guide-y-${idx}`}
                style={{
                  position: 'absolute',
                  left: guide.start,
                  top: guide.position,
                  width: guide.end - guide.start,
                  height: 1,
                  backgroundColor: '#ef4444',
                  zIndex: 9999,
                  pointerEvents: 'none',
                }}
              />
            );
          }
        })}

        {/* Free Polygon Interactive Points Preview (Section 23) */}
        {mode === 'polygon-create' && polygonDraftPoints.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-50">
            <polyline
              points={polygonDraftPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {polygonDraftPoints.map((p, idx) => (
              <circle
                key={`poly-point-${idx}`}
                cx={p.x}
                cy={p.y}
                r={idx === 0 ? 6 : 4}
                fill={idx === 0 ? '#10b981' : '#f59e0b'}
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}
          </svg>
        )}
        {/* Hidden File Input for Canvas Double-Click Image Replacement */}
        <input
          ref={canvasFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onReplaceImage && activeReplaceFrameIdRef.current) {
              onReplaceImage(activeReplaceFrameIdRef.current, file);
            }
            e.target.value = '';
          }}
        />
      </div>
    </div>
  </div>
</div>
  );
};
