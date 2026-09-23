import React, { useRef } from 'react';
import {
  FrameData,
  CanvasData,
  Point,
  ImageEffects,
  PaperTextureType,
} from '../types';
import {
  Copy,
  Trash2,
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ChevronDown,
  RotateCw,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sliders,
  Maximize,
  Minimize,
  Palette,
  Sparkles,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  ArrowLeftRight,
  ArrowUpDown,
  Equal,
  Sun,
  Contrast,
  RotateCcw,
  Scroll,
  Crop,
} from 'lucide-react';

interface Props {
  selectedFrames: FrameData[];
  canvas: CanvasData;
  onUpdateFrame: (frameId: string, updates: Partial<FrameData>, shouldCommit?: boolean) => void;
  onUpdateCanvas: (updates: Partial<CanvasData>) => void;
  onDeleteFrame: (frameId: string) => void;
  onDeleteContent: (frameId: string) => void;
  onDuplicateFrame: (frameId: string) => void;
  onBringFront: (frameId: string) => void;
  onSendBack: (frameId: string) => void;
  onMoveUp: (frameId: string) => void;
  onMoveDown: (frameId: string) => void;
  onRequestContentSwitch: (frameId: string, toType: 'empty' | 'image' | 'text') => void;
  onReplaceImage: (frameId: string, file: File) => void;
  // Multi-select alignment actions (Section 38)
  onAlignMulti: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onEqualizeMulti: (dimension: 'width' | 'height') => void;
  onDistributeMulti: (direction: 'horizontal' | 'vertical') => void;
}

export const PropertiesPanel: React.FC<Props> = ({
  selectedFrames,
  canvas,
  onUpdateFrame,
  onUpdateCanvas,
  onDeleteFrame,
  onDeleteContent,
  onDuplicateFrame,
  onBringFront,
  onSendBack,
  onMoveUp,
  onMoveDown,
  onRequestContentSwitch,
  onReplaceImage,
  onAlignMulti,
  onEqualizeMulti,
  onDistributeMulti,
}) => {
  const replaceImgInputRef = useRef<HTMLInputElement>(null);
  const bgImgInputRef = useRef<HTMLInputElement>(null);

  // 1. MULTI-SELECT MODE (Section 38)
  if (selectedFrames.length > 1) {
    return (
      <aside
        id="properties-panel-multi"
        className="w-72 bg-[#faf9f5] border-l border-[#e5e1d8] p-4 flex flex-col gap-5 text-[#38332c] overflow-y-auto select-none shrink-0"
      >
        <div className="border-b border-[#e5e1d8] pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#556354]">多選物件對齊</h2>
            <span className="text-[11px] bg-[#edeae1] border border-[#d8d3c5] text-[#556354] px-2 py-0.5 rounded-full font-medium">
              已選取 {selectedFrames.length} 個圖框
            </span>
          </div>
        </div>

        {/* Alignments */}
        <div className="space-y-3">
          <label className="text-[11px] font-medium text-[#736c62] block">水平與垂直對齊</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-align-left"
              onClick={() => onAlignMulti('left')}
              title="靠左對齊"
              className="p-2 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex flex-col items-center gap-1 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <AlignStartHorizontal className="w-4 h-4 text-[#5c554a]" />
              <span className="text-[10px]">靠左</span>
            </button>
            <button
              id="btn-align-center"
              onClick={() => onAlignMulti('center')}
              title="水平置中"
              className="p-2 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex flex-col items-center gap-1 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <AlignCenterHorizontal className="w-4 h-4 text-[#5c554a]" />
              <span className="text-[10px]">置中</span>
            </button>
            <button
              id="btn-align-right"
              onClick={() => onAlignMulti('right')}
              title="靠右對齊"
              className="p-2 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex flex-col items-center gap-1 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <AlignEndHorizontal className="w-4 h-4 text-[#5c554a]" />
              <span className="text-[10px]">靠右</span>
            </button>

            <button
              id="btn-align-top"
              onClick={() => onAlignMulti('top')}
              title="靠頂對齊"
              className="p-2 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex flex-col items-center gap-1 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <AlignStartVertical className="w-4 h-4 text-[#5c554a]" />
              <span className="text-[10px]">靠頂</span>
            </button>
            <button
              id="btn-align-middle"
              onClick={() => onAlignMulti('middle')}
              title="垂直置中"
              className="p-2 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex flex-col items-center gap-1 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <AlignCenterVertical className="w-4 h-4 text-[#5c554a]" />
              <span className="text-[10px]">垂直置中</span>
            </button>
            <button
              id="btn-align-bottom"
              onClick={() => onAlignMulti('bottom')}
              title="靠底對齊"
              className="p-2 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex flex-col items-center gap-1 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <AlignEndVertical className="w-4 h-4 text-[#5c554a]" />
              <span className="text-[10px]">靠底</span>
            </button>
          </div>
        </div>

        {/* Equal Sizing */}
        <div className="space-y-3">
          <label className="text-[11px] font-medium text-[#736c62] block">等寬等高設定</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-equal-width"
              onClick={() => onEqualizeMulti('width')}
              title="設為相同寬度 (以最先選取的寬度為基準)"
              className="p-2.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex items-center justify-center gap-1.5 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <Equal className="w-4 h-4 text-[#556354]" />
              <span>等寬</span>
            </button>
            <button
              id="btn-equal-height"
              onClick={() => onEqualizeMulti('height')}
              title="設為相同高度 (以最先選取的高度為基準)"
              className="p-2.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex items-center justify-center gap-1.5 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <Equal className="w-4 h-4 text-[#556354]" />
              <span>等高</span>
            </button>
          </div>
        </div>

        {/* Equal Spacing */}
        <div className="space-y-3">
          <label className="text-[11px] font-medium text-[#736c62] block">均勻間距分佈</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-distribute-h"
              onClick={() => onDistributeMulti('horizontal')}
              title="等水平間距"
              className="p-2.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex items-center justify-center gap-1.5 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#556354]" />
              <span>等水平間隔</span>
            </button>
            <button
              id="btn-distribute-v"
              onClick={() => onDistributeMulti('vertical')}
              title="等垂直間距"
              className="p-2.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg flex items-center justify-center gap-1.5 text-xs cursor-pointer text-[#484138] transition-colors"
            >
              <ArrowUpDown className="w-4 h-4 text-[#556354]" />
              <span>等垂直間隔</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 2. CANVAS SETTINGS (When 0 frames selected)
  if (selectedFrames.length === 0) {
    return (
      <aside
        id="properties-panel-canvas"
        className="w-72 bg-[#faf9f5] border-l border-[#e5e1d8] p-4 flex flex-col gap-5 text-[#38332c] overflow-y-auto select-none shrink-0"
      >
        <div className="border-b border-[#e5e1d8] pb-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#556354]">畫布屬性</h2>
            <span className="text-[11px] font-medium text-[#463f37] font-mono">
              {canvas.unit === 'mm' && canvas.physicalWidth
                ? `${canvas.physicalWidth} × ${canvas.physicalHeight} mm`
                : `${canvas.width} × ${canvas.height} px`}
            </span>
          </div>
          <div className="text-[10px] text-[#8c8275] flex items-center justify-between bg-[#f4f2eb] px-2 py-1 rounded">
            <span>顯示解析度:</span>
            <span className="font-mono text-[#556354]">{canvas.width} × {canvas.height} px (96 DPI)</span>
          </div>
        </div>

        {/* Background Type */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-[#736c62] block">背景類型</label>
          <div className="grid grid-cols-4 gap-1 bg-[#edeae1] p-1 rounded-lg">
            {(['solid', 'gradient', 'image', 'pattern'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onUpdateCanvas({ backgroundType: type })}
                className={`py-1.5 text-[11px] rounded transition-colors cursor-pointer capitalize ${
                  canvas.backgroundType === type ? 'bg-[#556354] text-white font-medium shadow-xs' : 'text-[#736c62] hover:text-[#2c2824]'
                }`}
              >
                {type === 'solid' ? '單色' : type === 'gradient' ? '漸層' : type === 'image' ? '圖片' : '紋理'}
              </button>
            ))}
          </div>
        </div>

        {/* Solid Color */}
        {canvas.backgroundType === 'solid' && (
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-[#736c62] block">畫布底色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={canvas.background}
                onChange={(e) => onUpdateCanvas({ background: e.target.value })}
                className="w-8 h-8 rounded border border-[#d8d3c5] bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={canvas.background}
                onChange={(e) => onUpdateCanvas({ background: e.target.value })}
                className="flex-1 bg-[#ffffff] border border-[#d8d3c5] rounded px-2.5 py-1 text-xs text-[#2c2824] font-mono focus:outline-none focus:border-[#556354]"
              />
            </div>
          </div>
        )}

        {/* Gradient */}
        {canvas.backgroundType === 'gradient' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="text-[11px] font-medium text-[#736c62]">漸層類型</label>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onUpdateCanvas({
                      gradient: {
                        type: 'linear',
                        angle: canvas.gradient?.angle ?? 90,
                        startColor: canvas.gradient?.startColor ?? '#ffffff',
                        endColor: canvas.gradient?.endColor ?? '#f5f3ec',
                      },
                    })
                  }
                  className={`text-[11px] px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                    canvas.gradient?.type === 'linear' ? 'bg-[#556354] text-white font-medium' : 'bg-[#edeae1] text-[#736c62] hover:text-[#2c2824]'
                  }`}
                >
                  線性
                </button>
                <button
                  onClick={() =>
                    onUpdateCanvas({
                      gradient: {
                        type: 'radial',
                        angle: 0,
                        startColor: canvas.gradient?.startColor ?? '#ffffff',
                        endColor: canvas.gradient?.endColor ?? '#e6e1d5',
                      },
                    })
                  }
                  className={`text-[11px] px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                    canvas.gradient?.type === 'radial' ? 'bg-[#556354] text-white font-medium' : 'bg-[#edeae1] text-[#736c62] hover:text-[#2c2824]'
                  }`}
                >
                  放射
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-[#8c8275] block mb-1">起始顏色</label>
                <input
                  type="color"
                  value={canvas.gradient?.startColor || '#ffffff'}
                  onChange={(e) =>
                    onUpdateCanvas({
                      gradient: {
                        type: canvas.gradient?.type || 'linear',
                        angle: canvas.gradient?.angle || 0,
                        startColor: e.target.value,
                        endColor: canvas.gradient?.endColor || '#f5f3ec',
                      },
                    })
                  }
                  className="w-full h-8 rounded border border-[#d8d3c5] bg-transparent cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8c8275] block mb-1">結束顏色</label>
                <input
                  type="color"
                  value={canvas.gradient?.endColor || '#f5f3ec'}
                  onChange={(e) =>
                    onUpdateCanvas({
                      gradient: {
                        type: canvas.gradient?.type || 'linear',
                        angle: canvas.gradient?.angle || 0,
                        startColor: canvas.gradient?.startColor || '#ffffff',
                        endColor: e.target.value,
                      },
                    })
                  }
                  className="w-full h-8 rounded border border-[#d8d3c5] bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {canvas.gradient?.type === 'linear' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#736c62]">
                  <span>漸層角度</span>
                  <span>{canvas.gradient?.angle ?? 90}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={canvas.gradient?.angle ?? 90}
                  onChange={(e) =>
                    onUpdateCanvas({
                      gradient: {
                        type: 'linear',
                        angle: Number(e.target.value),
                        startColor: canvas.gradient?.startColor || '#ffffff',
                        endColor: canvas.gradient?.endColor || '#f5f3ec',
                      },
                    })
                  }
                  className="w-full accent-[#556354]"
                />
              </div>
            )}
          </div>
        )}

        {/* Background Image */}
        {canvas.backgroundType === 'image' && (
          <div className="space-y-2">
            <input
              ref={bgImgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    onUpdateCanvas({ backgroundImage: reader.result as string });
                  };
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
            />
            <button
              onClick={() => bgImgInputRef.current?.click()}
              className="w-full py-2 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded-lg text-xs font-medium text-[#38332c] transition-colors cursor-pointer"
            >
              上傳背景圖片
            </button>
            {canvas.backgroundImage && (
              <button
                onClick={() => onUpdateCanvas({ backgroundImage: undefined })}
                className="w-full py-1 text-[11px] text-[#a6493b] hover:text-[#88362a] transition-colors cursor-pointer"
              >
                移除背景圖片
              </button>
            )}
          </div>
        )}

        {/* Pattern */}
        {canvas.backgroundType === 'pattern' && (
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-[#736c62] block">幾何紋理圖案</label>
            <div className="grid grid-cols-2 gap-2">
              {(['none', 'dots', 'grid', 'stripes', 'checker'] as const).map((pat) => (
                <button
                  key={pat}
                  onClick={() => onUpdateCanvas({ pattern: pat })}
                  className={`py-2 px-3 text-xs rounded border transition-colors cursor-pointer ${
                    canvas.pattern === pat
                      ? 'border-[#556354] bg-[#edf0eb] text-[#344033] font-medium'
                      : 'border-[#dcd7cb] bg-[#f4f2eb] text-[#736c62] hover:bg-[#eae5d8]'
                  }`}
                >
                  {pat === 'none' ? '無' : pat === 'dots' ? '點狀' : pat === 'grid' ? '網格' : pat === 'stripes' ? '斜紋' : '棋盤'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paper Texture Overlay (和紙、牛皮紙、粗糙畫布、典雅羊皮紙) */}
        <div id="canvas-paper-texture-section" className="space-y-3 pt-3 border-t border-[#e5e1d8]">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[#556354] flex items-center gap-1.5">
              <Scroll className="w-3.5 h-3.5 text-[#556354]" />
              <span>背景紙張質感 (Paper Texture)</span>
            </label>
            {canvas.paperTexture && canvas.paperTexture !== 'none' && (
              <button
                type="button"
                id="btn-clear-paper-texture"
                onClick={() => onUpdateCanvas({ paperTexture: 'none' })}
                className="text-[10px] text-[#736c62] hover:text-[#2c2824] flex items-center gap-1 cursor-pointer transition-colors"
                title="清除紙張質感"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>清除質感</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'none', label: '無質感', sub: '純淨平整' },
              { id: 'washi', label: '和紙 (Washi)', sub: '手工桑皮纖維' },
              { id: 'kraft', label: '牛皮紙 (Kraft)', sub: '質樸木漿斑駁' },
              { id: 'canvas', label: '粗糙畫布', sub: '亞麻布經緯織紋' },
              { id: 'parchment', label: '典雅羊皮紙', sub: '古典雲染茶漬' },
            ].map((item) => {
              const isActive = (canvas.paperTexture || 'none') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`btn-texture-${item.id}`}
                  onClick={() => {
                    onUpdateCanvas({
                      paperTexture: item.id as PaperTextureType,
                      paperTextureOpacity: canvas.paperTextureOpacity ?? 0.6,
                    });
                  }}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'border-[#556354] bg-[#edf0eb] text-[#2c2824] shadow-xs ring-1 ring-[#556354]'
                      : 'border-[#dcd7cb] bg-[#f4f2eb] text-[#5c554c] hover:bg-[#eae5d8]'
                  }`}
                >
                  <span className="text-xs font-medium block leading-tight">{item.label}</span>
                  <span className="text-[10px] text-[#8c8275] block mt-0.5">{item.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Texture Intensity / Opacity slider when a paper texture is active */}
          {canvas.paperTexture && canvas.paperTexture !== 'none' && (
            <div className="space-y-3 pt-2 bg-[#f5f3ec] p-2.5 rounded-lg border border-[#e5e1d8] text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[#736c62]">
                  <span>質感濃度 (Opacity)</span>
                  <span className="font-mono text-[#556354] font-medium">
                    {Math.round((canvas.paperTextureOpacity ?? 0.6) * 100)}%
                  </span>
                </div>
                <input
                  id="slider-paper-texture-opacity"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={canvas.paperTextureOpacity ?? 0.6}
                  onChange={(e) =>
                    onUpdateCanvas({
                      paperTextureOpacity: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#556354]"
                />
              </div>

              {/* Recommended Color Match Button */}
              {canvas.paperTexture === 'washi' && canvas.background !== '#faf8f3' && (
                <button
                  type="button"
                  onClick={() => onUpdateCanvas({ backgroundType: 'solid', background: '#faf8f3' })}
                  className="w-full py-1.5 px-2 bg-[#ffffff] hover:bg-[#eae5d8] border border-[#d8d3c5] rounded text-[11px] text-[#463f37] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: '#faf8f3' }} />
                  <span>套用和紙素雅推薦底色 (#faf8f3)</span>
                </button>
              )}
              {canvas.paperTexture === 'kraft' && canvas.background !== '#d8c3a5' && (
                <button
                  type="button"
                  onClick={() => onUpdateCanvas({ backgroundType: 'solid', background: '#d8c3a5' })}
                  className="w-full py-1.5 px-2 bg-[#ffffff] hover:bg-[#eae5d8] border border-[#d8d3c5] rounded text-[11px] text-[#463f37] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: '#d8c3a5' }} />
                  <span>套用牛皮紙大地推薦底色 (#d8c3a5)</span>
                </button>
              )}
              {canvas.paperTexture === 'canvas' && canvas.background !== '#f0eae1' && (
                <button
                  type="button"
                  onClick={() => onUpdateCanvas({ backgroundType: 'solid', background: '#f0eae1' })}
                  className="w-full py-1.5 px-2 bg-[#ffffff] hover:bg-[#eae5d8] border border-[#d8d3c5] rounded text-[11px] text-[#463f37] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: '#f0eae1' }} />
                  <span>套用亞麻原胚推薦底色 (#f0eae1)</span>
                </button>
              )}
              {canvas.paperTexture === 'parchment' && canvas.background !== '#f4ecd8' && (
                <button
                  type="button"
                  onClick={() => onUpdateCanvas({ backgroundType: 'solid', background: '#f4ecd8' })}
                  className="w-full py-1.5 px-2 bg-[#ffffff] hover:bg-[#eae5d8] border border-[#d8d3c5] rounded text-[11px] text-[#463f37] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: '#f4ecd8' }} />
                  <span>套用古雅米黃推薦底色 (#f4ecd8)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    );
  }

  // 3. SINGLE FRAME PROPERTIES
  const frame = selectedFrames[0];

  return (
    <aside
      id="properties-panel-frame"
      className="w-72 bg-[#faf9f5] border-l border-[#e5e1d8] p-4 flex flex-col gap-5 text-[#38332c] overflow-y-auto select-none shrink-0"
    >
      <input
        ref={replaceImgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onReplaceImage(frame.id, e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Header & Quick Action Buttons */}
      <div className="border-b border-[#e5e1d8] pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#556354]">圖框屬性</h2>
          <span className="text-[10px] text-[#8c8275] capitalize">
            {frame.shape} • {frame.contentType}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="btn-prop-duplicate"
            onClick={() => onDuplicateFrame(frame.id)}
            title="複製此圖框 (Ctrl+C / Ctrl+V)"
            className="p-1.5 hover:bg-[#edeae1] rounded text-[#736c62] hover:text-[#2c2824] transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-prop-delete"
            onClick={() => onDeleteFrame(frame.id)}
            title="刪除此圖框 (Delete / Backspace)"
            className="p-1.5 hover:bg-[#fae8e6] rounded text-[#a6493b] hover:text-[#88362a] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Geometry (Position, Dimensions, Rotation) */}
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-[#736c62] block">幾何參數 (Geometry)</label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-[#8c8275] block mb-0.5">X 座標 (px)</label>
            <input
              type="number"
              value={Math.round(frame.x)}
              onChange={(e) => onUpdateFrame(frame.id, { x: Number(e.target.value) })}
              className="w-full bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] focus:outline-none focus:border-[#556354]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8c8275] block mb-0.5">Y 座標 (px)</label>
            <input
              type="number"
              value={Math.round(frame.y)}
              onChange={(e) => onUpdateFrame(frame.id, { y: Number(e.target.value) })}
              className="w-full bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] focus:outline-none focus:border-[#556354]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8c8275] block mb-0.5">寬度 (px)</label>
            <input
              type="number"
              min="20"
              value={Math.round(frame.width)}
              onChange={(e) => onUpdateFrame(frame.id, { width: Math.max(20, Number(e.target.value)) })}
              className="w-full bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] focus:outline-none focus:border-[#556354]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8c8275] block mb-0.5">高度 (px)</label>
            <input
              type="number"
              min="20"
              value={Math.round(frame.height)}
              onChange={(e) => onUpdateFrame(frame.id, { height: Math.max(20, Number(e.target.value)) })}
              className="w-full bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] focus:outline-none focus:border-[#556354]"
            />
          </div>
        </div>

        {/* Frame Rotation */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px] text-[#736c62]">
            <span>圖框旋轉角度 (Frame Rotation)</span>
            <span className="font-mono text-[#556354] font-medium">{Math.round(frame.rotation)}°</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="360"
              value={Math.round(frame.rotation)}
              onChange={(e) => onUpdateFrame(frame.id, { rotation: Number(e.target.value) })}
              className="flex-1 accent-[#556354]"
            />
            <button
              onClick={() => onUpdateFrame(frame.id, { rotation: 0 })}
              title="歸零旋轉"
              className="p-1 hover:bg-[#edeae1] text-[#736c62] hover:text-[#2c2824] rounded cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rounded corners if rectangle */}
        {frame.shape === 'rectangle' && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] text-[#736c62]">
              <span>圓角 (px)</span>
              <span className="font-mono">{frame.roundedCorners}px</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.min(frame.width, frame.height) / 2}
              value={frame.roundedCorners}
              onChange={(e) => onUpdateFrame(frame.id, { roundedCorners: Number(e.target.value) })}
              className="w-full accent-[#556354]"
            />
          </div>
        )}
      </div>

      {/* 2. Frame Appearance (Fill, Border, Oil Painting) */}
      <div className="space-y-2 border-t border-[#e5e1d8] pt-3">
        <label className="text-[11px] font-medium text-[#736c62] block">外觀與外框 (Appearance)</label>

        {/* Background fill */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#736c62]">圖框底色</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateFrame(frame.id, { background: 'transparent' })}
              className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                frame.background === 'transparent' ? 'bg-[#556354] text-white' : 'bg-[#edeae1] text-[#736c62]'
              }`}
            >
              透明
            </button>
            <input
              type="color"
              value={frame.background === 'transparent' ? '#ffffff' : frame.background}
              onChange={(e) => onUpdateFrame(frame.id, { background: e.target.value })}
              className="w-6 h-6 rounded border border-[#d8d3c5] bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Border settings */}
        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#736c62]">邊框寬度</span>
            <span className="font-mono text-[#8c8275]">{frame.border?.width ?? 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={frame.border?.width ?? 0}
            onChange={(e) =>
              onUpdateFrame(frame.id, {
                border: {
                  ...frame.border,
                  width: Number(e.target.value),
                },
              })
            }
            className="w-full accent-[#556354]"
          />

          {frame.border?.width > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-[#8c8275] block mb-0.5">邊框顏色</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={frame.border?.color || '#000000'}
                    onChange={(e) =>
                      onUpdateFrame(frame.id, {
                        border: {
                          ...frame.border,
                          color: e.target.value,
                        },
                      })
                    }
                    className="w-6 h-6 rounded border border-[#d8d3c5] bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[#736c62]">{frame.border?.color}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8c8275] block mb-0.5">邊框樣式</label>
                <select
                  value={frame.border?.style || 'solid'}
                  onChange={(e) =>
                    onUpdateFrame(frame.id, {
                      border: {
                        ...frame.border,
                        style: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] text-xs focus:outline-none focus:border-[#556354]"
                >
                  <option value="solid">實線 (Solid)</option>
                  <option value="dashed">虛線 (Dashed)</option>
                  <option value="dotted">點線 (Dotted)</option>
                </select>
              </div>
            </div>
          )}

          {/* Oil painting frame style (Section 25) */}
          <div className="pt-2">
            <button
              onClick={() =>
                onUpdateFrame(frame.id, {
                  border: {
                    ...frame.border,
                    appearance: frame.border.appearance === 'oil-painting' ? 'normal' : 'oil-painting',
                    width: frame.border.appearance === 'oil-painting' ? 2 : Math.max(10, frame.border.width),
                  },
                })
              }
              className={`w-full py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                frame.border?.appearance === 'oil-painting'
                  ? 'bg-[#f7f0e6] border-[#cf9d67] text-[#8f5a28]'
                  : 'bg-[#f4f2eb] hover:bg-[#eae5d8] border-[#dcd7cb] text-[#5c554a]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#b88044]" />
              <span>油畫金雕框效果 (Oil Painting Frame)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Layer Controls (Section 35) */}
      <div className="space-y-2 border-t border-[#e5e1d8] pt-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-[#736c62]">圖層順序 (Z-Index: {frame.zIndex})</label>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onBringFront(frame.id)}
            title="移至最前層"
            className="p-1.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded flex flex-col items-center gap-0.5 text-[#5c554a] transition-colors cursor-pointer"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
            <span className="text-[9px]">最前</span>
          </button>
          <button
            onClick={() => onMoveUp(frame.id)}
            title="上一層"
            className="p-1.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded flex flex-col items-center gap-0.5 text-[#5c554a] transition-colors cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span className="text-[9px]">上移</span>
          </button>
          <button
            onClick={() => onMoveDown(frame.id)}
            title="下一層"
            className="p-1.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded flex flex-col items-center gap-0.5 text-[#5c554a] transition-colors cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span className="text-[9px]">下移</span>
          </button>
          <button
            onClick={() => onSendBack(frame.id)}
            title="移至最後層"
            className="p-1.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded flex flex-col items-center gap-0.5 text-[#5c554a] transition-colors cursor-pointer"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
            <span className="text-[9px]">最後</span>
          </button>
        </div>
      </div>

      {/* 4. Content Type & Switching (Section 24) */}
      <div className="space-y-2 border-t border-[#e5e1d8] pt-3">
        <label className="text-[11px] font-medium text-[#736c62] block">內容類型切換</label>
        <div className="grid grid-cols-3 gap-1 bg-[#edeae1] p-1 rounded-lg text-xs">
          <button
            onClick={() => {
              if (frame.contentType !== 'empty') {
                onDeleteContent(frame.id);
              }
            }}
            className={`py-1 rounded transition-colors cursor-pointer ${
              frame.contentType === 'empty' ? 'bg-[#556354] text-white font-medium shadow-xs' : 'text-[#736c62] hover:text-[#2c2824]'
            }`}
          >
            無內容
          </button>
          <button
            onClick={() => {
              if (frame.contentType !== 'image') {
                onRequestContentSwitch(frame.id, 'image');
              }
            }}
            className={`py-1 rounded transition-colors cursor-pointer ${
              frame.contentType === 'image' ? 'bg-[#556354] text-white font-medium shadow-xs' : 'text-[#736c62] hover:text-[#2c2824]'
            }`}
          >
            圖片
          </button>
          <button
            onClick={() => {
              if (frame.contentType !== 'text') {
                onRequestContentSwitch(frame.id, 'text');
              }
            }}
            className={`py-1 rounded transition-colors cursor-pointer ${
              frame.contentType === 'text' ? 'bg-[#556354] text-white font-medium shadow-xs' : 'text-[#736c62] hover:text-[#2c2824]'
            }`}
          >
            文字
          </button>
        </div>
      </div>

      {/* 5. IMAGE PROPERTIES (Section 9, 12, 14, 15) */}
      {frame.contentType === 'image' && frame.image && (
        <div className="space-y-3 border-t border-[#e5e1d8] pt-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-[#556354] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>圖片參數 (Image Data)</span>
            </label>
            <button
              onClick={() => replaceImgInputRef.current?.click()}
              className="text-[10px] text-[#556354] hover:text-[#384337] font-medium cursor-pointer"
            >
              更換圖片
            </button>
          </div>

          {/* Display Mode (Cover / Contain) */}
          <div className="space-y-1">
            <span className="text-[10px] text-[#8c8275] block">顯示模式</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      displayMode: 'cover',
                    },
                  })
                }
                className={`py-1.5 px-2 rounded text-xs border cursor-pointer transition-colors ${
                  frame.image.displayMode === 'cover'
                    ? 'bg-[#556354] border-[#465345] text-white font-medium shadow-xs'
                    : 'bg-[#f4f2eb] border-[#dcd7cb] text-[#5c554a] hover:bg-[#eae5d8]'
                }`}
              >
                填滿 (Cover)
              </button>
              <button
                onClick={() =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      displayMode: 'contain',
                    },
                  })
                }
                className={`py-1.5 px-2 rounded text-xs border cursor-pointer transition-colors ${
                  frame.image.displayMode === 'contain'
                    ? 'bg-[#556354] border-[#465345] text-white font-medium shadow-xs'
                    : 'bg-[#f4f2eb] border-[#dcd7cb] text-[#5c554a] hover:bg-[#eae5d8]'
                }`}
              >
                完整包含 (Contain)
              </button>
            </div>
          </div>

          {/* Image Scale */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#736c62]">
              <span>圖片縮放 (Scale)</span>
              <span className="font-mono">{Math.round(frame.image.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.05"
              value={frame.image.scale}
              onChange={(e) =>
                onUpdateFrame(frame.id, {
                  image: {
                    ...frame.image!,
                    scale: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-[#556354]"
            />
          </div>

          {/* Image LOCAL Rotation (Section 12, 14, 15) */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#736c62]">
              <span>圖片自體旋轉 (Local Rotation)</span>
              <span className="font-mono text-[#556354] font-medium">{Math.round(frame.image.rotation || 0)}°</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                value={Math.round(frame.image.rotation || 0)}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      rotation: Number(e.target.value),
                    },
                  })
                }
                className="flex-1 accent-[#556354]"
              />
              <button
                onClick={() =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      rotation: 0,
                    },
                  })
                }
                title="歸零圖片自身角度"
                className="p-1 hover:bg-[#edeae1] text-[#736c62] hover:text-[#2c2824] rounded cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[10px] text-[#8c8275] flex justify-between">
              <span>最終視覺角度:</span>
              <span className="font-mono text-[#484138]">
                {Math.round(((frame.rotation || 0) + (frame.image.rotation || 0)) % 360)}°
              </span>
            </div>
          </div>

          {/* Image Position Offset */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] text-[#8c8275] block">圖片框內偏移 (Offset X, Y)</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="X 偏移"
                value={Math.round(frame.image.position?.x || 0)}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      position: {
                        x: Number(e.target.value),
                        y: frame.image!.position?.y || 0,
                      },
                    },
                  })
                }
                className="bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] focus:outline-none focus:border-[#556354]"
              />
              <input
                type="number"
                placeholder="Y 偏移"
                value={Math.round(frame.image.position?.y || 0)}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      position: {
                        x: frame.image!.position?.x || 0,
                        y: Number(e.target.value),
                      },
                    },
                  })
                }
                className="bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] focus:outline-none focus:border-[#556354]"
              />
            </div>
          </div>

          {/* Image Opacity */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#736c62]">
              <span>不透明度 (Opacity)</span>
              <span className="font-mono">{Math.round((frame.image.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={frame.image.opacity ?? 1}
              onChange={(e) =>
                onUpdateFrame(frame.id, {
                  image: {
                    ...frame.image!,
                    opacity: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-[#556354]"
            />
          </div>

          {/* 5.0 IMAGE CROP SECTION */}
          <div id="image-crop-section" className="space-y-2.5 pt-3 border-t border-[#e5e1d8]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#556354] flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-[#556354]" />
                <span>圖片裁切 (Image Crop)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onUpdateFrame(
                    frame.id,
                    {
                      image: {
                        ...frame.image!,
                        crop: { x: 0, y: 0, width: 1, height: 1 },
                      },
                    },
                    true
                  );
                }}
                title="還原為原圖無裁切"
                className="text-[10px] text-[#736c62] hover:text-[#2c2824] hover:underline cursor-pointer"
              >
                重設裁切
              </button>
            </div>

            {/* Quick Aspect Presets */}
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => {
                  onUpdateFrame(
                    frame.id,
                    {
                      image: {
                        ...frame.image!,
                        crop: { x: 0, y: 0, width: 1, height: 1 },
                      },
                    },
                    true
                  );
                }}
                className="px-1.5 py-1 text-[10px] bg-[#f4f2eb] hover:bg-[#eae5d8] text-[#5c554a] rounded border border-[#dcd7cb] cursor-pointer"
                title="原始完整圖片"
              >
                原圖
              </button>
              <button
                type="button"
                onClick={() => {
                  const natW = frame.image?.naturalWidth || 100;
                  const natH = frame.image?.naturalHeight || 100;
                  let cx = 0, cy = 0, cw = 1, ch = 1;
                  if (natW > natH) {
                    cw = natH / natW;
                    cx = (1 - cw) / 2;
                  } else {
                    ch = natW / natH;
                    cy = (1 - ch) / 2;
                  }
                  onUpdateFrame(
                    frame.id,
                    {
                      image: {
                        ...frame.image!,
                        crop: { x: cx, y: cy, width: cw, height: ch },
                      },
                    },
                    true
                  );
                }}
                className="px-1.5 py-1 text-[10px] bg-[#f4f2eb] hover:bg-[#eae5d8] text-[#5c554a] rounded border border-[#dcd7cb] cursor-pointer"
                title="以中心裁切為 1:1 正方形"
              >
                1 : 1
              </button>
              <button
                type="button"
                onClick={() => {
                  const natW = frame.image?.naturalWidth || 100;
                  const natH = frame.image?.naturalHeight || 100;
                  const targetAspect = 4 / 3;
                  const currentAspect = natW / natH;
                  let cx = 0, cy = 0, cw = 1, ch = 1;
                  if (currentAspect > targetAspect) {
                    cw = targetAspect / currentAspect;
                    cx = (1 - cw) / 2;
                  } else {
                    ch = currentAspect / targetAspect;
                    cy = (1 - ch) / 2;
                  }
                  onUpdateFrame(
                    frame.id,
                    {
                      image: {
                        ...frame.image!,
                        crop: { x: cx, y: cy, width: cw, height: ch },
                      },
                    },
                    true
                  );
                }}
                className="px-1.5 py-1 text-[10px] bg-[#f4f2eb] hover:bg-[#eae5d8] text-[#5c554a] rounded border border-[#dcd7cb] cursor-pointer"
                title="以中心裁切為 4:3 比例"
              >
                4 : 3
              </button>
              <button
                type="button"
                onClick={() => {
                  const natW = frame.image?.naturalWidth || 100;
                  const natH = frame.image?.naturalHeight || 100;
                  const targetAspect = 16 / 9;
                  const currentAspect = natW / natH;
                  let cx = 0, cy = 0, cw = 1, ch = 1;
                  if (currentAspect > targetAspect) {
                    cw = targetAspect / currentAspect;
                    cx = (1 - cw) / 2;
                  } else {
                    ch = currentAspect / targetAspect;
                    cy = (1 - ch) / 2;
                  }
                  onUpdateFrame(
                    frame.id,
                    {
                      image: {
                        ...frame.image!,
                        crop: { x: cx, y: cy, width: cw, height: ch },
                      },
                    },
                    true
                  );
                }}
                className="px-1.5 py-1 text-[10px] bg-[#f4f2eb] hover:bg-[#eae5d8] text-[#5c554a] rounded border border-[#dcd7cb] cursor-pointer"
                title="以中心裁切為 16:9 比例"
              >
                16 : 9
              </button>
            </div>

            {/* Edge Inset Sliders */}
            {(() => {
              const crop = frame.image.crop || { x: 0, y: 0, width: 1, height: 1 };
              const leftPercent = Math.round((crop.x || 0) * 100);
              const rightPercent = Math.round((1 - (crop.x || 0) - (crop.width || 1)) * 100);
              const topPercent = Math.round((crop.y || 0) * 100);
              const bottomPercent = Math.round((1 - (crop.y || 0) - (crop.height || 1)) * 100);

              const updateCropInset = (
                side: 'left' | 'right' | 'top' | 'bottom',
                val: number,
                commit = false
              ) => {
                const fraction = Math.max(0, Math.min(45, val)) / 100;
                let nx = crop.x || 0;
                let ny = crop.y || 0;
                let nw = crop.width || 1;
                let nh = crop.height || 1;

                if (side === 'left') {
                  const currentRightInset = 1 - nx - nw;
                  nx = fraction;
                  nw = Math.max(0.1, 1 - nx - currentRightInset);
                } else if (side === 'right') {
                  nw = Math.max(0.1, 1 - nx - fraction);
                } else if (side === 'top') {
                  const currentBottomInset = 1 - ny - nh;
                  ny = fraction;
                  nh = Math.max(0.1, 1 - ny - currentBottomInset);
                } else if (side === 'bottom') {
                  nh = Math.max(0.1, 1 - ny - fraction);
                }

                onUpdateFrame(
                  frame.id,
                  {
                    image: {
                      ...frame.image!,
                      crop: { x: nx, y: ny, width: nw, height: nh },
                    },
                  },
                  commit
                );
              };

              return (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#736c62]">
                        <span>左側裁切</span>
                        <span className="font-mono">{leftPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={leftPercent}
                        onChange={(e) => updateCropInset('left', Number(e.target.value), false)}
                        onPointerUp={(e) => updateCropInset('left', Number((e.target as HTMLInputElement).value), true)}
                        className="w-full accent-[#556354]"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#736c62]">
                        <span>右側裁切</span>
                        <span className="font-mono">{rightPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={rightPercent}
                        onChange={(e) => updateCropInset('right', Number(e.target.value), false)}
                        onPointerUp={(e) => updateCropInset('right', Number((e.target as HTMLInputElement).value), true)}
                        className="w-full accent-[#556354]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#736c62]">
                        <span>上方裁切</span>
                        <span className="font-mono">{topPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={topPercent}
                        onChange={(e) => updateCropInset('top', Number(e.target.value), false)}
                        onPointerUp={(e) => updateCropInset('top', Number((e.target as HTMLInputElement).value), true)}
                        className="w-full accent-[#556354]"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#736c62]">
                        <span>下方裁切</span>
                        <span className="font-mono">{bottomPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={bottomPercent}
                        onChange={(e) => updateCropInset('bottom', Number(e.target.value), false)}
                        onPointerUp={(e) => updateCropInset('bottom', Number((e.target as HTMLInputElement).value), true)}
                        className="w-full accent-[#556354]"
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-[#8c8275] bg-[#f4f2eb] px-2 py-1 rounded">
                    保留區域: {Math.round((crop.width || 1) * 100)}% 寬 × {Math.round((crop.height || 1) * 100)}% 高
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 5.1 IMAGE VISUAL EFFECTS (Brightness, Contrast, Grayscale, Soft Shadow) */}
          <div id="image-effects-section" className="space-y-3 pt-3 border-t border-[#e5e1d8]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#556354] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#556354]" />
                <span>圖片效果設定 (Image Effects)</span>
              </label>
              {((frame.image.effects?.brightness !== undefined && frame.image.effects?.brightness !== 100) ||
                (frame.image.effects?.contrast !== undefined && frame.image.effects?.contrast !== 100) ||
                (frame.image.effects?.grayscale !== undefined && frame.image.effects?.grayscale !== 0) ||
                Boolean(frame.image.effects?.shadow)) && (
                <button
                  type="button"
                  id="btn-reset-image-effects"
                  onClick={() =>
                    onUpdateFrame(frame.id, {
                      image: {
                        ...frame.image!,
                        effects: {
                          brightness: 100,
                          contrast: 100,
                          grayscale: 0,
                          shadow: false,
                          shadowBlur: 16,
                          shadowOpacity: 0.2,
                          shadowColor: '#000000',
                        },
                      },
                    })
                  }
                  title="重設效果為預設值"
                  className="text-[10px] text-[#736c62] hover:text-[#2c2824] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>重設效果</span>
                </button>
              )}
            </div>

            {/* Aesthetic Filter Presets */}
            <div className="space-y-1">
              <span className="text-[10px] text-[#8c8275] block">風格濾鏡快速套用</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFrame(frame.id, {
                      image: {
                        ...frame.image!,
                        effects: {
                          ...frame.image!.effects,
                          brightness: 100,
                          contrast: 100,
                          grayscale: 0,
                          shadow: false,
                        },
                      },
                    })
                  }
                  className="py-1 px-1.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded text-[10px] text-[#484138] transition-colors cursor-pointer text-center"
                >
                  原圖無效果
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFrame(frame.id, {
                      image: {
                        ...frame.image!,
                        effects: {
                          ...frame.image!.effects,
                          brightness: 106,
                          contrast: 92,
                          grayscale: 15,
                          shadow: true,
                          shadowBlur: 16,
                          shadowOpacity: 0.18,
                        },
                      },
                    })
                  }
                  className="py-1 px-1.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded text-[10px] text-[#484138] transition-colors cursor-pointer text-center"
                >
                  侘寂淡雅
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFrame(frame.id, {
                      image: {
                        ...frame.image!,
                        effects: {
                          ...frame.image!.effects,
                          brightness: 102,
                          contrast: 120,
                          grayscale: 100,
                          shadow: true,
                          shadowBlur: 16,
                          shadowOpacity: 0.2,
                        },
                      },
                    })
                  }
                  className="py-1 px-1.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] rounded text-[10px] text-[#484138] transition-colors cursor-pointer text-center"
                >
                  水墨黑白
                </button>
              </div>
            </div>

            {/* Brightness */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#736c62] items-center">
                <span className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-[#b4833e]" />
                  <span>亮度 (Brightness)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[#556354] font-medium">{frame.image.effects?.brightness ?? 100}%</span>
                  {(frame.image.effects?.brightness ?? 100) !== 100 && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFrame(frame.id, {
                          image: {
                            ...frame.image!,
                            effects: { ...frame.image!.effects, brightness: 100 },
                          },
                        })
                      }
                      title="重設為 100%"
                      className="text-[9px] text-[#8c8275] hover:text-[#2c2824] underline cursor-pointer"
                    >
                      標準
                    </button>
                  )}
                </div>
              </div>
              <input
                id="slider-brightness"
                type="range"
                min="0"
                max="200"
                step="1"
                value={frame.image.effects?.brightness ?? 100}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      effects: {
                        ...frame.image!.effects,
                        brightness: Number(e.target.value),
                      },
                    },
                  })
                }
                className="w-full accent-[#556354]"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#736c62] items-center">
                <span className="flex items-center gap-1">
                  <Contrast className="w-3 h-3 text-[#5c554a]" />
                  <span>對比度 (Contrast)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[#556354] font-medium">{frame.image.effects?.contrast ?? 100}%</span>
                  {(frame.image.effects?.contrast ?? 100) !== 100 && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFrame(frame.id, {
                          image: {
                            ...frame.image!,
                            effects: { ...frame.image!.effects, contrast: 100 },
                          },
                        })
                      }
                      title="重設為 100%"
                      className="text-[9px] text-[#8c8275] hover:text-[#2c2824] underline cursor-pointer"
                    >
                      標準
                    </button>
                  )}
                </div>
              </div>
              <input
                id="slider-contrast"
                type="range"
                min="0"
                max="200"
                step="1"
                value={frame.image.effects?.contrast ?? 100}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      effects: {
                        ...frame.image!.effects,
                        contrast: Number(e.target.value),
                      },
                    },
                  })
                }
                className="w-full accent-[#556354]"
              />
            </div>

            {/* Grayscale */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#736c62] items-center">
                <span>灰階濾鏡 (Grayscale)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#556354] font-medium">{frame.image.effects?.grayscale ?? 0}%</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFrame(frame.id, {
                        image: {
                          ...frame.image!,
                          effects: {
                            ...frame.image!.effects,
                            grayscale: (frame.image!.effects?.grayscale ?? 0) > 0 ? 0 : 100,
                          },
                        },
                      })
                    }
                    className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      (frame.image.effects?.grayscale ?? 0) === 100
                        ? 'bg-[#556354] text-white'
                        : 'bg-[#edeae1] text-[#736c62] hover:text-[#2c2824]'
                    }`}
                  >
                    {(frame.image.effects?.grayscale ?? 0) === 100 ? '黑白' : '全彩'}
                  </button>
                </div>
              </div>
              <input
                id="slider-grayscale"
                type="range"
                min="0"
                max="100"
                step="1"
                value={frame.image.effects?.grayscale ?? 0}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    image: {
                      ...frame.image!,
                      effects: {
                        ...frame.image!.effects,
                        grayscale: Number(e.target.value),
                      },
                    },
                  })
                }
                className="w-full accent-[#556354]"
              />
            </div>

            {/* Soft Shadow Section */}
            <div className="pt-2 border-t border-[#edeae1] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[#484138]">柔和陰影 (Soft Shadow)</span>
                  <span className="text-[10px] text-[#8c8275]">為圖片圖框添加細緻立體感</span>
                </div>
                <button
                  type="button"
                  id="toggle-image-shadow"
                  onClick={() =>
                    onUpdateFrame(frame.id, {
                      image: {
                        ...frame.image!,
                        effects: {
                          ...frame.image!.effects,
                          shadow: !frame.image!.effects?.shadow,
                          shadowBlur: frame.image!.effects?.shadowBlur ?? 16,
                          shadowOpacity: frame.image!.effects?.shadowOpacity ?? 0.2,
                          shadowColor: frame.image!.effects?.shadowColor || '#000000',
                        },
                      },
                    })
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    frame.image.effects?.shadow ? 'bg-[#556354]' : 'bg-[#d8d3c5]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      frame.image.effects?.shadow ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Shadow parameters when enabled */}
              {frame.image.effects?.shadow && (
                <div className="bg-[#f5f3ec] p-2.5 rounded-lg border border-[#e5e1d8] space-y-2 animate-in fade-in text-xs">
                  {/* Blur Radius */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[#736c62]">
                      <span>陰影模糊度 (Blur)</span>
                      <span className="font-mono">{frame.image.effects?.shadowBlur ?? 16}px</span>
                    </div>
                    <input
                      id="slider-shadow-blur"
                      type="range"
                      min="4"
                      max="40"
                      step="1"
                      value={frame.image.effects?.shadowBlur ?? 16}
                      onChange={(e) =>
                        onUpdateFrame(frame.id, {
                          image: {
                            ...frame.image!,
                            effects: {
                              ...frame.image!.effects,
                              shadowBlur: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full accent-[#556354]"
                    />
                  </div>

                  {/* Shadow Opacity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[#736c62]">
                      <span>陰影濃淡 (Opacity)</span>
                      <span className="font-mono">{Math.round((frame.image.effects?.shadowOpacity ?? 0.2) * 100)}%</span>
                    </div>
                    <input
                      id="slider-shadow-opacity"
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.05"
                      value={frame.image.effects?.shadowOpacity ?? 0.2}
                      onChange={(e) =>
                        onUpdateFrame(frame.id, {
                          image: {
                            ...frame.image!,
                            effects: {
                              ...frame.image!.effects,
                              shadowOpacity: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full accent-[#556354]"
                    />
                  </div>

                  {/* Shadow Color */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#736c62]">陰影色彩</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={frame.image.effects?.shadowColor || '#000000'}
                        onChange={(e) =>
                          onUpdateFrame(frame.id, {
                            image: {
                              ...frame.image!,
                              effects: {
                                ...frame.image!.effects,
                                shadowColor: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-6 h-6 rounded border border-[#d8d3c5] bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-[#736c62]">
                        {frame.image.effects?.shadowColor || '#000000'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reset or Remove image */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() =>
                onUpdateFrame(frame.id, {
                  image: {
                    ...frame.image!,
                    scale: 1,
                    rotation: 0,
                    position: { x: 0, y: 0 },
                    opacity: 1,
                  },
                })
              }
              className="flex-1 py-1.5 bg-[#f4f2eb] hover:bg-[#eae5d8] border border-[#dcd7cb] text-[#484138] rounded text-xs transition-colors cursor-pointer"
            >
              重設圖片變形
            </button>
            <button
              onClick={() => onDeleteContent(frame.id)}
              className="px-3 py-1.5 bg-[#fae8e6] hover:bg-[#f5d7d4] border border-[#edd1ce] text-[#a6493b] rounded text-xs transition-colors cursor-pointer"
            >
              清除圖片
            </button>
          </div>
        </div>
      )}

      {/* If empty image frame, offer upload button */}
      {frame.contentType === 'image' && !frame.image && (
        <div className="p-4 border border-dashed border-[#d8d3c5] rounded-lg text-center space-y-2 bg-[#fcfbfa]">
          <p className="text-xs text-[#736c62]">此圖框尚未放入圖片</p>
          <button
            onClick={() => replaceImgInputRef.current?.click()}
            className="px-3 py-1.5 bg-[#556354] hover:bg-[#465345] text-white rounded text-xs font-medium cursor-pointer shadow-xs transition-colors"
          >
            放入圖片
          </button>
        </div>
      )}

      {/* 6. TEXT PROPERTIES (Section 10, 23) */}
      {frame.contentType === 'text' && frame.text && (
        <div className="space-y-3 border-t border-[#e5e1d8] pt-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-[#556354] flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              <span>文字排版 (Text Data)</span>
            </label>
          </div>

          {/* Content TextArea */}
          <div className="space-y-1">
            <textarea
              rows={3}
              value={frame.text.content}
              onChange={(e) =>
                onUpdateFrame(frame.id, {
                  text: {
                    ...frame.text!,
                    content: e.target.value,
                  },
                })
              }
              placeholder="在此輸入文字內容..."
              className="w-full bg-[#ffffff] border border-[#d8d3c5] rounded p-2 text-xs text-[#2c2824] resize-none focus:outline-none focus:border-[#556354]"
            />
          </div>

          {/* Font Family & Size */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-[#8c8275] block mb-0.5">字體家族</label>
              <select
                value={frame.text.font}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    text: {
                      ...frame.text!,
                      font: e.target.value,
                    },
                  })
                }
                className="w-full bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] text-xs focus:outline-none focus:border-[#556354]"
              >
                <option value="sans-serif">無襯線 (Sans-serif)</option>
                <option value="serif">襯線體 (Serif)</option>
                <option value="monospace">等寬體 (Monospace)</option>
                <option value="'Noto Sans TC', sans-serif">思源黑體</option>
                <option value="'Noto Serif TC', serif">思源明體</option>
                <option value="'Zen Kaku Gothic New', sans-serif">日系角黑 (Zen Kaku)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#8c8275] block mb-0.5">字型大小 (px)</label>
              <input
                type="number"
                min="8"
                max="200"
                value={frame.text.size}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    text: {
                      ...frame.text!,
                      size: Math.max(8, Number(e.target.value)),
                    },
                  })
                }
                className="w-full bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1 text-[#2c2824] focus:outline-none focus:border-[#556354]"
              />
            </div>
          </div>

          {/* Bold, Italic, Color */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateFrame(frame.id, {
                  text: {
                    ...frame.text!,
                    bold: !frame.text!.bold,
                  },
                })
              }
              className={`p-1.5 rounded border text-xs cursor-pointer transition-colors ${
                frame.text.bold ? 'bg-[#556354] border-[#465345] text-white shadow-xs' : 'bg-[#f4f2eb] border-[#dcd7cb] text-[#736c62] hover:bg-[#eae5d8]'
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                onUpdateFrame(frame.id, {
                  text: {
                    ...frame.text!,
                    italic: !frame.text!.italic,
                  },
                })
              }
              className={`p-1.5 rounded border text-xs cursor-pointer transition-colors ${
                frame.text.italic ? 'bg-[#556354] border-[#465345] text-white shadow-xs' : 'bg-[#f4f2eb] border-[#dcd7cb] text-[#736c62] hover:bg-[#eae5d8]'
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center gap-2 bg-[#ffffff] border border-[#d8d3c5] rounded px-2 py-1">
              <input
                type="color"
                value={frame.text.color}
                onChange={(e) =>
                  onUpdateFrame(frame.id, {
                    text: {
                      ...frame.text!,
                      color: e.target.value,
                    },
                  })
                }
                className="w-5 h-5 rounded border border-[#d8d3c5] bg-transparent cursor-pointer"
              />
              <span className="text-[10px] font-mono text-[#484138]">{frame.text.color}</span>
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-1">
            <span className="text-[10px] text-[#8c8275] block">水平與垂直對齊</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex bg-[#edeae1] p-0.5 rounded border border-[#dcd7cb]">
                {(['left', 'center', 'right'] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() =>
                      onUpdateFrame(frame.id, {
                        text: {
                          ...frame.text!,
                          horizontalAlign: h,
                        },
                      })
                    }
                    className={`flex-1 py-1 flex justify-center rounded cursor-pointer transition-colors ${
                      frame.text?.horizontalAlign === h ? 'bg-[#556354] text-white shadow-xs' : 'text-[#736c62] hover:text-[#2c2824]'
                    }`}
                  >
                    {h === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> : h === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              <div className="flex bg-[#edeae1] p-0.5 rounded border border-[#dcd7cb]">
                {(['top', 'middle', 'bottom'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() =>
                      onUpdateFrame(frame.id, {
                        text: {
                          ...frame.text!,
                          verticalAlign: v,
                        },
                      })
                    }
                    className={`flex-1 py-1 text-[10px] rounded cursor-pointer transition-colors ${
                      frame.text?.verticalAlign === v ? 'bg-[#556354] text-white font-medium shadow-xs' : 'text-[#736c62] hover:text-[#2c2824]'
                    }`}
                  >
                    {v === 'top' ? '頂' : v === 'middle' ? '中' : '底'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto wrap */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[#736c62]">自動換行 (Auto Wrap)</span>
            <input
              type="checkbox"
              checked={frame.text.autoWrap}
              onChange={(e) =>
                onUpdateFrame(frame.id, {
                  text: {
                    ...frame.text!,
                    autoWrap: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-[#556354] rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </aside>
  );
};
