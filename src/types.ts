/**
 * Data structures and types for Freeform Image Layout Designer
 */

export type CanvasPreset = 'A4_PORTRAIT' | 'A4_LANDSCAPE' | 'A3' | 'A5' | 'CUSTOM';

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'pattern';

export type PatternType = 'none' | 'dots' | 'grid' | 'stripes' | 'checker';

export type PaperTextureType = 'none' | 'washi' | 'kraft' | 'canvas' | 'parchment';

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number; // in degrees for linear
  startColor: string;
  endColor: string;
}

export interface CanvasPresetInfo {
  preset: CanvasPreset;
  label: string;
  unit: 'mm' | 'px';
  physicalWidth: number; // in mm
  physicalHeight: number; // in mm
  pixelWidth: number; // in px at screen display resolution (96 DPI)
  pixelHeight: number;
}

export interface CanvasData {
  width: number; // in px at design display scale
  height: number;
  unit: 'px' | 'mm';
  physicalWidth: number; // Physical dimensions (e.g. 210 for A4 mm)
  physicalHeight: number; // (e.g. 297 for A4 mm)
  dpi: number; // Display resolution DPI, default 96
  preset: CanvasPreset;
  backgroundType: BackgroundType;
  background: string; // solid color e.g. '#ffffff'
  gradient?: GradientConfig;
  backgroundImage?: string; // base64
  pattern?: PatternType;
  paperTexture?: PaperTextureType; // Paper texture overlay
  paperTextureOpacity?: number; // 0..1 (default 0.6)
  zoom: number; // Editor display parameter only, NOT actual canvas size
}

export type FrameShape = 'rectangle' | 'circle' | 'ellipse' | 'polygon';

export type ContentType = 'empty' | 'image' | 'text';

export type ImageDisplayMode = 'cover' | 'contain';

export interface ImageEffects {
  brightness?: number; // 0..200 (%), default 100
  contrast?: number; // 0..200 (%), default 100
  grayscale?: number; // 0..100 (%), default 0
  shadow?: boolean; // Soft shadow toggle, default false
  shadowBlur?: number; // Blur radius in px, default 16
  shadowOpacity?: number; // Shadow opacity 0..1, default 0.2
  shadowColor?: string; // Shadow color hex/rgba, default '#000000'
}

export interface ImageData {
  source: string; // Base64 data URL
  naturalWidth: number;
  naturalHeight: number;
  position: { x: number; y: number }; // Offset in frame-local coords (px)
  scale: number; // Scale multiplier (1 = normal)
  crop: { x: number; y: number; width: number; height: number }; // 0..1 relative crop
  rotation: number; // Image local rotation relative to Frame (degrees)
  opacity: number; // 0..1
  displayMode: ImageDisplayMode;
  effects?: ImageEffects;
}

export interface TextData {
  content: string;
  font: string;
  size: number;
  bold: boolean;
  italic: boolean;
  color: string;
  horizontalAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  autoWrap: boolean;
}

export interface FrameBorder {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  appearance?: 'normal' | 'oil-painting';
}

export interface Point {
  x: number;
  y: number;
}

export interface FrameData {
  id: string;
  x: number; // Canvas coordinates top-left
  y: number;
  width: number;
  height: number;
  shape: FrameShape;
  polygonPoints?: Point[]; // Local relative points 0..1 or local px
  roundedCorners: number; // For rectangle
  rotation: number; // Degrees 0..360, relative to canvas about frame center
  background: string; // Fill color or 'transparent'
  border: FrameBorder;
  pattern?: PatternType;
  zIndex: number;
  contentType: ContentType;
  image?: ImageData;
  text?: TextData;
}

export type EditorMode =
  | 'select'
  | 'frame-edit'
  | 'image-edit'
  | 'text-edit'
  | 'polygon-create';

export type OverlapMode = 'allowed' | 'forbidden';

export interface ProjectData {
  version: string;
  canvas: CanvasData;
  frames: FrameData[];
  overlapMode: OverlapMode;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    name: string;
  };
}

export interface HistoryState {
  frames: FrameData[];
  canvas: CanvasData;
  overlapMode: OverlapMode;
  selectedFrameIds: string[];
}

export interface RotationDialogRequest {
  frameId: string;
  startFrameRotation: number;
  startImageRotation: number;
  onConfirm: (option: 'follow' | 'doNotFollow') => void;
  onCancel: () => void;
}

export interface ContentSwitchDialogRequest {
  frameId: string;
  fromType: ContentType;
  toType: ContentType;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface SmartGuide {
  type: 'x' | 'y';
  position: number;
  start: number;
  end: number;
}

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
