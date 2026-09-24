/**
 * High-fidelity pure Canvas rendering engine
 * Renders Project Data directly to an HTMLCanvasElement
 * Used for Export (PNG, JPG, PDF, DOCX) without UI elements, selection boxes, or guides.
 */

import { CanvasData, FrameData, ProjectData, TextData } from '../types';
import { DEG2RAD } from './geometry';
import { getPaperTextureSvgDataUri } from './texturePatterns';

// Helper to load an image safely from base64 data URL
export function loadImageAsync(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Image Load Failed: ' + e));
    img.src = src;
  });
}

/**
 * Draws pattern on canvas context
 */
function drawPattern(
  ctx: CanvasRenderingContext2D,
  pattern: 'dots' | 'grid' | 'stripes' | 'checker',
  width: number,
  height: number,
  color = 'rgba(0, 0, 0, 0.08)'
) {
  const pCanvas = document.createElement('canvas');
  const pctx = pCanvas.getContext('2d');
  if (!pctx) return;

  const size = 20;
  pCanvas.width = size;
  pCanvas.height = size;

  pctx.strokeStyle = color;
  pctx.fillStyle = color;

  if (pattern === 'grid') {
    pctx.lineWidth = 1;
    pctx.beginPath();
    pctx.moveTo(0, size);
    pctx.lineTo(size, size);
    pctx.moveTo(size, 0);
    pctx.lineTo(size, size);
    pctx.stroke();
  } else if (pattern === 'dots') {
    pctx.beginPath();
    pctx.arc(size / 2, size / 2, 2, 0, Math.PI * 2);
    pctx.fill();
  } else if (pattern === 'stripes') {
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.moveTo(0, size);
    pctx.lineTo(size, 0);
    pctx.stroke();
  } else if (pattern === 'checker') {
    pctx.fillRect(0, 0, size / 2, size / 2);
    pctx.fillRect(size / 2, size / 2, size / 2, size / 2);
  }

  const pat = ctx.createPattern(pCanvas, 'repeat');
  if (pat) {
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Creates clipping path for a frame based on its shape
 */
export function buildFramePath(
  ctx: CanvasRenderingContext2D,
  shape: FrameData['shape'],
  width: number,
  height: number,
  roundedCorners = 0,
  polygonPoints?: { x: number; y: number }[]
) {
  ctx.beginPath();

  if (shape === 'circle') {
    const radius = Math.min(width, height) / 2;
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
  } else if (shape === 'ellipse') {
    ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'polygon' && polygonPoints && polygonPoints.length >= 3) {
    // Relative points 0..1 converted to width/height
    const first = polygonPoints[0];
    ctx.moveTo(first.x * width, first.y * height);
    for (let i = 1; i < polygonPoints.length; i++) {
      ctx.lineTo(polygonPoints[i].x * width, polygonPoints[i].y * height);
    }
    ctx.closePath();
  } else {
    // Rectangle with rounded corners
    const r = Math.min(roundedCorners, width / 2, height / 2);
    if (r > 0) {
      ctx.moveTo(r, 0);
      ctx.lineTo(width - r, 0);
      ctx.arcTo(width, 0, width, r, r);
      ctx.lineTo(width, height - r);
      ctx.arcTo(width, height, width - r, height, r);
      ctx.lineTo(r, height);
      ctx.arcTo(0, height, 0, height - r, r);
      ctx.lineTo(0, r);
      ctx.arcTo(0, 0, r, 0, r);
      ctx.closePath();
    } else {
      ctx.rect(0, 0, width, height);
    }
  }
}

/**
 * Draws text content with auto wrapping and vertical/horizontal alignment
 */
function drawTextContent(
  ctx: CanvasRenderingContext2D,
  text: TextData,
  width: number,
  height: number,
  padding = 12
) {
  const availableWidth = Math.max(10, width - padding * 2);
  const availableHeight = Math.max(10, height - padding * 2);

  const fontStyle = `${text.italic ? 'italic ' : ''}${text.bold ? 'bold ' : ''}${text.size}px ${text.font || 'sans-serif'}`;
  ctx.font = fontStyle;
  ctx.fillStyle = text.color || '#000000';
  ctx.textBaseline = 'alphabetic';

  const lineHeight = text.size * 1.35;
  const rawLines = text.content.split('\n');
  const wrappedLines: string[] = [];

  for (const rawLine of rawLines) {
    if (!text.autoWrap || rawLine.length === 0) {
      wrappedLines.push(rawLine);
      continue;
    }

    // Wrap words/characters
    const words = rawLine.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > availableWidth && currentLine.length > 0) {
        wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      wrappedLines.push(currentLine);
    }
  }

  const totalTextHeight = wrappedLines.length * lineHeight;

  // Determine starting Y based on vertical alignment
  let startY = padding + text.size;
  if (text.verticalAlign === 'middle') {
    startY = padding + (availableHeight - totalTextHeight) / 2 + text.size;
  } else if (text.verticalAlign === 'bottom') {
    startY = height - padding - totalTextHeight + text.size;
  }

  for (let i = 0; i < wrappedLines.length; i++) {
    const line = wrappedLines[i];
    const lineWidth = ctx.measureText(line).width;
    let lineX = padding;

    if (text.horizontalAlign === 'center') {
      lineX = padding + (availableWidth - lineWidth) / 2;
    } else if (text.horizontalAlign === 'right') {
      lineX = width - padding - lineWidth;
    }

    const currentY = startY + i * lineHeight;
    ctx.fillText(line, lineX, currentY);
  }
}

/**
 * Draws frame border, including standard and oil-painting styles
 */
function drawFrameBorder(
  ctx: CanvasRenderingContext2D,
  frame: FrameData
) {
  const border = frame.border;
  if (!border || border.width <= 0) return;

  ctx.save();
  ctx.lineWidth = border.width;
  ctx.strokeStyle = border.color;

  if (border.style === 'dashed') {
    ctx.setLineDash([border.width * 2, border.width * 2]);
  } else if (border.style === 'dotted') {
    ctx.setLineDash([border.width, border.width * 1.5]);
  } else {
    ctx.setLineDash([]);
  }

  // Oil Painting Frame style (decorative classic gilded relief)
  if (border.appearance === 'oil-painting') {
    // Outer bevel
    ctx.lineWidth = Math.max(8, border.width);
    ctx.strokeStyle = '#b8860b'; // Dark goldenrod
    buildFramePath(ctx, frame.shape, frame.width, frame.height, frame.roundedCorners, frame.polygonPoints);
    ctx.stroke();

    // Inner highlight
    ctx.lineWidth = Math.max(3, border.width * 0.4);
    ctx.strokeStyle = '#ffd700'; // Gold highlight
    ctx.stroke();

    // Inner shadow line
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#5a3d0b';
    ctx.stroke();
  } else {
    buildFramePath(ctx, frame.shape, frame.width, frame.height, frame.roundedCorners, frame.polygonPoints);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Pure Canvas Rendering from Project Data
 * Scale factor (e.g. 1 or 2 for high-DPI export)
 */
export async function renderProjectToCanvas(
  project: ProjectData,
  exportScale = 1,
  forcedBackgroundColor?: string
): Promise<HTMLCanvasElement> {
  const { canvas: canvasData, frames } = project;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = Math.round(canvasData.width * exportScale);
  outCanvas.height = Math.round(canvasData.height * exportScale);

  const ctx = outCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D rendering context');

  ctx.scale(exportScale, exportScale);

  // 1. Draw Canvas Background
  if (forcedBackgroundColor) {
    ctx.fillStyle = forcedBackgroundColor;
    ctx.fillRect(0, 0, canvasData.width, canvasData.height);
  } else if (canvasData.backgroundType === 'solid') {
    ctx.fillStyle = canvasData.background || '#ffffff';
    ctx.fillRect(0, 0, canvasData.width, canvasData.height);
  } else if (canvasData.backgroundType === 'gradient' && canvasData.gradient) {
    const grad = canvasData.gradient;
    let canvasGrad: CanvasGradient;
    if (grad.type === 'radial') {
      const cx = canvasData.width / 2;
      const cy = canvasData.height / 2;
      const r = Math.max(cx, cy);
      canvasGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    } else {
      const angleRad = (grad.angle || 0) * DEG2RAD;
      const x1 = canvasData.width / 2 - (Math.cos(angleRad) * canvasData.width) / 2;
      const y1 = canvasData.height / 2 - (Math.sin(angleRad) * canvasData.height) / 2;
      const x2 = canvasData.width / 2 + (Math.cos(angleRad) * canvasData.width) / 2;
      const y2 = canvasData.height / 2 + (Math.sin(angleRad) * canvasData.height) / 2;
      canvasGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    }
    canvasGrad.addColorStop(0, grad.startColor || '#ffffff');
    canvasGrad.addColorStop(1, grad.endColor || '#e2e8f0');
    ctx.fillStyle = canvasGrad;
    ctx.fillRect(0, 0, canvasData.width, canvasData.height);
  } else if (canvasData.backgroundType === 'image' && canvasData.backgroundImage) {
    try {
      const bgImg = await loadImageAsync(canvasData.backgroundImage);
      ctx.drawImage(bgImg, 0, 0, canvasData.width, canvasData.height);
    } catch {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasData.width, canvasData.height);
    }
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasData.width, canvasData.height);
  }

  // Draw pattern if active
  if (canvasData.pattern && canvasData.pattern !== 'none') {
    drawPattern(ctx, canvasData.pattern, canvasData.width, canvasData.height);
  }

  // Draw paper texture overlay if active (和紙、牛皮紙、粗糙畫布、典雅羊皮紙)
  if (canvasData.paperTexture && canvasData.paperTexture !== 'none') {
    try {
      const texUri = getPaperTextureSvgDataUri(canvasData.paperTexture);
      if (texUri) {
        const texImg = await loadImageAsync(texUri);
        ctx.save();
        ctx.globalAlpha = canvasData.paperTextureOpacity ?? 0.6;
        ctx.globalCompositeOperation = 'multiply';
        const pat = ctx.createPattern(texImg, 'repeat');
        if (pat) {
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, canvasData.width, canvasData.height);
        }
        ctx.restore();
      }
    } catch (e) {
      console.warn('Could not draw paper texture to export canvas:', e);
    }
  }

  // 2. Pre-load all frame images
  const imageMap = new Map<string, HTMLImageElement>();
  for (const frame of frames) {
    if (frame.contentType === 'image' && frame.image?.source) {
      try {
        const img = await loadImageAsync(frame.image.source);
        imageMap.set(frame.id, img);
      } catch (err) {
        console.warn(`Could not load image for frame ${frame.id}:`, err);
      }
    }
  }

  // 3. Sort frames by zIndex ascending
  const sortedFrames = [...frames].sort((a, b) => a.zIndex - b.zIndex);

  // 4. Render each frame
  for (const frame of sortedFrames) {
    ctx.save();

    // Frame center in canvas coordinates
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;

    // Move to frame center and apply FRAME ROTATION
    ctx.translate(centerX, centerY);
    ctx.rotate(frame.rotation * DEG2RAD);
    // Translate to frame top-left in local coordinates
    ctx.translate(-frame.width / 2, -frame.height / 2);

    // Draw Frame Soft Shadow if enabled
    if (frame.contentType === 'image' && frame.image?.effects?.shadow) {
      const eff = frame.image.effects;
      ctx.save();
      const blur = eff.shadowBlur ?? 16;
      const opacity = eff.shadowOpacity ?? 0.2;
      const hex = (eff.shadowColor || '#000000').replace('#', '');
      const clean = hex.length === 3 ? hex.split('').map((x) => x + x).join('') : hex;
      const parsed = parseInt(clean, 16);
      const colorStr = isNaN(parsed)
        ? `rgba(0,0,0,${opacity})`
        : `rgba(${(parsed >> 16) & 255}, ${(parsed >> 8) & 255}, ${parsed & 255}, ${opacity})`;

      ctx.shadowColor = colorStr;
      ctx.shadowBlur = blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(2, Math.round(blur * 0.4));
      buildFramePath(ctx, frame.shape, frame.width, frame.height, frame.roundedCorners, frame.polygonPoints);
      ctx.fillStyle = frame.background && frame.background !== 'transparent' ? frame.background : '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // Frame background fill (before clipping or clipped)
    if (frame.background && frame.background !== 'transparent') {
      ctx.save();
      buildFramePath(ctx, frame.shape, frame.width, frame.height, frame.roundedCorners, frame.polygonPoints);
      ctx.fillStyle = frame.background;
      ctx.fill();
      ctx.restore();
    }

    // Apply CLIPPING for Content (Sections 20, 28)
    ctx.save();
    buildFramePath(ctx, frame.shape, frame.width, frame.height, frame.roundedCorners, frame.polygonPoints);
    ctx.clip();

    // Draw Image Content if present
    if (frame.contentType === 'image' && frame.image) {
      const imgData = frame.image;
      const loadedImg = imageMap.get(frame.id);

      if (loadedImg) {
        ctx.save();
        ctx.globalAlpha = imgData.opacity ?? 1;

        // Apply Image visual filter effects (brightness, contrast, grayscale)
        const effects = imgData.effects;
        const brightness = effects?.brightness ?? 100;
        const contrast = effects?.contrast ?? 100;
        const grayscale = effects?.grayscale ?? 0;
        if (brightness !== 100 || contrast !== 100 || grayscale !== 0) {
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`;
        }

        // Image local center relative to frame center
        const imgCenterX = frame.width / 2 + (imgData.position?.x || 0);
        const imgCenterY = frame.height / 2 + (imgData.position?.y || 0);

        ctx.translate(imgCenterX, imgCenterY);
        // IMAGE LOCAL ROTATION (Section 12, 14, 15)
        ctx.rotate((imgData.rotation || 0) * DEG2RAD);

        // Image Crop parameters (normalized 0..1 relative coordinates)
        const crop = imgData.crop || { x: 0, y: 0, width: 1, height: 1 };
        const safeCropX = Math.max(0, Math.min(0.99, crop.x || 0));
        const safeCropY = Math.max(0, Math.min(0.99, crop.y || 0));
        const safeCropW = Math.max(0.01, Math.min(1 - safeCropX, crop.width || 1));
        const safeCropH = Math.max(0.01, Math.min(1 - safeCropY, crop.height || 1));

        const natW = loadedImg.naturalWidth || 100;
        const natH = loadedImg.naturalHeight || 100;

        const sx = safeCropX * natW;
        const sy = safeCropY * natH;
        const sw = safeCropW * natW;
        const sh = safeCropH * natH;

        // Determine base dimensions from displayMode based on cropped aspect ratio
        let baseW = sw;
        let baseH = sh;

        if (imgData.displayMode === 'cover') {
          const scaleRatio = Math.max(frame.width / baseW, frame.height / baseH);
          baseW = baseW * scaleRatio;
          baseH = baseH * scaleRatio;
        } else if (imgData.displayMode === 'contain') {
          const scaleRatio = Math.min(frame.width / baseW, frame.height / baseH);
          baseW = baseW * scaleRatio;
          baseH = baseH * scaleRatio;
        }

        const finalW = baseW * (imgData.scale || 1);
        const finalH = baseH * (imgData.scale || 1);

        ctx.drawImage(
          loadedImg,
          sx,
          sy,
          sw,
          sh,
          -finalW / 2,
          -finalH / 2,
          finalW,
          finalH
        );

        ctx.restore();
      }
    } else if (frame.contentType === 'text' && frame.text) {
      // Draw Text Content
      drawTextContent(ctx, frame.text, frame.width, frame.height);
    }

    // Restore clipping
    ctx.restore();

    // Draw Frame Border
    drawFrameBorder(ctx, frame);

    // Restore Frame transform
    ctx.restore();
  }

  return outCanvas;
}

/**
 * Samples the color (in hex format '#rrggbb') of the canvas at the given canvas coordinates.
 * Renders the canvas layers and extracts the exact RGB pixel.
 */
export async function sampleCanvasPixel(
  canvas: CanvasData,
  frames: FrameData[],
  canvasX: number,
  canvasY: number
): Promise<string> {
  const project: ProjectData = {
    version: '1.0.0',
    canvas,
    frames,
    overlapMode: 'allowed',
  };

  const renderedCanvas = await renderProjectToCanvas(project, 1);
  const ctx = renderedCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '#ffffff';

  const px = Math.floor(Math.max(0, Math.min(canvas.width - 1, canvasX)));
  const py = Math.floor(Math.max(0, Math.min(canvas.height - 1, canvasY)));
  const pixel = ctx.getImageData(px, py, 1, 1).data;

  // Convert RGB components to 6-character hex code
  const r = pixel[0].toString(16).padStart(2, '0');
  const g = pixel[1].toString(16).padStart(2, '0');
  const b = pixel[2].toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toLowerCase();
}
