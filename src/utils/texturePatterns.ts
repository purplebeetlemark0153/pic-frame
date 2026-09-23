/**
 * Procedural Paper Texture SVG Patterns and Canvas Renderers
 * Provides high-fidelity tactile paper textures: Washi, Kraft, Rough Canvas, Parchment
 */

import { PaperTextureType } from '../types';

/**
 * Returns an inline SVG data URI representing the paper texture
 */
export function getPaperTextureSvgDataUri(type: PaperTextureType): string {
  if (type === 'none') return '';

  if (type === 'washi') {
    // Japanese Handmade Washi Paper (和紙)
    // Organic kozo/mulberry paper fibers with subtle directional grain and fibrous flecks
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <defs>
        <filter id="washi-noise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045 0.035" numOctaves="4" seed="7" result="noise"/>
          <feColorMatrix type="matrix" values="
            0 0 0 0 0.22
            0 0 0 0 0.18
            0 0 0 0 0.14
            0 0 0 0.18 0" in="noise" result="coloredNoise"/>
        </filter>
        <pattern id="washi-fibers" width="150" height="150" patternUnits="userSpaceOnUse">
          <!-- Fine mulberry fibrous strands -->
          <path d="M12,24 Q35,28 65,18 T110,32" stroke="rgba(115,95,75,0.16)" stroke-width="0.8" fill="none" stroke-linecap="round"/>
          <path d="M45,85 Q75,95 105,75 T142,90" stroke="rgba(115,95,75,0.14)" stroke-width="0.75" fill="none" stroke-linecap="round"/>
          <path d="M8,115 Q38,105 72,125 T125,110" stroke="rgba(100,85,65,0.15)" stroke-width="0.9" fill="none" stroke-linecap="round"/>
          <path d="M90,15 Q115,40 135,20" stroke="rgba(120,100,80,0.12)" stroke-width="0.6" fill="none"/>
          <path d="M20,60 Q50,45 80,68" stroke="rgba(130,110,85,0.13)" stroke-width="0.7" fill="none"/>
          <circle cx="28" cy="72" r="0.9" fill="rgba(90,75,55,0.2)"/>
          <circle cx="88" cy="42" r="1.1" fill="rgba(90,75,55,0.18)"/>
          <circle cx="120" cy="120" r="0.8" fill="rgba(90,75,55,0.19)"/>
          <circle cx="62" cy="138" r="1.2" fill="rgba(85,70,50,0.22)"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" filter="url(#washi-noise)"/>
      <rect width="100%" height="100%" fill="url(#washi-fibers)"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (type === 'kraft') {
    // Kraft Paper (牛皮紙)
    // Warm earthy texture with rich wood-pulp speckles and fibrous density
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260">
      <defs>
        <filter id="kraft-noise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.065 0.055" numOctaves="4" seed="12" result="noise"/>
          <feColorMatrix type="matrix" values="
            0 0 0 0 0.38
            0 0 0 0 0.28
            0 0 0 0 0.18
            0 0 0 0.32 0" in="noise" result="coloredNoise"/>
        </filter>
        <pattern id="kraft-speckles" width="130" height="130" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="22" r="1.2" fill="rgba(70,45,25,0.35)"/>
          <circle cx="48" cy="85" r="0.9" fill="rgba(60,40,20,0.4)"/>
          <circle cx="95" cy="35" r="1.4" fill="rgba(75,50,30,0.3)"/>
          <circle cx="112" cy="98" r="1.1" fill="rgba(65,42,22,0.38)"/>
          <circle cx="75" cy="115" r="0.8" fill="rgba(80,55,35,0.32)"/>
          <circle cx="32" cy="50" r="1.3" fill="rgba(70,45,25,0.3)"/>
          <path d="M22,95 L27,98" stroke="rgba(60,38,20,0.4)" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M82,18 L87,22" stroke="rgba(60,38,20,0.35)" stroke-width="1.1" stroke-linecap="round"/>
          <path d="M102,68 L108,70" stroke="rgba(70,45,25,0.38)" stroke-width="1.3" stroke-linecap="round"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" filter="url(#kraft-noise)"/>
      <rect width="100%" height="100%" fill="url(#kraft-speckles)"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (type === 'canvas') {
    // Rough Canvas / Artist Linen (粗糙畫布)
    // Tactile cross-woven warp and weft threads with heavy fabric texture
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <filter id="canvas-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" seed="5" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0"/>
        </filter>
      </defs>
      <!-- Base thread grid -->
      <rect width="32" height="32" fill="none"/>
      <!-- Horizontal warp weave -->
      <path d="M0,4 L32,4 M0,12 L32,12 M0,20 L32,20 M0,28 L32,28" stroke="rgba(0,0,0,0.18)" stroke-width="2.5" stroke-dasharray="4,4"/>
      <path d="M0,8 L32,8 M0,16 L32,16 M0,24 L32,24 M0,32 L32,32" stroke="rgba(0,0,0,0.14)" stroke-width="2.5" stroke-dasharray="4,4" stroke-dashoffset="4"/>
      <!-- Vertical weft weave -->
      <path d="M4,0 L4,32 M12,0 L12,32 M20,0 L20,32 M28,0 L28,32" stroke="rgba(0,0,0,0.16)" stroke-width="2.5" stroke-dasharray="4,4" stroke-dashoffset="2"/>
      <path d="M8,0 L8,32 M16,0 L16,32 M24,0 L24,32 M32,0 L32,32" stroke="rgba(0,0,0,0.12)" stroke-width="2.5" stroke-dasharray="4,4" stroke-dashoffset="6"/>
      <!-- Fine highlights for tactile 3D thread relief -->
      <path d="M2,2 L6,2 M18,2 L22,2 M10,10 L14,10 M26,10 L30,10" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
      <rect width="32" height="32" filter="url(#canvas-grain)"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (type === 'parchment') {
    // Vintage Parchment (典雅羊皮紙)
    // Cloudy, mottled tea-stained antique paper with organic soft grain
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <defs>
        <filter id="parchment-mottle" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.012" numOctaves="4" seed="3" result="clouds"/>
          <feColorMatrix type="matrix" values="
            0 0 0 0 0.42
            0 0 0 0 0.32
            0 0 0 0 0.16
            0 0 0 0.28 0" in="clouds" result="stain"/>
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="9" result="fineGrain"/>
          <feColorMatrix type="matrix" values="
            0 0 0 0 0.2
            0 0 0 0 0.15
            0 0 0 0 0.1
            0 0 0 0.14 0" in="fineGrain" result="grain"/>
          <feMerge>
            <feMergeNode in="stain"/>
            <feMergeNode in="grain"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#parchment-mottle)"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  return '';
}

/**
 * Helper to draw paper texture onto an HTMLCanvasElement context
 */
export function drawPaperTextureToCanvas(
  ctx: CanvasRenderingContext2D,
  type: PaperTextureType,
  width: number,
  height: number,
  opacity = 0.5
) {
  if (type === 'none') return;

  const dataUri = getPaperTextureSvgDataUri(type);
  if (!dataUri) return;

  const img = new Image();
  img.src = dataUri;

  const render = () => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.globalCompositeOperation = 'multiply';

    const pat = ctx.createPattern(img, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  };

  if (img.complete && img.naturalWidth > 0) {
    render();
  }
}
