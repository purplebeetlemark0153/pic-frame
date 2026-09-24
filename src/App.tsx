/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CanvasData,
  CanvasPreset,
  EditorMode,
  FrameData,
  FrameShape,
  HistoryState,
  OverlapMode,
  Point,
  ProjectData,
  RotationDialogRequest,
  ContentSwitchDialogRequest,
  EyedropperTarget,
} from './types';
import { Toolbar } from './components/Toolbar';
import { TopBar } from './components/TopBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { CanvasArea } from './components/CanvasArea';
import { RotationConfirmModal } from './components/RotationConfirmModal';
import { ContentSwitchModal } from './components/ContentSwitchModal';
import { EyedropperResultModal } from './components/EyedropperResultModal';
import { sampleCanvasPixel } from './utils/canvasRenderer';
import { fileToBase64, exportToPNG, exportToJPG, exportToPDF, exportToDOCX, saveProjectToFile, loadProjectFromFile } from './utils/exportUtils';

import { CanvasPresetInfo } from './types';

// Standard preset dimensions with explicit separation of physical (mm) vs display resolution (px @ 96 DPI)
export const PRESET_CONFIGS: Record<CanvasPreset, CanvasPresetInfo> = {
  A4_PORTRAIT: {
    preset: 'A4_PORTRAIT',
    label: 'A4 直式 (210 × 297 mm)',
    unit: 'mm',
    physicalWidth: 210,
    physicalHeight: 297,
    pixelWidth: 794,
    pixelHeight: 1123,
  },
  A4_LANDSCAPE: {
    preset: 'A4_LANDSCAPE',
    label: 'A4 橫式 (297 × 210 mm)',
    unit: 'mm',
    physicalWidth: 297,
    physicalHeight: 210,
    pixelWidth: 1123,
    pixelHeight: 794,
  },
  A3: {
    preset: 'A3',
    label: 'A3 (297 × 420 mm)',
    unit: 'mm',
    physicalWidth: 297,
    physicalHeight: 420,
    pixelWidth: 1123,
    pixelHeight: 1587,
  },
  A5: {
    preset: 'A5',
    label: 'A5 (148 × 210 mm)',
    unit: 'mm',
    physicalWidth: 148,
    physicalHeight: 210,
    pixelWidth: 559,
    pixelHeight: 794,
  },
  CUSTOM: {
    preset: 'CUSTOM',
    label: '自訂尺寸',
    unit: 'px',
    physicalWidth: 800,
    physicalHeight: 600,
    pixelWidth: 800,
    pixelHeight: 600,
  },
};

export default function App() {
  // 1. Core State with clear physical vs display resolution
  const [canvas, setCanvas] = useState<CanvasData>({
    width: 794,
    height: 1123,
    unit: 'mm',
    physicalWidth: 210,
    physicalHeight: 297,
    dpi: 96,
    preset: 'A4_PORTRAIT',
    backgroundType: 'solid',
    background: '#ffffff',
    paperTexture: 'none',
    paperTextureOpacity: 0.6,
    zoom: 0.75,
  });

  // Initial sample layout illustrating capabilities (Japanese Minimalist Wabi-sabi Style)
  const [frames, setFrames] = useState<FrameData[]>([
    {
      id: 'init-frame-1',
      x: 120,
      y: 130,
      width: 320,
      height: 240,
      shape: 'rectangle',
      roundedCorners: 4,
      rotation: 4,
      background: '#faf9f5',
      border: { width: 1.5, color: '#8c9c89', style: 'solid' },
      zIndex: 1,
      contentType: 'image',
      image: {
        source:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f2efe9"/><circle cx="200" cy="150" r="64" fill="%23d0ded3"/><path d="M140,210 Q200,160 260,210" stroke="%23849987" stroke-width="3" fill="none"/><text x="200" y="145" font-family="%27Noto Serif JP%27, serif" font-size="18" fill="%234a554d" text-anchor="middle">日式簡約風景</text><text x="200" y="170" font-family="sans-serif" font-size="12" fill="%237b8a7e" text-anchor="middle">靜謐・自然・自由排版</text></svg>',
        naturalWidth: 400,
        naturalHeight: 300,
        position: { x: 0, y: 0 },
        scale: 1,
        crop: { x: 0, y: 0, width: 1, height: 1 },
        rotation: 0,
        opacity: 1,
        displayMode: 'cover',
      },
    },
    {
      id: 'init-frame-2',
      x: 450,
      y: 170,
      width: 220,
      height: 220,
      shape: 'circle',
      roundedCorners: 0,
      rotation: 0,
      background: '#f8f6f0',
      border: { width: 1.5, color: '#c5b8a5', style: 'solid' },
      zIndex: 2,
      contentType: 'text',
      text: {
        content: '日和\n余白の美学\n圖片拼貼',
        font: "'Noto Serif JP', serif",
        size: 15,
        bold: false,
        italic: false,
        color: '#443e38',
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        autoWrap: true,
      },
    },
  ]);

  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>(['init-frame-1']);
  const [mode, setMode] = useState<EditorMode>('select');
  const [overlapMode, setOverlapMode] = useState<OverlapMode>('allowed');
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Dialog Requests
  const [rotationDialogReq, setRotationDialogReq] = useState<RotationDialogRequest | null>(null);
  const [contentSwitchDialogReq, setContentSwitchDialogReq] = useState<ContentSwitchDialogRequest | null>(null);
  const [clipboard, setClipboard] = useState<FrameData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Eyedropper state
  const [eyedropperSampledColor, setEyedropperSampledColor] = useState<string | null>(null);
  const eyedropperTargetRef = useRef<EyedropperTarget>('any');

  // Recently sampled colors for eyedropper & quick palettes
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('layout_designer_recent_colors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to stylish default design palette
    }
    return ['#556354', '#8c7a65', '#2c2824', '#ffffff', '#e5e1d8', '#3498db', '#e74c3c', '#f1c40f'];
  });

  // Maintain synchronous references to avoid stale closure in callbacks
  const framesRef = useRef(frames);
  const canvasRef = useRef(canvas);
  const overlapModeRef = useRef(overlapMode);
  const selectedFrameIdsRef = useRef(selectedFrameIds);

  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);
  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);
  useEffect(() => {
    overlapModeRef.current = overlapMode;
  }, [overlapMode]);
  useEffect(() => {
    selectedFrameIdsRef.current = selectedFrameIds;
  }, [selectedFrameIds]);

  // Undo / Redo History Stack (Max 50)
  const [history, setHistory] = useState<HistoryState[]>([
    {
      frames: JSON.parse(JSON.stringify(frames)),
      canvas: { ...canvas },
      overlapMode: 'allowed',
      selectedFrameIds: ['init-frame-1'],
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronous atomic snapshot push
  const pushHistorySnapshot = useCallback(
    (customSnapshot?: {
      frames?: FrameData[];
      canvas?: CanvasData;
      overlapMode?: OverlapMode;
      selectedFrameIds?: string[];
    }) => {
      const snapFrames = customSnapshot?.frames ?? framesRef.current;
      const snapCanvas = customSnapshot?.canvas ?? canvasRef.current;
      const snapOverlap = customSnapshot?.overlapMode ?? overlapModeRef.current;
      const snapSelected = customSnapshot?.selectedFrameIds ?? selectedFrameIdsRef.current;

      const newState: HistoryState = {
        frames: JSON.parse(JSON.stringify(snapFrames)),
        canvas: { ...snapCanvas },
        overlapMode: snapOverlap,
        selectedFrameIds: [...snapSelected],
      };

      const curIdx = historyIndexRef.current;
      const nextHistory = historyRef.current.slice(0, curIdx + 1);
      if (nextHistory.length >= 50) {
        nextHistory.shift();
      }
      const updatedHistory = [...nextHistory, newState];
      const newIdx = updatedHistory.length - 1;

      historyRef.current = updatedHistory;
      historyIndexRef.current = newIdx;

      setHistory(updatedHistory);
      setHistoryIndex(newIdx);
    },
    []
  );

  const commitHistory = useCallback(() => {
    pushHistorySnapshot();
  }, [pushHistorySnapshot]);

  // Undo Action
  const handleUndo = useCallback(() => {
    const curIdx = historyIndexRef.current;
    const curHistory = historyRef.current;
    if (curIdx > 0) {
      const targetState = curHistory[curIdx - 1];
      const restoredFrames = JSON.parse(JSON.stringify(targetState.frames));
      const restoredCanvas = { ...targetState.canvas };
      const restoredOverlap = targetState.overlapMode;
      const restoredSelected = [...targetState.selectedFrameIds];

      framesRef.current = restoredFrames;
      canvasRef.current = restoredCanvas;
      overlapModeRef.current = restoredOverlap;
      selectedFrameIdsRef.current = restoredSelected;
      historyIndexRef.current = curIdx - 1;

      setFrames(restoredFrames);
      setCanvas(restoredCanvas);
      setOverlapMode(restoredOverlap);
      setSelectedFrameIds(restoredSelected);
      setHistoryIndex(curIdx - 1);
    }
  }, []);

  // Redo Action
  const handleRedo = useCallback(() => {
    const curIdx = historyIndexRef.current;
    const curHistory = historyRef.current;
    if (curIdx < curHistory.length - 1) {
      const targetState = curHistory[curIdx + 1];
      const restoredFrames = JSON.parse(JSON.stringify(targetState.frames));
      const restoredCanvas = { ...targetState.canvas };
      const restoredOverlap = targetState.overlapMode;
      const restoredSelected = [...targetState.selectedFrameIds];

      framesRef.current = restoredFrames;
      canvasRef.current = restoredCanvas;
      overlapModeRef.current = restoredOverlap;
      selectedFrameIdsRef.current = restoredSelected;
      historyIndexRef.current = curIdx + 1;

      setFrames(restoredFrames);
      setCanvas(restoredCanvas);
      setOverlapMode(restoredOverlap);
      setSelectedFrameIds(restoredSelected);
      setHistoryIndex(curIdx + 1);
    }
  }, []);

  // Update Frame helper
  const handleUpdateFrame = useCallback(
    (frameId: string, updates: Partial<FrameData>, shouldCommit = false) => {
      setFrames((prev) => {
        const updated = prev.map((f) => {
          if (f.id === frameId) {
            return { ...f, ...updates };
          }
          return f;
        });
        framesRef.current = updated;
        if (shouldCommit) {
          pushHistorySnapshot({ frames: updated });
        }
        return updated;
      });
    },
    [pushHistorySnapshot]
  );

  // Update Canvas helper
  const handleUpdateCanvas = useCallback(
    (updates: Partial<CanvasData>) => {
      setCanvas((prev) => {
        const updated = { ...prev, ...updates };
        canvasRef.current = updated;
        pushHistorySnapshot({ canvas: updated });
        return updated;
      });
    },
    [pushHistorySnapshot]
  );

  // Save color to recent colors list and localStorage
  const saveRecentColor = useCallback((color: string) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== color.toLowerCase());
      const next = [color, ...filtered].slice(0, 16);
      try {
        localStorage.setItem('layout_designer_recent_colors', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // Handle color sampled from Eyedropper
  const handleColorSampled = useCallback(
    (color: string, target: EyedropperTarget = 'any') => {
      saveRecentColor(color);

      if (target === 'canvas-background') {
        setCanvas((prev) => {
          const updated: CanvasData = {
            ...prev,
            backgroundType: 'solid',
            background: color,
          };
          canvasRef.current = updated;
          pushHistorySnapshot({ canvas: updated });
          return updated;
        });
        showToast(`已將畫布底色填滿為 ${color}`);
        return;
      }

      if (target === 'frame-border') {
        const curSelected = selectedFrameIdsRef.current;
        if (curSelected.length > 0) {
          setFrames((prev) => {
            const updated = prev.map((f) => {
              if (curSelected.includes(f.id)) {
                return {
                  ...f,
                  border: {
                    ...f.border,
                    color,
                    width: f.border?.width && f.border.width > 0 ? f.border.width : 2,
                    style: f.border?.style || 'solid',
                  },
                };
              }
              return f;
            });
            framesRef.current = updated;
            pushHistorySnapshot({ frames: updated });
            return updated;
          });
          showToast(`已將選取圖框邊框設為 ${color}`);
        } else {
          showToast(`吸取顏色：${color} (請先選取圖框以設定邊框)`);
        }
        return;
      }

      if (target === 'frame-background') {
        const curSelected = selectedFrameIdsRef.current;
        if (curSelected.length > 0) {
          setFrames((prev) => {
            const updated = prev.map((f) => {
              if (curSelected.includes(f.id)) {
                return {
                  ...f,
                  background: color,
                };
              }
              return f;
            });
            framesRef.current = updated;
            pushHistorySnapshot({ frames: updated });
            return updated;
          });
          showToast(`已將選取圖框底色設為 ${color}`);
        } else {
          showToast(`吸取顏色：${color} (請先選取圖框以設定底色)`);
        }
        return;
      }

      if (target === 'text-color') {
        const curSelected = selectedFrameIdsRef.current;
        if (curSelected.length > 0) {
          setFrames((prev) => {
            const updated = prev.map((f) => {
              if (curSelected.includes(f.id) && f.contentType === 'text' && f.text) {
                return {
                  ...f,
                  text: {
                    ...f.text,
                    color,
                  },
                };
              }
              return f;
            });
            framesRef.current = updated;
            pushHistorySnapshot({ frames: updated });
            return updated;
          });
          showToast(`已將選取文字顏色設為 ${color}`);
        } else {
          showToast(`吸取顏色：${color} (請先選取文字圖框以修改字體色彩)`);
        }
        return;
      }

      // Default 'any': Open the EyedropperResultModal dialog
      setEyedropperSampledColor(color);
    },
    [pushHistorySnapshot, saveRecentColor]
  );

  // Activate Eyedropper tool
  const handleActivateEyedropper = useCallback(
    async (target: EyedropperTarget = 'any') => {
      eyedropperTargetRef.current = target;

      // Check if browser natively supports EyeDropper API (Chromium / Edge / Opera)
      if (typeof window !== 'undefined' && 'EyeDropper' in window) {
        try {
          const eyeDropper = new (window as any).EyeDropper();
          const result = await eyeDropper.open();
          if (result && result.sRGBHex) {
            handleColorSampled(result.sRGBHex.toLowerCase(), target);
            return;
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            return; // Cancelled by user with Esc
          }
          console.warn('Native EyeDropper API fallback to canvas sampler:', err);
        }
      }

      // Fallback: in-canvas pixel sampler mode
      setMode('eyedropper');
      showToast('滴管吸色模式：點擊畫布或圖片任一處吸取顏色 (按 Esc 取消)');
    },
    [handleColorSampled]
  );

  // Handle in-canvas pixel sample click
  const handleCanvasSampleColor = useCallback(
    async (canvasX: number, canvasY: number) => {
      try {
        const color = await sampleCanvasPixel(canvasRef.current, framesRef.current, canvasX, canvasY);
        setMode('select');
        handleColorSampled(color, eyedropperTargetRef.current);
      } catch (err) {
        console.error('Canvas pixel sampling error:', err);
        setMode('select');
        showToast('吸取顏色失敗，請重試');
      }
    },
    [handleColorSampled]
  );

  // Selection handler
  const handleSelectFrames = useCallback((ids: string[], isShift: boolean) => {
    if (!isShift) {
      setSelectedFrameIds(ids);
    } else {
      setSelectedFrameIds((prev) => {
        const next = [...prev];
        for (const id of ids) {
          const idx = next.indexOf(id);
          if (idx !== -1) {
            next.splice(idx, 1);
          } else {
            next.push(id);
          }
        }
        return next;
      });
    }
  }, []);

  // Add Frame
  const handleAddFrame = useCallback(
    (shape: FrameShape) => {
      const maxZ = framesRef.current.reduce((max, f) => Math.max(max, f.zIndex), 0);
      const newFrame: FrameData = {
        id: 'frame-' + Date.now(),
        x: Math.round(canvasRef.current.width / 2 - 120 + (Math.random() * 40 - 20)),
        y: Math.round(canvasRef.current.height / 2 - 100 + (Math.random() * 40 - 20)),
        width: shape === 'circle' ? 200 : 240,
        height: shape === 'circle' ? 200 : 180,
        shape,
        roundedCorners: shape === 'rectangle' ? 8 : 0,
        rotation: 0,
        background: '#ffffff',
        border: { width: 2, color: '#334155', style: 'solid' },
        zIndex: maxZ + 1,
        contentType: 'empty',
      };
      setFrames((prev) => {
        const updated = [...prev, newFrame];
        framesRef.current = updated;
        selectedFrameIdsRef.current = [newFrame.id];
        pushHistorySnapshot({ frames: updated, selectedFrameIds: [newFrame.id] });
        return updated;
      });
      setSelectedFrameIds([newFrame.id]);
    },
    [pushHistorySnapshot]
  );

  // Add Text Frame
  const handleAddTextFrame = useCallback(() => {
    const maxZ = framesRef.current.reduce((max, f) => Math.max(max, f.zIndex), 0);
    const newFrame: FrameData = {
      id: 'frame-text-' + Date.now(),
      x: Math.round(canvasRef.current.width / 2 - 140),
      y: Math.round(canvasRef.current.height / 2 - 60),
      width: 280,
      height: 120,
      shape: 'rectangle',
      roundedCorners: 4,
      rotation: 0,
      background: 'transparent',
      border: { width: 0, color: 'transparent', style: 'solid' },
      zIndex: maxZ + 1,
      contentType: 'text',
      text: {
        content: '點擊此處輸入文字內容',
        font: "'Noto Sans TC', sans-serif",
        size: 20,
        bold: false,
        italic: false,
        color: '#0f172a',
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        autoWrap: true,
      },
    };
    setFrames((prev) => {
      const updated = [...prev, newFrame];
      framesRef.current = updated;
      selectedFrameIdsRef.current = [newFrame.id];
      pushHistorySnapshot({ frames: updated, selectedFrameIds: [newFrame.id] });
      return updated;
    });
    setSelectedFrameIds([newFrame.id]);
  }, [pushHistorySnapshot]);

  // Polygon Created from CanvasArea
  const handlePolygonCreated = useCallback(
    (points: Point[]) => {
      const maxZ = framesRef.current.reduce((max, f) => Math.max(max, f.zIndex), 0);
      const newFrame: FrameData = {
        id: 'frame-poly-' + Date.now(),
        x: Math.round(canvasRef.current.width / 2 - 130),
        y: Math.round(canvasRef.current.height / 2 - 130),
        width: 260,
        height: 260,
        shape: 'polygon',
        polygonPoints: points,
        roundedCorners: 0,
        rotation: 0,
        background: '#f8fafc',
        border: { width: 3, color: '#f59e0b', style: 'solid' },
        zIndex: maxZ + 1,
        contentType: 'empty',
      };
      setFrames((prev) => {
        const updated = [...prev, newFrame];
        framesRef.current = updated;
        selectedFrameIdsRef.current = [newFrame.id];
        pushHistorySnapshot({ frames: updated, selectedFrameIds: [newFrame.id] });
        return updated;
      });
      setSelectedFrameIds([newFrame.id]);
    },
    [pushHistorySnapshot]
  );

  // Upload image to selected frame or create new image frame
  const handleUploadImageToSelectedOrNew = useCallback(
    async (file: File) => {
      try {
        const base64 = await fileToBase64(file);
        const tempImg = new Image();
        tempImg.src = base64;
        await new Promise((res) => {
          tempImg.onload = res;
        });

        const naturalW = tempImg.naturalWidth || 400;
        const naturalH = tempImg.naturalHeight || 300;

        if (selectedFrameIds.length === 1) {
          const targetId = selectedFrameIds[0];
          const targetFrame = frames.find((f) => f.id === targetId);

          if (targetFrame?.contentType === 'text') {
            // Section 24: Text -> Image confirmation
            setContentSwitchDialogReq({
              frameId: targetId,
              fromType: 'text',
              toType: 'image',
              onConfirm: () => {
                handleUpdateFrame(
                  targetId,
                  {
                    contentType: 'image',
                    text: undefined,
                    image: {
                      source: base64,
                      naturalWidth: naturalW,
                      naturalHeight: naturalH,
                      position: { x: 0, y: 0 },
                      scale: 1,
                      crop: { x: 0, y: 0, width: 1, height: 1 },
                      rotation: 0,
                      opacity: 1,
                      displayMode: 'cover',
                    },
                  },
                  true
                );
                setContentSwitchDialogReq(null);
              },
              onCancel: () => setContentSwitchDialogReq(null),
            });
            return;
          }

          // Otherwise assign image directly
          handleUpdateFrame(
            targetId,
            {
              contentType: 'image',
              image: {
                source: base64,
                naturalWidth: naturalW,
                naturalHeight: naturalH,
                position: { x: 0, y: 0 },
                scale: 1,
                crop: { x: 0, y: 0, width: 1, height: 1 },
                rotation: 0,
                opacity: 1,
                displayMode: 'cover',
              },
            },
            true
          );
        } else {
          // Create new frame tailored to image aspect ratio
          const maxZ = framesRef.current.reduce((max, f) => Math.max(max, f.zIndex), 0);
          const maxDim = 320;
          const ratio = naturalW / naturalH;
          let w = maxDim;
          let h = maxDim;
          if (ratio > 1) {
            h = Math.round(w / ratio);
          } else {
            w = Math.round(h * ratio);
          }

          const newFrame: FrameData = {
            id: 'frame-img-' + Date.now(),
            x: Math.round(canvasRef.current.width / 2 - w / 2),
            y: Math.round(canvasRef.current.height / 2 - h / 2),
            width: w,
            height: h,
            shape: 'rectangle',
            roundedCorners: 8,
            rotation: 0,
            background: 'transparent',
            border: { width: 0, color: 'transparent', style: 'solid' },
            zIndex: maxZ + 1,
            contentType: 'image',
            image: {
              source: base64,
              naturalWidth: naturalW,
              naturalHeight: naturalH,
              position: { x: 0, y: 0 },
              scale: 1,
              crop: { x: 0, y: 0, width: 1, height: 1 },
              rotation: 0,
              opacity: 1,
              displayMode: 'cover',
            },
          };
          setFrames((prev) => {
            const updated = [...prev, newFrame];
            framesRef.current = updated;
            selectedFrameIdsRef.current = [newFrame.id];
            pushHistorySnapshot({ frames: updated, selectedFrameIds: [newFrame.id] });
            return updated;
          });
          setSelectedFrameIds([newFrame.id]);
        }
      } catch (err: any) {
        alert(err.message || 'Image upload error');
      }
    },
    [selectedFrameIds, handleUpdateFrame, pushHistorySnapshot]
  );

  // Replace image for specific frame
  const handleReplaceImage = useCallback(
    async (frameId: string, file: File) => {
      try {
        const base64 = await fileToBase64(file);
        const tempImg = new Image();
        tempImg.src = base64;
        await new Promise((res) => {
          tempImg.onload = res;
        });

        const targetFrame = frames.find((f) => f.id === frameId);
        handleUpdateFrame(
          frameId,
          {
            image: {
              source: base64,
              naturalWidth: tempImg.naturalWidth || 400,
              naturalHeight: tempImg.naturalHeight || 300,
              position: targetFrame?.image?.position || { x: 0, y: 0 },
              scale: targetFrame?.image?.scale || 1,
              crop: targetFrame?.image?.crop || { x: 0, y: 0, width: 1, height: 1 },
              rotation: targetFrame?.image?.rotation || 0,
              opacity: targetFrame?.image?.opacity ?? 1,
              displayMode: targetFrame?.image?.displayMode || 'cover',
              effects: targetFrame?.image?.effects,
            },
          },
          true
        );
      } catch (err: any) {
        alert(err.message || 'Replace image error');
      }
    },
    [frames, handleUpdateFrame]
  );

  // Delete Frame
  const handleDeleteFrame = useCallback(
    (frameId: string) => {
      setFrames((prev) => {
        const updated = prev.filter((f) => f.id !== frameId);
        framesRef.current = updated;
        const newSelected = selectedFrameIdsRef.current.filter((id) => id !== frameId);
        selectedFrameIdsRef.current = newSelected;
        pushHistorySnapshot({ frames: updated, selectedFrameIds: newSelected });
        return updated;
      });
      setSelectedFrameIds((prev) => prev.filter((id) => id !== frameId));
    },
    [pushHistorySnapshot]
  );

  // Delete Content (keeps frame)
  const handleDeleteContent = useCallback(
    (frameId: string) => {
      handleUpdateFrame(
        frameId,
        {
          contentType: 'empty',
          image: undefined,
          text: undefined,
        },
        true
      );
    },
    [handleUpdateFrame]
  );

  // Duplicate Frame
  const handleDuplicateFrame = useCallback(
    (frameId: string) => {
      const source = framesRef.current.find((f) => f.id === frameId);
      if (!source) return;
      const maxZ = framesRef.current.reduce((max, f) => Math.max(max, f.zIndex), 0);
      const cloned: FrameData = {
        ...JSON.parse(JSON.stringify(source)),
        id: 'frame-copy-' + Date.now(),
        x: source.x + 25,
        y: source.y + 25,
        zIndex: maxZ + 1,
      };
      setFrames((prev) => {
        const updated = [...prev, cloned];
        framesRef.current = updated;
        selectedFrameIdsRef.current = [cloned.id];
        pushHistorySnapshot({ frames: updated, selectedFrameIds: [cloned.id] });
        return updated;
      });
      setSelectedFrameIds([cloned.id]);
    },
    [pushHistorySnapshot]
  );

  // Layer Controls (Section 35)
  const handleBringFront = useCallback(
    (frameId: string) => {
      const maxZ = frames.reduce((max, f) => Math.max(max, f.zIndex), 0);
      handleUpdateFrame(frameId, { zIndex: maxZ + 1 }, true);
    },
    [frames, handleUpdateFrame]
  );

  const handleSendBack = useCallback(
    (frameId: string) => {
      const minZ = frames.reduce((min, f) => Math.min(min, f.zIndex), 0);
      handleUpdateFrame(frameId, { zIndex: Math.max(0, minZ - 1) }, true);
    },
    [frames, handleUpdateFrame]
  );

  const handleMoveUp = useCallback(
    (frameId: string) => {
      const current = frames.find((f) => f.id === frameId);
      if (!current) return;
      handleUpdateFrame(frameId, { zIndex: current.zIndex + 1 }, true);
    },
    [frames, handleUpdateFrame]
  );

  const handleMoveDown = useCallback(
    (frameId: string) => {
      const current = frames.find((f) => f.id === frameId);
      if (!current) return;
      handleUpdateFrame(frameId, { zIndex: Math.max(0, current.zIndex - 1) }, true);
    },
    [frames, handleUpdateFrame]
  );

  // Content Switching Request (Section 24)
  const handleRequestContentSwitch = useCallback(
    (frameId: string, toType: 'empty' | 'image' | 'text') => {
      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;

      if (toType === 'empty') {
        handleDeleteContent(frameId);
        return;
      }

      // Empty -> Image or Empty -> Text: No confirmation needed (Section 24)
      if (frame.contentType === 'empty') {
        if (toType === 'text') {
          handleUpdateFrame(
            frameId,
            {
              contentType: 'text',
              text: {
                content: '文字內容',
                font: "'Noto Sans TC', sans-serif",
                size: 18,
                bold: false,
                italic: false,
                color: '#000000',
                horizontalAlign: 'center',
                verticalAlign: 'middle',
                autoWrap: true,
              },
            },
            true
          );
        } else if (toType === 'image') {
          handleUpdateFrame(frameId, { contentType: 'image' }, true);
        }
        return;
      }

      // Image -> Text or Text -> Image: Confirmation required! (Section 24)
      setContentSwitchDialogReq({
        frameId,
        fromType: frame.contentType,
        toType,
        onConfirm: () => {
          if (toType === 'text') {
            handleUpdateFrame(
              frameId,
              {
                contentType: 'text',
                image: undefined,
                text: {
                  content: '輸入文字內容',
                  font: "'Noto Sans TC', sans-serif",
                  size: 18,
                  bold: false,
                  italic: false,
                  color: '#000000',
                  horizontalAlign: 'center',
                  verticalAlign: 'middle',
                  autoWrap: true,
                },
              },
              true
            );
          } else if (toType === 'image') {
            handleUpdateFrame(
              frameId,
              {
                contentType: 'image',
                text: undefined,
              },
              true
            );
          }
          setContentSwitchDialogReq(null);
        },
        onCancel: () => setContentSwitchDialogReq(null),
      });
    },
    [frames, handleDeleteContent, handleUpdateFrame]
  );

  // Multi-select Alignment Handlers (Section 38)
  const handleAlignMulti = useCallback(
    (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      const selected = frames.filter((f) => selectedFrameIds.includes(f.id));
      if (selected.length < 2) return;

      const minX = Math.min(...selected.map((f) => f.x));
      const maxX = Math.max(...selected.map((f) => f.x + f.width));
      const minY = Math.min(...selected.map((f) => f.y));
      const maxY = Math.max(...selected.map((f) => f.y + f.height));
      const centerX = (minX + maxX) / 2;
      const middleY = (minY + maxY) / 2;

      setFrames((prev) => {
        const updated = prev.map((f) => {
          if (!selectedFrameIdsRef.current.includes(f.id)) return f;
          let newX = f.x;
          let newY = f.y;

          if (alignment === 'left') newX = minX;
          else if (alignment === 'center') newX = centerX - f.width / 2;
          else if (alignment === 'right') newX = maxX - f.width;
          else if (alignment === 'top') newY = minY;
          else if (alignment === 'middle') newY = middleY - f.height / 2;
          else if (alignment === 'bottom') newY = maxY - f.height;

          return { ...f, x: newX, y: newY };
        });
        framesRef.current = updated;
        pushHistorySnapshot({ frames: updated });
        return updated;
      });
    },
    [pushHistorySnapshot]
  );

  const handleEqualizeMulti = useCallback(
    (dimension: 'width' | 'height') => {
      const selected = framesRef.current.filter((f) => selectedFrameIdsRef.current.includes(f.id));
      if (selected.length < 2) return;
      const baseFrame = selected[0];

      setFrames((prev) => {
        const updated = prev.map((f) => {
          if (!selectedFrameIdsRef.current.includes(f.id)) return f;
          if (dimension === 'width') {
            return { ...f, width: baseFrame.width };
          } else {
            return { ...f, height: baseFrame.height };
          }
        });
        framesRef.current = updated;
        pushHistorySnapshot({ frames: updated });
        return updated;
      });
    },
    [pushHistorySnapshot]
  );

  const handleDistributeMulti = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      const selected = framesRef.current.filter((f) => selectedFrameIdsRef.current.includes(f.id));
      if (selected.length < 3) return;

      if (direction === 'horizontal') {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const last = sorted[sorted.length - 1];
        const maxX = last.x + last.width;
        const totalItemsWidth = sorted.reduce((sum, f) => sum + f.width, 0);
        const totalGap = maxX - minX - totalItemsWidth;
        const gap = totalGap / (sorted.length - 1);

        let currentX = minX;
        const posMap = new Map<string, number>();
        for (const item of sorted) {
          posMap.set(item.id, currentX);
          currentX += item.width + gap;
        }

        setFrames((prev) => {
          const updated = prev.map((f) => {
            if (posMap.has(f.id)) {
              return { ...f, x: posMap.get(f.id)! };
            }
            return f;
          });
          framesRef.current = updated;
          pushHistorySnapshot({ frames: updated });
          return updated;
        });
      } else {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const last = sorted[sorted.length - 1];
        const maxY = last.y + last.height;
        const totalItemsHeight = sorted.reduce((sum, f) => sum + f.height, 0);
        const totalGap = maxY - minY - totalItemsHeight;
        const gap = totalGap / (sorted.length - 1);

        let currentY = minY;
        const posMap = new Map<string, number>();
        for (const item of sorted) {
          posMap.set(item.id, currentY);
          currentY += item.height + gap;
        }

        setFrames((prev) => {
          const updated = prev.map((f) => {
            if (posMap.has(f.id)) {
              return { ...f, y: posMap.get(f.id)! };
            }
            return f;
          });
          framesRef.current = updated;
          pushHistorySnapshot({ frames: updated });
          return updated;
        });
      }
    },
    [pushHistorySnapshot]
  );

  // Preset Selection with Physical Dimensions (mm) and Display Resolution (px)
  const handleChangePreset = useCallback(
    (preset: CanvasPreset, customW?: number, customH?: number) => {
      const cfg = PRESET_CONFIGS[preset];
      let pw = cfg ? cfg.pixelWidth : 800;
      let ph = cfg ? cfg.pixelHeight : 600;
      let physW = cfg ? cfg.physicalWidth : 800;
      let physH = cfg ? cfg.physicalHeight : 600;
      let unit: 'px' | 'mm' = cfg ? cfg.unit : 'px';

      if (preset === 'CUSTOM' && customW && customH) {
        pw = customW;
        ph = customH;
        physW = customW;
        physH = customH;
        unit = 'px';
      }

      setCanvas((prev) => {
        const updated: CanvasData = {
          ...prev,
          preset,
          width: pw,
          height: ph,
          unit,
          physicalWidth: physW,
          physicalHeight: physH,
          dpi: 96,
        };
        canvasRef.current = updated;
        pushHistorySnapshot({ canvas: updated });
        return updated;
      });
    },
    [pushHistorySnapshot]
  );

  // Auto-fit Zoom to Viewport bounds
  const handleFitZoom = useCallback(() => {
    const viewportEl = document.getElementById('canvas-viewport');
    let availW = viewportEl ? viewportEl.clientWidth - 110 : window.innerWidth - 650;
    let availH = viewportEl ? viewportEl.clientHeight - 110 : window.innerHeight - 170;
    availW = Math.max(240, availW);
    availH = Math.max(240, availH);
    const fitRatio = Math.min(availW / canvas.width, availH / canvas.height);
    const clampedFit = Math.min(1.5, Math.max(0.25, Math.round(fitRatio * 100) / 100));
    setCanvas((prev) => ({ ...prev, zoom: clampedFit }));
    showToast(`畫布縮放已最適化為：${Math.round(clampedFit * 100)}%`);
  }, [canvas.width, canvas.height, showToast]);

  // Save / Open Project
  const handleSaveProject = () => {
    const project: ProjectData = {
      version: '1.0.0',
      canvas: canvasRef.current,
      frames: framesRef.current,
      overlapMode: overlapModeRef.current,
    };
    saveProjectToFile(project, 'my-layout-project.json');
    showToast('專案已成功儲存為 JSON 檔案');
  };

  const handleOpenProjectFile = async (file: File) => {
    try {
      const loaded = await loadProjectFromFile(file);
      const newCanvas = loaded.canvas;
      const newFrames = loaded.frames;
      const newOverlap = loaded.overlapMode || 'allowed';

      canvasRef.current = newCanvas;
      framesRef.current = newFrames;
      overlapModeRef.current = newOverlap;
      selectedFrameIdsRef.current = [];

      setCanvas(newCanvas);
      setFrames(newFrames);
      setOverlapMode(newOverlap);
      setSelectedFrameIds([]);

      pushHistorySnapshot({
        canvas: newCanvas,
        frames: newFrames,
        overlapMode: newOverlap,
        selectedFrameIds: [],
      });
      showToast('專案讀取成功 (版本 ' + loaded.version + ')');
    } catch (err: any) {
      alert(err.message || '專案讀取失敗');
    }
  };

  // Real Export
  const handleExport = async (format: 'png' | 'jpg' | 'pdf' | 'docx') => {
    const project: ProjectData = {
      version: '1.0.0',
      canvas: canvasRef.current,
      frames: framesRef.current,
      overlapMode: overlapModeRef.current,
    };
    try {
      if (format === 'png') {
        await exportToPNG(project, 'layout-design.png');
        showToast('PNG 圖片已匯出 (2x 高解析度)');
      } else if (format === 'jpg') {
        await exportToJPG(project, 'layout-design.jpg');
        showToast('JPG 圖片已匯出');
      } else if (format === 'pdf') {
        await exportToPDF(project, 'layout-design.pdf');
        showToast('PDF 文件已匯出 (高解析度圖片)');
      } else if (format === 'docx') {
        await exportToDOCX(project, 'layout-design.docx');
        showToast('DOCX Word 文件已匯出 (內嵌高品質圖片)');
      }
    } catch (err: any) {
      alert(err.message || '匯出失敗');
    }
  };

  // Global Keyboard Shortcuts (Undo, Redo, Copy, Paste, Delete, Move)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.tagName === 'SELECT';

      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !isInput) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !isInput) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z' && !isInput)
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete or Backspace: Delete selected frames
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedFrameIds.length > 0) {
          e.preventDefault();
          setFrames((prev) => prev.filter((f) => !selectedFrameIds.includes(f.id)));
          setSelectedFrameIds([]);
          setTimeout(commitHistory, 10);
        }
        return;
      }

      // Ctrl+C: Copy selected frame
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !isInput) {
        if (selectedFrameIds.length === 1) {
          const target = frames.find((f) => f.id === selectedFrameIds[0]);
          if (target) {
            setClipboard(JSON.parse(JSON.stringify(target)));
            showToast('已複製圖框');
          }
        }
        return;
      }

      // Ctrl+V: Paste copied frame
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && !isInput) {
        if (clipboard) {
          e.preventDefault();
          const maxZ = frames.reduce((max, f) => Math.max(max, f.zIndex), 0);
          const cloned: FrameData = {
            ...JSON.parse(JSON.stringify(clipboard)),
            id: 'frame-copy-' + Date.now(),
            x: clipboard.x + 25,
            y: clipboard.y + 25,
            zIndex: maxZ + 1,
          };
          setFrames((prev) => [...prev, cloned]);
          setSelectedFrameIds([cloned.id]);
          setTimeout(commitHistory, 10);
          showToast('已貼上圖框');
        }
        return;
      }

      // Arrow keys to nudge selected frames
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !isInput) {
        if (selectedFrameIds.length > 0) {
          e.preventDefault();
          const delta = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
          const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;

          setFrames((prev) =>
            prev.map((f) => {
              if (selectedFrameIds.includes(f.id)) {
                return { ...f, x: f.x + dx, y: f.y + dy };
              }
              return f;
            })
          );
        }
      }

      // Toggle Grid shortcut ('G' or 'g')
      if ((e.key === 'g' || e.key === 'G') && !isInput && !e.ctrlKey && !e.metaKey) {
        setShowGrid((prev) => {
          const next = !prev;
          showToast(`已${next ? '開啟' : '關閉'}對齊格線`);
          return next;
        });
      }

      // Eyedropper shortcut ('I' or 'i')
      if ((e.key === 'i' || e.key === 'I') && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleActivateEyedropper('any');
      }

      // Escape: Deselect all and exit eyedropper
      if (e.key === 'Escape') {
        setSelectedFrameIds([]);
        setMode('select');
        setEyedropperSampledColor(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedFrameIds, frames, clipboard, commitHistory, handleActivateEyedropper]);

  const selectedFrames = frames.filter((f) => selectedFrameIds.includes(f.id));

  return (
    <div id="layout-designer-app" className="w-screen h-screen flex flex-col bg-[#f0eee6] text-[#2e2a25] font-sans overflow-hidden">
      {/* Top Header */}
      <TopBar
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canvas={canvas}
        onChangePreset={handleChangePreset}
        overlapMode={overlapMode}
        onToggleOverlapMode={() => {
          const next = overlapMode === 'allowed' ? 'forbidden' : 'allowed';
          setOverlapMode(next);
          showToast(`已切換為：${next === 'allowed' ? '允許重疊 (自動置頂)' : '禁止重疊 (碰撞還原)'}`);
        }}
        zoom={canvas.zoom}
        onZoomChange={(newZoom) => setCanvas((prev) => ({ ...prev, zoom: newZoom }))}
        onResetZoom={() => setCanvas((prev) => ({ ...prev, zoom: 1 }))}
        onFitZoom={handleFitZoom}
        onSaveProject={handleSaveProject}
        onOpenProjectFile={handleOpenProjectFile}
        onExport={handleExport}
      />

      {/* Main Workspace Area (Left Toolbar + Center Canvas + Right Properties) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        <Toolbar
          mode={mode}
          showGrid={showGrid}
          onToggleGrid={() => {
            setShowGrid((prev) => {
              const next = !prev;
              showToast(`已${next ? '開啟' : '關閉'}對齊格線`);
              return next;
            });
          }}
          onSetMode={setMode}
          onAddFrame={handleAddFrame}
          onAddTextFrame={handleAddTextFrame}
          onUploadImageToSelectedOrNew={handleUploadImageToSelectedOrNew}
          onSelectBackground={() => setSelectedFrameIds([])}
          onActivateEyedropper={() => handleActivateEyedropper('any')}
        />

        {/* Center Canvas Area */}
        <CanvasArea
          canvas={canvas}
          frames={frames}
          selectedFrameIds={selectedFrameIds}
          mode={mode}
          overlapMode={overlapMode}
          zoom={canvas.zoom}
          showGrid={showGrid}
          onSelectFrames={handleSelectFrames}
          onUpdateFrame={handleUpdateFrame}
          onCommitHistory={commitHistory}
          onRequestRotationDialog={(req) => {
            setRotationDialogReq({
              ...req,
              onConfirm: (option) => {
                req.onConfirm(option);
                setRotationDialogReq(null);
              },
              onCancel: () => {
                req.onCancel();
                setRotationDialogReq(null);
              },
            });
          }}
          onPolygonCreated={handlePolygonCreated}
          onSetMode={setMode}
          onBringFront={handleBringFront}
          onReplaceImage={handleReplaceImage}
          onZoomChange={(newZoom) => setCanvas((prev) => ({ ...prev, zoom: newZoom }))}
          onCanvasSampleColor={handleCanvasSampleColor}
        />

        {/* Right Properties Panel */}
        <PropertiesPanel
          selectedFrames={selectedFrames}
          canvas={canvas}
          onUpdateFrame={handleUpdateFrame}
          onUpdateCanvas={handleUpdateCanvas}
          onDeleteFrame={handleDeleteFrame}
          onDeleteContent={handleDeleteContent}
          onDuplicateFrame={handleDuplicateFrame}
          onBringFront={handleBringFront}
          onSendBack={handleSendBack}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onRequestContentSwitch={handleRequestContentSwitch}
          onReplaceImage={handleReplaceImage}
          onAlignMulti={handleAlignMulti}
          onEqualizeMulti={handleEqualizeMulti}
          onDistributeMulti={handleDistributeMulti}
          onTriggerEyedropper={handleActivateEyedropper}
          recentColors={recentColors}
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#34302b] border border-[#48423b] text-[#f7f5f0] text-xs px-4 py-2 rounded-lg shadow-xl tracking-wide animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Frame Rotation Confirmation Modal (Section 13, 16, 17) */}
      {rotationDialogReq && <RotationConfirmModal request={rotationDialogReq} />}

      {/* Content Switching Confirmation Modal (Section 24) */}
      {contentSwitchDialogReq && <ContentSwitchModal request={contentSwitchDialogReq} />}

      {/* Eyedropper Sampled Color Action Modal */}
      {eyedropperSampledColor && (
        <EyedropperResultModal
          color={eyedropperSampledColor}
          selectedFrames={selectedFrames}
          onApplyToCanvasBackground={(color) => {
            handleColorSampled(color, 'canvas-background');
            setEyedropperSampledColor(null);
          }}
          onApplyToFrameBorder={(color) => {
            handleColorSampled(color, 'frame-border');
            setEyedropperSampledColor(null);
          }}
          onApplyToFrameBackground={(color) => {
            handleColorSampled(color, 'frame-background');
            setEyedropperSampledColor(null);
          }}
          onApplyToTextColor={(color) => {
            handleColorSampled(color, 'text-color');
            setEyedropperSampledColor(null);
          }}
          onClose={() => setEyedropperSampledColor(null)}
        />
      )}
    </div>
  );
}
