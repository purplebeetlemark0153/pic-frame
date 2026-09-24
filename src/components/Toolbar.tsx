import React, { useRef } from 'react';
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImageToSelectedOrNew(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <aside
      id="left-toolbar"
      className="w-18 bg-[#f8f6f0] border-r border-[#e5e1d8] flex flex-col items-center py-4 gap-2 select-none z-20 shrink-0 text-[#4a433a]"
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
        onClick={onSelectBackground}
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
        title={showGrid ? "關閉對齊格線 (目前開啟，快捷鍵: G)" : "開啟對齊格線 (輔助精確對齊，快捷鍵: G)"}
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
  );
};
