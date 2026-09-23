/**
 * Geometric transformations, rotation calculations, local axes resize,
 * coordinate systems, and collision detection (SAT)
 */

import { FrameData, Point, SmartGuide } from '../types';

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

/**
 * Normalizes an angle to 0..360 range
 */
export function normalizeAngle(deg: number): number {
  let angle = deg % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Gets the center point of a frame in Canvas coordinates
 */
export function getFrameCenter(frame: FrameData): Point {
  return {
    x: frame.x + frame.width / 2,
    y: frame.y + frame.height / 2,
  };
}

/**
 * Rotate a point around a center by an angle in degrees
 */
export function rotatePoint(point: Point, center: Point, angleDeg: number): Point {
  const rad = angleDeg * DEG2RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Convert Canvas coordinate to Frame-local coordinate (relative to frame top-left before rotation)
 */
export function canvasToFrameLocal(canvasPoint: Point, frame: FrameData): Point {
  const center = getFrameCenter(frame);
  const unrotated = rotatePoint(canvasPoint, center, -frame.rotation);
  return {
    x: unrotated.x - frame.x,
    y: unrotated.y - frame.y,
  };
}

/**
 * Convert Frame-local coordinate (relative to top-left) to Canvas coordinate
 */
export function frameLocalToCanvas(localPoint: Point, frame: FrameData): Point {
  const center = getFrameCenter(frame);
  const unrotated = {
    x: frame.x + localPoint.x,
    y: frame.y + localPoint.y,
  };
  return rotatePoint(unrotated, center, frame.rotation);
}

/**
 * Gets the 4 corners of a rotated frame in Canvas coordinates
 */
export function getFrameCorners(frame: FrameData): [Point, Point, Point, Point] {
  const center = getFrameCenter(frame);
  const halfW = frame.width / 2;
  const halfH = frame.height / 2;

  // Local corners relative to center
  const corners: Point[] = [
    { x: center.x - halfW, y: center.y - halfH }, // top-left (NW)
    { x: center.x + halfW, y: center.y - halfH }, // top-right (NE)
    { x: center.x + halfW, y: center.y + halfH }, // bottom-right (SE)
    { x: center.x - halfW, y: center.y + halfH }, // bottom-left (SW)
  ];

  return corners.map((p) => rotatePoint(p, center, frame.rotation)) as [
    Point,
    Point,
    Point,
    Point,
  ];
}

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * Calculates new Frame geometry when resizing along Frame's LOCAL axes.
 * Keeps the opposite handle stationary in Canvas coordinates.
 * Strictly adheres to Section 19:
 * "Resize 必須沿 Frame 自己的 local axes 進行。不要使用旋轉後的 Canvas bounding box 當成 Frame 的 width / height。"
 */
export function calculateRotatedResize(
  frame: FrameData,
  handle: ResizeHandleType,
  currentCanvasPoint: Point,
  minSize = 20
): { x: number; y: number; width: number; height: number } {
  const rad = frame.rotation * DEG2RAD;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const center = getFrameCenter(frame);
  const halfW = frame.width / 2;
  const halfH = frame.height / 2;

  // Local position of the opposite handle relative to center
  let oppositeLocal: Point;
  // Which axes are affected
  let affectsWidth = false;
  let affectsHeight = false;
  // Sign in local coords: positive if handle is on right/bottom, negative if left/top
  let dirX = 1;
  let dirY = 1;

  switch (handle) {
    case 'se':
      oppositeLocal = { x: -halfW, y: -halfH };
      affectsWidth = true;
      affectsHeight = true;
      dirX = 1;
      dirY = 1;
      break;
    case 'nw':
      oppositeLocal = { x: halfW, y: halfH };
      affectsWidth = true;
      affectsHeight = true;
      dirX = -1;
      dirY = -1;
      break;
    case 'ne':
      oppositeLocal = { x: -halfW, y: halfH };
      affectsWidth = true;
      affectsHeight = true;
      dirX = 1;
      dirY = -1;
      break;
    case 'sw':
      oppositeLocal = { x: halfW, y: -halfH };
      affectsWidth = true;
      affectsHeight = true;
      dirX = -1;
      dirY = 1;
      break;
    case 'e':
      oppositeLocal = { x: -halfW, y: 0 };
      affectsWidth = true;
      affectsHeight = false;
      dirX = 1;
      break;
    case 'w':
      oppositeLocal = { x: halfW, y: 0 };
      affectsWidth = true;
      affectsHeight = false;
      dirX = -1;
      break;
    case 's':
      oppositeLocal = { x: 0, y: -halfH };
      affectsWidth = false;
      affectsHeight = true;
      dirY = 1;
      break;
    case 'n':
      oppositeLocal = { x: 0, y: halfH };
      affectsWidth = false;
      affectsHeight = true;
      dirY = -1;
      break;
  }

  // Canvas coordinate of the fixed opposite point
  const fixedCanvasPoint = {
    x: center.x + (oppositeLocal.x * cos - oppositeLocal.y * sin),
    y: center.y + (oppositeLocal.x * sin + oppositeLocal.y * cos),
  };

  // Vector from fixed point to current mouse position in Canvas coords
  const vecCanvas = {
    x: currentCanvasPoint.x - fixedCanvasPoint.x,
    y: currentCanvasPoint.y - fixedCanvasPoint.y,
  };

  // Unrotate vector into frame local axes (rotate by -rad)
  const vecLocal = {
    x: vecCanvas.x * cos + vecCanvas.y * sin,
    y: -vecCanvas.x * sin + vecCanvas.y * cos,
  };

  let newWidth = frame.width;
  let newHeight = frame.height;

  if (affectsWidth) {
    const rawW = vecLocal.x * dirX;
    newWidth = Math.max(minSize, rawW);
  }

  if (affectsHeight) {
    const rawH = vecLocal.y * dirY;
    newHeight = Math.max(minSize, rawH);
  }

  // Calculate new center based on fixed point and new dimensions
  // In local space, vector from opposite point to new center:
  const newCenterOffsetLocal = {
    x: affectsWidth ? (dirX * newWidth) / 2 : oppositeLocal.x === 0 ? 0 : -oppositeLocal.x,
    y: affectsHeight ? (dirY * newHeight) / 2 : oppositeLocal.y === 0 ? 0 : -oppositeLocal.y,
  };

  const newCenter = {
    x: fixedCanvasPoint.x + (newCenterOffsetLocal.x * cos - newCenterOffsetLocal.y * sin),
    y: fixedCanvasPoint.y + (newCenterOffsetLocal.x * sin + newCenterOffsetLocal.y * cos),
  };

  return {
    x: newCenter.x - newWidth / 2,
    y: newCenter.y - newHeight / 2,
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Separating Axis Theorem (SAT) collision detection between two oriented polygons
 */
function getAxes(polygon: Point[]): Point[] {
  const axes: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
    // Normal vector
    const normal = { x: -edge.y, y: edge.x };
    const len = Math.hypot(normal.x, normal.y);
    if (len > 0.0001) {
      axes.push({ x: normal.x / len, y: normal.y / len });
    }
  }
  return axes;
}

function projectPolygon(axis: Point, polygon: Point[]): { min: number; max: number } {
  let min = axis.x * polygon[0].x + axis.y * polygon[0].y;
  let max = min;
  for (let i = 1; i < polygon.length; i++) {
    const dot = axis.x * polygon[i].x + axis.y * polygon[i].y;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return { min, max };
}

/**
 * Check if two convex polygons overlap using SAT
 */
export function checkPolygonsOverlap(polyA: Point[], polyB: Point[]): boolean {
  const axes = [...getAxes(polyA), ...getAxes(polyB)];
  for (const axis of axes) {
    const projA = projectPolygon(axis, polyA);
    const projB = projectPolygon(axis, polyB);
    // If projections do not overlap, there is a separating axis => no collision
    if (projA.max <= projB.min || projB.max <= projA.min) {
      return false;
    }
  }
  return true;
}

/**
 * Check if two frames collide/overlap
 */
export function checkFramesOverlap(frameA: FrameData, frameB: FrameData): boolean {
  const polyA = getFrameCorners(frameA);
  const polyB = getFrameCorners(frameB);
  return checkPolygonsOverlap(polyA, polyB);
}

/**
 * Smart guides & snap calculation for dragging a frame
 */
export function calculateSnapping(
  frame: FrameData,
  otherFrames: FrameData[],
  canvasWidth: number,
  canvasHeight: number,
  threshold = 6
): { snappedX: number; snappedY: number; guides: SmartGuide[] } {
  let snappedX = frame.x;
  let snappedY = frame.y;
  const guides: SmartGuide[] = [];

  const fWidth = frame.width;
  const fHeight = frame.height;

  const fLeft = frame.x;
  const fCenter = frame.x + fWidth / 2;
  const fRight = frame.x + fWidth;

  const fTop = frame.y;
  const fMiddle = frame.y + fHeight / 2;
  const fBottom = frame.y + fHeight;

  // X Snap targets: Canvas left (0), Canvas center (w/2), Canvas right (w)
  const xTargets: { pos: number; label: string }[] = [
    { pos: 0, label: 'canvas-left' },
    { pos: canvasWidth / 2, label: 'canvas-center' },
    { pos: canvasWidth, label: 'canvas-right' },
  ];

  // Y Snap targets: Canvas top (0), Canvas middle (h/2), Canvas bottom (h)
  const yTargets: { pos: number; label: string }[] = [
    { pos: 0, label: 'canvas-top' },
    { pos: canvasHeight / 2, label: 'canvas-middle' },
    { pos: canvasHeight, label: 'canvas-bottom' },
  ];

  // Add targets from other frames
  for (const other of otherFrames) {
    if (other.id === frame.id) continue;
    xTargets.push(
      { pos: other.x, label: 'other-left' },
      { pos: other.x + other.width / 2, label: 'other-center' },
      { pos: other.x + other.width, label: 'other-right' }
    );
    yTargets.push(
      { pos: other.y, label: 'other-top' },
      { pos: other.y + other.height / 2, label: 'other-middle' },
      { pos: other.y + other.height, label: 'other-bottom' }
    );
  }

  // Check X snap
  let minDiffX = threshold + 1;
  let bestSnapX: number | null = null;
  let bestGuideX: SmartGuide | null = null;

  for (const target of xTargets) {
    // Check left edge to target
    const diffLeft = Math.abs(fLeft - target.pos);
    if (diffLeft < threshold && diffLeft < minDiffX) {
      minDiffX = diffLeft;
      bestSnapX = target.pos;
      bestGuideX = {
        type: 'x',
        position: target.pos,
        start: 0,
        end: canvasHeight,
      };
    }
    // Check center to target
    const diffCenter = Math.abs(fCenter - target.pos);
    if (diffCenter < threshold && diffCenter < minDiffX) {
      minDiffX = diffCenter;
      bestSnapX = target.pos - fWidth / 2;
      bestGuideX = {
        type: 'x',
        position: target.pos,
        start: 0,
        end: canvasHeight,
      };
    }
    // Check right edge to target
    const diffRight = Math.abs(fRight - target.pos);
    if (diffRight < threshold && diffRight < minDiffX) {
      minDiffX = diffRight;
      bestSnapX = target.pos - fWidth;
      bestGuideX = {
        type: 'x',
        position: target.pos,
        start: 0,
        end: canvasHeight,
      };
    }
  }

  if (bestSnapX !== null && bestGuideX) {
    snappedX = bestSnapX;
    guides.push(bestGuideX);
  }

  // Check Y snap
  let minDiffY = threshold + 1;
  let bestSnapY: number | null = null;
  let bestGuideY: SmartGuide | null = null;

  for (const target of yTargets) {
    const diffTop = Math.abs(fTop - target.pos);
    if (diffTop < threshold && diffTop < minDiffY) {
      minDiffY = diffTop;
      bestSnapY = target.pos;
      bestGuideY = {
        type: 'y',
        position: target.pos,
        start: 0,
        end: canvasWidth,
      };
    }
    const diffMiddle = Math.abs(fMiddle - target.pos);
    if (diffMiddle < threshold && diffMiddle < minDiffY) {
      minDiffY = diffMiddle;
      bestSnapY = target.pos - fHeight / 2;
      bestGuideY = {
        type: 'y',
        position: target.pos,
        start: 0,
        end: canvasWidth,
      };
    }
    const diffBottom = Math.abs(fBottom - target.pos);
    if (diffBottom < threshold && diffBottom < minDiffY) {
      minDiffY = diffBottom;
      bestSnapY = target.pos - fHeight;
      bestGuideY = {
        type: 'y',
        position: target.pos,
        start: 0,
        end: canvasWidth,
      };
    }
  }

  if (bestSnapY !== null && bestGuideY) {
    snappedY = bestSnapY;
    guides.push(bestGuideY);
  }

  return { snappedX, snappedY, guides };
}
