import React, { useRef, useState } from 'react';
import {
  MousePointer,
  Square,
  Circle,
  Shapes,
  Pentagon,
  Type,
  Image as ImageIcon,
  Palette,
  Grid,
  Pipette,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { EditorMode, FrameShape } from '../types';

interface Props {
  mode: EditorMode;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onSetMode: (mode: EditorMode) => void;
  onAddFrame: (shape: FrameShape) => void;
  onAddTextFrame: () => void;
  onUploadImageToSelectedOrNew: (file: File) => void;
  onSelectBackground: () => void;
  onActivateEyedropper?: () => void;
  onOpenSelfTest?: () => void;
  onToggleProperties?: () => void;
  selectedCount?: number;
  isPropertiesOpen?: boolean;
}

export const Toolbar: React.FC<Props> = ({
  mode,
  showGrid = false,
  onToggleGrid,
  onSetMode,
  onAddFrame,
  onAddTextFrame,
  onUploadImageToSelectedOrNew,
  onSelectBackground,
  onActivateEyedropper,
  onToggleProperties,
  selectedCount = 0,
  isPropertiesOpen = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const [showMobileShapes, setShowMobileShapes] = useState(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImageToSelectedOrNew(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <>
      {/* 1. DESKTOP & TABLET VERTICAL SIDEBAR (hidden on small mobile screens) */}
      <aside
        id="left-toolbar"
        className="hidden md:flex w-16 lg:w-18 bg-[#f8f6f0] border-r border-[#e5e1d8] flex-col items-center py-4 gap-2 select-none z-20 shrink-0 text-[#4a433a] overflow-y-auto"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Select Tool */}
        <button
          id="tool-select"
          onClick={() => onSetMode('select')}
          title="選取工具 (V)"
          className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            mode === 'select'
              ? 'bg-[#556354] text-white shadow-xs'
              : 'hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722]'
          }`}
        >
          <MousePointer className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">選取</span>
        </button>

        <div className="w-8 h-px bg-[#e5e1d8] my-1" />

        {/* Upload Image */}
        <button
          id="tool-image"
          onClick={() => fileInputRef.current?.click()}
          title="放入圖片 (建立圖片圖框或放入已選圖框)"
          className="w-12 h-12 flex flex-col items-center justify-center rounded-xl hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722] transition-all cursor-pointer group"
        >
          <ImageIcon className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform text-[#647063]" />
          <span className="text-[10px] font-medium leading-none">圖片</span>
        </button>

        {/* Rectangle Frame */}
        <button
          id="tool-rect-frame"
          onClick={() => {
            onSetMode('select');
            onAddFrame('rectangle');
          }}
          title="建立矩形圖框"
          className="w-12 h-12 flex flex-col items-center justify-center rounded-xl hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722] transition-all cursor-pointer group"
        >
          <Square className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-medium leading-none">矩形</span>
        </button>

        {/* Circle Frame */}
        <button
          id="tool-circle-frame"
          onClick={() => {
            onSetMode('select');
            onAddFrame('circle');
          }}
          title="建立圓形圖框"
          className="w-12 h-12 flex flex-col items-center justify-center rounded-xl hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722] transition-all cursor-pointer group"
        >
          <Circle className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-medium leading-none">圓形</span>
        </button>

        {/* Ellipse Frame */}
        <button
          id="tool-ellipse-frame"
          onClick={() => {
            onSetMode('select');
            onAddFrame('ellipse');
          }}
          title="建立橢圓圖框"
          className="w-12 h-12 flex flex-col items-center justify-center rounded-xl hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722] transition-all cursor-pointer group"
        >
          <Shapes className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-medium leading-none">橢圓</span>
        </button>

        {/* Free Shape (Polygon) */}
        <button
          id="tool-polygon-frame"
          onClick={() => onSetMode('polygon-create')}
          title="自由多邊形 (點擊畫布定點，再次點擊起點封閉)"
          className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer group ${
            mode === 'polygon-create'
              ? 'bg-[#8c7a65] text-white shadow-xs'
              : 'hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722]'
          }`}
        >
          <Pentagon className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-medium leading-none">多邊形</span>
        </button>

        {/* Text Frame */}
        <button
          id="tool-text-frame"
          onClick={() => {
            onSetMode('select');
            onAddTextFrame();
          }}
          title="建立文字圖框"
          className="w-12 h-12 flex flex-col items-center justify-center rounded-xl hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722] transition-all cursor-pointer group"
        >
          <Type className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-medium leading-none">文字</span>
        </button>

        {/* Canvas Background */}
        <button
          id="tool-background"
          onClick={() => {
            onSelectBackground();
            if (onToggleProperties && !isPropertiesOpen) {
              onToggleProperties();
            }
          }}
          title="畫布背景設定"
          className="w-12 h-12 flex flex-col items-center justify-center rounded-xl hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722] transition-all cursor-pointer group"
        >
          <Palette className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-medium leading-none">背景</span>
        </button>

        {/* Eyedropper Tool */}
        <button
          id="tool-eyedropper"
          onClick={onActivateEyedropper}
          title="顏色滴管：吸取畫布、圖片或網頁上的任何顏色 (快捷鍵: I)"
          className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer group ${
            mode === 'eyedropper'
              ? 'bg-[#556354] text-white shadow-xs'
              : 'hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722]'
          }`}
        >
          <Pipette className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-medium leading-none">滴管</span>
        </button>

        {/* Grid Toggle Tool */}
        <button
          id="tool-grid-toggle"
          onClick={onToggleGrid}
          title={showGrid ? '關閉對齊格線 (目前開啟，快捷鍵: G)' : '開啟對齊格線 (輔助精確對齊，快捷鍵: G)'}
          className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer group ${
            showGrid
              ? 'bg-[#556354] text-white shadow-xs'
              : 'hover:bg-[#eae6dc] text-[#6d6459] hover:text-[#2c2722]'
          }`}
        >
          <Grid className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] font-medium leading-none">格線</span>
        </button>
      </aside>

      {/* 2. MOBILE BOTTOM DOCK (Clean, thumb-friendly navigation for phones) */}
      <nav
        id="mobile-bottom-dock"
        aria-label="行動版底端工具列"
        className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#faf9f5]/95 backdrop-blur-md border-t border-[#e5e1d8] items-center justify-around px-1.5 z-40 text-[#4a433a] shadow-lg select-none"
      >
        <input
          ref={mobileFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Select */}
        <button
          type="button"
          onClick={() => {
            onSetMode('select');
            setShowMobileShapes(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            mode === 'select' ? 'text-[#556354] font-semibold' : 'text-[#756d61]'
          }`}
        >
          <MousePointer className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">選取</span>
        </button>

        {/* Upload Image */}
        <button
          type="button"
          onClick={() => {
            setShowMobileShapes(false);
            mobileFileInputRef.current?.click();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[#756d61] active:text-[#2c2722]"
        >
          <ImageIcon className="w-5 h-5 mb-0.5 text-[#556354]" />
          <span className="text-[10px]">圖片</span>
        </button>

        {/* Add Shape (Opens drawer popover) */}
        <button
          type="button"
          onClick={() => setShowMobileShapes(!showMobileShapes)}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            showMobileShapes ? 'text-[#556354] font-semibold bg-[#eae6dc]/60' : 'text-[#756d61]'
          }`}
        >
          <Square className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">圖框</span>
        </button>

        {/* Text */}
        <button
          type="button"
          onClick={() => {
            setShowMobileShapes(false);
            onSetMode('select');
            onAddTextFrame();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[#756d61] active:text-[#2c2722]"
        >
          <Type className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">文字</span>
        </button>

        {/* Eyedropper */}
        <button
          type="button"
          onClick={() => {
            setShowMobileShapes(false);
            onActivateEyedropper?.();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            mode === 'eyedropper' ? 'text-[#556354] font-semibold' : 'text-[#756d61]'
          }`}
        >
          <Pipette className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">滴管</span>
        </button>

        {/* Properties Drawer Toggle */}
        {onToggleProperties && (
          <button
            type="button"
            id="mobile-btn-toggle-properties"
            onClick={() => {
              setShowMobileShapes(false);
              onToggleProperties();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg relative transition-colors ${
              isPropertiesOpen ? 'text-[#556354] font-semibold bg-[#eae6dc]/60' : 'text-[#756d61]'
            }`}
          >
            <div className="relative">
              <SlidersHorizontal className="w-5 h-5 mb-0.5" />
              {selectedCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#556354] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {selectedCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">屬性</span>
          </button>
        )}
      </nav>

      {/* Mobile Shape Selection Popover (Slides up above bottom dock) */}
      {showMobileShapes && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs flex md:hidden flex-col justify-end"
          onClick={() => setShowMobileShapes(false)}
        >
          <div
            className="bg-[#faf9f5] border-t border-[#d8d3c5] rounded-t-2xl p-4 mb-16 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e1d8]">
              <span className="text-xs font-semibold text-[#2c2824]">選擇圖框形狀</span>
              <button
                type="button"
                onClick={() => setShowMobileShapes(false)}
                className="p-1 text-[#8c8275] hover:text-[#2c2824]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => {
                  onSetMode('select');
                  onAddFrame('rectangle');
                  setShowMobileShapes(false);
                }}
                className="p-3 bg-[#edeae1] active:bg-[#dcd7cb] rounded-xl flex flex-col items-center justify-center gap-1.5"
              >
                <Square className="w-6 h-6 text-[#556354]" />
                <span className="text-[11px] font-medium">矩形</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetMode('select');
                  onAddFrame('circle');
                  setShowMobileShapes(false);
                }}
                className="p-3 bg-[#edeae1] active:bg-[#dcd7cb] rounded-xl flex flex-col items-center justify-center gap-1.5"
              >
                <Circle className="w-6 h-6 text-[#556354]" />
                <span className="text-[11px] font-medium">正圓形</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetMode('select');
                  onAddFrame('ellipse');
                  setShowMobileShapes(false);
                }}
                className="p-3 bg-[#edeae1] active:bg-[#dcd7cb] rounded-xl flex flex-col items-center justify-center gap-1.5"
              >
                <Shapes className="w-6 h-6 text-[#556354]" />
                <span className="text-[11px] font-medium">橢圓形</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetMode('polygon-create');
                  setShowMobileShapes(false);
                }}
                className="p-3 bg-[#edeae1] active:bg-[#dcd7cb] rounded-xl flex flex-col items-center justify-center gap-1.5"
              >
                <Pentagon className="w-6 h-6 text-[#556354]" />
                <span className="text-[11px] font-medium">多邊形</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
