import React, { useRef, useState, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  FolderOpen,
  Save,
  Layers,
  ShieldAlert,
  ChevronDown,
  FileImage,
  FileType,
  FileText,
  FileCode,
  Menu,
  X,
} from 'lucide-react';
import { CanvasData, CanvasPreset, OverlapMode } from '../types';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canvas: CanvasData;
  onChangePreset: (preset: CanvasPreset, customWidth?: number, customHeight?: number) => void;
  overlapMode: OverlapMode;
  onToggleOverlapMode: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResetZoom: () => void;
  onFitZoom: () => void;
  onSaveProject: () => void;
  onOpenProjectFile: (file: File) => void;
  onExport: (format: 'png' | 'jpg' | 'pdf' | 'docx') => void;
  isSidePanelOpen?: boolean;
  onToggleSidePanel?: () => void;
}

export const TopBar: React.FC<Props> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  canvas,
  onChangePreset,
  overlapMode,
  onToggleOverlapMode,
  zoom,
  onZoomChange,
  onResetZoom,
  onFitZoom,
  onSaveProject,
  onOpenProjectFile,
  onExport,
  isSidePanelOpen,
  onToggleSidePanel,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [customW, setCustomW] = useState(canvas.width);
  const [customH, setCustomH] = useState(canvas.height);

  useEffect(() => {
    setCustomW(canvas.width);
    setCustomH(canvas.height);
  }, [canvas.width, canvas.height]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuFileInputRef = useRef<HTMLInputElement>(null);

  const presetLabels: Record<CanvasPreset, string> = {
    A4_PORTRAIT: 'A4 直式 (210 × 297 mm)',
    A4_LANDSCAPE: 'A4 橫式 (297 × 210 mm)',
    A3: 'A3 (297 × 420 mm)',
    A5: 'A5 (148 × 210 mm)',
    CUSTOM: `自訂 (${canvas.unit === 'mm' && canvas.physicalWidth ? `${canvas.physicalWidth} × ${canvas.physicalHeight} mm` : `${canvas.width} × ${canvas.height} px`})`,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onOpenProjectFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleApplyCustom = () => {
    if (customW > 50 && customH > 50) {
      onChangePreset('CUSTOM', customW, customH);
      setShowCustomModal(false);
    }
  };

  return (
    <header
      id="top-bar"
      className="h-14 bg-[#faf9f5] border-b border-[#e5e1d8] flex items-center justify-between px-2 sm:px-4 text-[#3c3731] select-none z-30 shrink-0 shadow-xs"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={mobileMenuFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: App Title & Undo/Redo */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5 mr-1 sm:mr-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#556354] flex items-center justify-center font-medium text-white shadow-xs text-base shrink-0">
            👦
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-xs sm:text-sm font-semibold tracking-wider text-[#2e2a25] whitespace-nowrap">圖片版面設計君</h1>
            <span className="text-[9px] sm:text-[10px] text-[#8c857b] hidden sm:block -mt-0.5 tracking-wider whitespace-nowrap">日式簡約・圖片拼貼</span>
          </div>
        </div>

        <div className="h-5 w-px bg-[#e5e1d8] mx-0.5 sm:mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="復原 (Ctrl+Z)"
            className="p-1.5 rounded-lg hover:bg-[#ede9df] active:bg-[#dcd7cb] disabled:opacity-30 disabled:hover:bg-transparent text-[#5c554c] transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            id="btn-redo"
            onClick={onRedo}
            disabled={!canRedo}
            title="重做 (Ctrl+Y)"
            className="p-1.5 rounded-lg hover:bg-[#ede9df] active:bg-[#dcd7cb] disabled:opacity-30 disabled:hover:bg-transparent text-[#5c554c] transition-colors cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop-only: Canvas Preset Selector */}
        <div className="hidden lg:block relative ml-1">
          <button
            id="btn-canvas-preset"
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f2eb] hover:bg-[#edeae1] border border-[#dcd7cb] rounded-lg text-xs font-medium text-[#463f37] transition-colors cursor-pointer"
          >
            <span>{presetLabels[canvas.preset] || '畫布規格'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#888176]" />
          </button>

          {showPresetMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPresetMenu(false)} />
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#ffffff] border border-[#ddd8cd] rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  onChangePreset('A4_PORTRAIT');
                  setShowPresetMenu(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-[#f4f2eb] transition-colors ${
                  canvas.preset === 'A4_PORTRAIT' ? 'text-[#556354] font-semibold bg-[#f4f2eb]' : 'text-[#4a433b]'
                }`}
              >
                <div>A4 直式 (210 × 297 mm)</div>
                <div className="text-[10px] text-[#8c8275]">顯示解析度 794 × 1123 px</div>
              </button>
              <button
                onClick={() => {
                  onChangePreset('A4_LANDSCAPE');
                  setShowPresetMenu(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-[#f4f2eb] transition-colors ${
                  canvas.preset === 'A4_LANDSCAPE' ? 'text-[#556354] font-semibold bg-[#f4f2eb]' : 'text-[#4a433b]'
                }`}
              >
                <div>A4 橫式 (297 × 210 mm)</div>
                <div className="text-[10px] text-[#8c8275]">顯示解析度 1123 × 794 px</div>
              </button>
              <button
                onClick={() => {
                  onChangePreset('A3');
                  setShowPresetMenu(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-[#f4f2eb] transition-colors ${
                  canvas.preset === 'A3' ? 'text-[#556354] font-semibold bg-[#f4f2eb]' : 'text-[#4a433b]'
                }`}
              >
                <div>A3 (297 × 420 mm)</div>
                <div className="text-[10px] text-[#8c8275]">顯示解析度 1123 × 1587 px</div>
              </button>
              <button
                onClick={() => {
                  onChangePreset('A5');
                  setShowPresetMenu(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-[#f4f2eb] transition-colors ${
                  canvas.preset === 'A5' ? 'text-[#556354] font-semibold bg-[#f4f2eb]' : 'text-[#4a433b]'
                }`}
              >
                <div>A5 (148 × 210 mm)</div>
                <div className="text-[10px] text-[#8c8275]">顯示解析度 559 × 794 px</div>
              </button>
              <div className="h-px bg-[#eeebe2] my-1" />
              <button
                onClick={() => {
                  setShowCustomModal(true);
                  setShowPresetMenu(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-[#f4f2eb] transition-colors ${
                  canvas.preset === 'CUSTOM' ? 'text-[#556354] font-semibold bg-[#f4f2eb]' : 'text-[#4a433b]'
                }`}
              >
                自訂尺寸...
              </button>
            </div>
            </>
          )}
        </div>

        {/* Desktop-only: Overlap Mode Toggle (Section 21, 37) */}
        <button
          id="btn-toggle-overlap"
          onClick={onToggleOverlapMode}
          title={
            overlapMode === 'allowed'
              ? '重疊設定：允許重疊（移動整個圖框時自動置頂）'
              : '重疊設定：禁止重疊（若移動造成重疊將自動還原位置）'
          }
          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            overlapMode === 'allowed'
              ? 'bg-[#f4f2eb] hover:bg-[#edeae1] border-[#dcd7cb] text-[#463f37]'
              : 'bg-[#faf0e8] hover:bg-[#f5e7db] border-[#dfbfa8] text-[#874f2d]'
          }`}
        >
          {overlapMode === 'allowed' ? (
            <>
              <Layers className="w-3.5 h-3.5 text-[#556354]" />
              <span>允許重疊 (自動置頂)</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-[#874f2d]" />
              <span>禁止重疊 (防碰撞還原)</span>
            </>
          )}
        </button>
      </div>

      {/* Right: Zoom controls, Save/Open, Export + Mobile Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Desktop Zoom Controls */}
        <div className="hidden lg:flex items-center bg-[#f4f2eb] border border-[#dcd7cb] rounded-lg p-0.5 text-xs text-[#463f37] mr-1">
          <button
            id="btn-zoom-out"
            onClick={() => onZoomChange(Math.max(0.25, Math.round((zoom - 0.1) * 100) / 100))}
            title="縮小 (-10%)"
            className="p-1 hover:bg-[#e7e3d8] rounded transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Range Slider (0.25x ~ 2x) */}
          <div className="flex items-center px-1.5" title={`畫布縮放: ${Math.round(zoom * 100)}% (0.25x ~ 2.0x)`}>
            <input
              id="slider-zoom"
              type="range"
              min="0.25"
              max="2"
              step="0.01"
              value={Math.min(2, Math.max(0.25, zoom))}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              aria-label="畫布縮放比例滑桿"
              className="w-16 sm:w-24 h-1.5 accent-[#556354] bg-[#ded9ce] rounded-full cursor-pointer appearance-none focus:outline-none"
            />
          </div>

          <button
            id="btn-zoom-reset"
            onClick={onResetZoom}
            title="重設為 100%"
            className="px-2 py-0.5 hover:bg-[#e7e3d8] rounded font-mono text-[11px] transition-colors cursor-pointer text-[#3c3731]"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            id="btn-zoom-in"
            onClick={() => onZoomChange(Math.min(2, Math.round((zoom + 0.1) * 100) / 100))}
            title="放大 (+10%)"
            className="p-1 hover:bg-[#e7e3d8] rounded transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-zoom-fit"
            onClick={onFitZoom}
            title="最適大小"
            className="p-1 hover:bg-[#e7e3d8] rounded border-l border-[#dcd7cb] ml-0.5 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3 text-[#6b645b]" />
          </button>
        </div>

        {/* Tablet/Mobile Quick Fit/Zoom Button */}
        <div className="flex lg:hidden items-center bg-[#f4f2eb] border border-[#dcd7cb] rounded-lg text-xs">
          <button
            onClick={onFitZoom}
            title="最適大小"
            className="p-1.5 hover:bg-[#e7e3d8] active:bg-[#ded9ce] rounded transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#556354]" />
          </button>
          <button
            onClick={onResetZoom}
            title="重設 100%"
            className="px-1.5 py-1 hover:bg-[#e7e3d8] active:bg-[#ded9ce] text-[10px] font-mono text-[#5c554c]"
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>

        {/* Desktop-only: Project Open / Save */}
        <button
          id="btn-open-project"
          onClick={() => fileInputRef.current?.click()}
          title="開啟專案 (.json)"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f2eb] hover:bg-[#edeae1] border border-[#dcd7cb] text-[#463f37] rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#736c62]" />
          <span>開啟專案</span>
        </button>

        <button
          id="btn-save-project"
          onClick={onSaveProject}
          title="儲存專案 (.json 包含完整影像與資料)"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f2eb] hover:bg-[#edeae1] border border-[#dcd7cb] text-[#463f37] rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-[#736c62]" />
          <span>儲存專案</span>
        </button>

        {/* Export Dropdown (Always visible or compact on mobile) */}
        <div className="relative">
          <button
            id="btn-export-dropdown"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#556354] hover:bg-[#465345] active:bg-[#384337] text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">匯出檔案</span>
            <span className="sm:hidden">匯出</span>
            <ChevronDown className="w-3 h-3 text-[#d1dbd0]" />
          </button>

          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#ffffff] border border-[#ddd8cd] rounded-lg shadow-xl py-1 z-50">
              <button
                id="btn-export-png"
                onClick={() => {
                  onExport('png');
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-left text-xs hover:bg-[#f4f2eb] text-[#3c3731] transition-colors cursor-pointer"
              >
                <FileImage className="w-4 h-4 text-[#556354]" />
                <div>
                  <div className="font-medium">匯出 PNG</div>
                  <div className="text-[10px] text-[#8c857b]">支援透明度、高解析度</div>
                </div>
              </button>

              <button
                id="btn-export-jpg"
                onClick={() => {
                  onExport('jpg');
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-left text-xs hover:bg-[#f4f2eb] text-[#3c3731] transition-colors cursor-pointer"
              >
                <FileType className="w-4 h-4 text-[#6e7787]" />
                <div>
                  <div className="font-medium">匯出 JPG</div>
                  <div className="text-[10px] text-[#8c857b]">自動填色、高品質圖片</div>
                </div>
              </button>

              <button
                id="btn-export-pdf"
                onClick={() => {
                  onExport('pdf');
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-left text-xs hover:bg-[#f4f2eb] text-[#3c3731] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#9c6a5d]" />
                <div>
                  <div className="font-medium">匯出 PDF</div>
                  <div className="text-[10px] text-[#8c857b]">PDF 文件（高解析度圖片）</div>
                </div>
              </button>

              <button
                id="btn-export-docx"
                onClick={() => {
                  onExport('docx');
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-left text-xs hover:bg-[#f4f2eb] text-[#3c3731] transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-[#756a5c]" />
                <div>
                  <div className="font-medium">匯出 DOCX</div>
                  <div className="text-[10px] text-[#8c857b]">Word 原生文件嵌入排版</div>
                </div>
              </button>
            </div>
            </>
          )}
        </div>

        {/* Top-Right Menu & Collapsible Window Toggle Button (Three Lines / Hamburger) */}
        <button
          id="btn-toggle-side-panel"
          type="button"
          onClick={() => {
            if (onToggleSidePanel) {
              onToggleSidePanel();
            } else {
              setShowMobileMenu((prev) => !prev);
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isSidePanelOpen
              ? 'bg-[#556354] text-white shadow-xs'
              : 'hover:bg-[#ede9df] active:bg-[#dcd7cb] text-[#5c554c]'
          }`}
          title={isSidePanelOpen ? '收合側邊視窗 (快捷鍵: M)' : '開啟側邊視窗 (快捷鍵: M)'}
        >
          <Menu className="w-5 h-5" />
          <span className="hidden xl:inline text-xs font-medium">
            {isSidePanelOpen ? '收合視窗' : '側邊視窗'}
          </span>
        </button>
      </div>

      {/* Mobile / Tablet Comprehensive Menu Drawer / Modal */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="bg-[#faf9f5] border border-[#d8d3c5] rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 text-[#36322b]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e1d8]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#282521]">畫布與專案設定</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-1 text-[#8c8275] hover:text-[#282521]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Canvas Preset */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#556354] block">畫布規格尺寸</label>
              <div className="grid grid-cols-2 gap-2">
                {(['A4_PORTRAIT', 'A4_LANDSCAPE', 'A3', 'A5'] as CanvasPreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onChangePreset(p);
                      setShowMobileMenu(false);
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                      canvas.preset === p
                        ? 'bg-[#556354] text-white border-[#556354] font-medium'
                        : 'bg-[#ffffff] text-[#4a433b] border-[#dcd7cb] hover:bg-[#f4f2eb]'
                    }`}
                  >
                    <div>{p === 'A4_PORTRAIT' ? 'A4 直式' : p === 'A4_LANDSCAPE' ? 'A4 橫式' : p}</div>
                    <div className={`text-[10px] mt-0.5 ${canvas.preset === p ? 'text-white/80' : 'text-[#8c8275]'}`}>
                      {p === 'A4_PORTRAIT' ? '210 × 297 mm' : p === 'A4_LANDSCAPE' ? '297 × 210 mm' : p === 'A3' ? '297 × 420 mm' : '148 × 210 mm'}
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowCustomModal(true);
                }}
                className={`w-full py-2 px-3 rounded-lg border text-xs text-center transition-colors ${
                  canvas.preset === 'CUSTOM'
                    ? 'bg-[#556354] text-white border-[#556354] font-medium'
                    : 'bg-[#ffffff] text-[#4a433b] border-[#dcd7cb] hover:bg-[#f4f2eb]'
                }`}
              >
                自訂畫布尺寸...
              </button>
            </div>

            {/* 2. Overlap Mode */}
            <div className="space-y-2 pt-2 border-t border-[#e5e1d8]">
              <label className="text-xs font-semibold text-[#556354] block">重疊設定</label>
              <button
                type="button"
                onClick={onToggleOverlapMode}
                className={`w-full p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                  overlapMode === 'allowed'
                    ? 'bg-[#f4f2eb] border-[#dcd7cb] text-[#463f37]'
                    : 'bg-[#faf0e8] border-[#dfbfa8] text-[#874f2d]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {overlapMode === 'allowed' ? (
                    <Layers className="w-4 h-4 text-[#556354]" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-[#874f2d]" />
                  )}
                  <span className="font-medium">
                    {overlapMode === 'allowed' ? '允許重疊 (自動置頂)' : '禁止重疊 (碰撞還原)'}
                  </span>
                </div>
                <span className="text-[11px] underline">點擊切換</span>
              </button>
            </div>

            {/* 3. Canvas Zoom Slider */}
            <div className="space-y-2 pt-2 border-t border-[#e5e1d8]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#556354]">畫布縮放比例</span>
                <span className="font-mono text-[#2c2824]">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="2"
                step="0.01"
                value={Math.min(2, Math.max(0.25, zoom))}
                onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                className="w-full h-2 accent-[#556354] bg-[#ded9ce] rounded-full"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onResetZoom}
                  className="flex-1 py-1.5 bg-[#edeae1] rounded text-xs text-[#4a433b] hover:bg-[#ded9ce]"
                >
                  重設 100%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onFitZoom();
                    setShowMobileMenu(false);
                  }}
                  className="flex-1 py-1.5 bg-[#edeae1] rounded text-xs text-[#4a433b] hover:bg-[#ded9ce]"
                >
                  最適大小
                </button>
              </div>
            </div>

            {/* 4. Project Save & Open */}
            <div className="space-y-2 pt-2 border-t border-[#e5e1d8]">
              <label className="text-xs font-semibold text-[#556354] block">專案檔案</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    mobileMenuFileInputRef.current?.click();
                  }}
                  className="py-2.5 px-3 bg-[#ffffff] border border-[#dcd7cb] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 text-[#463f37]"
                >
                  <FolderOpen className="w-4 h-4 text-[#736c62]" />
                  <span>開啟專案</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onSaveProject();
                  }}
                  className="py-2.5 px-3 bg-[#ffffff] border border-[#dcd7cb] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 text-[#463f37]"
                >
                  <Save className="w-4 h-4 text-[#736c62]" />
                  <span>儲存專案</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Canvas Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#faf9f5] border border-[#d8d3c7] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-[#36322b]">
            <h3 className="text-sm font-semibold text-[#282521]">自訂畫布尺寸 (像素)</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[#6d665c] block mb-1">寬度 (px)</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={customW}
                  onChange={(e) => setCustomW(Number(e.target.value))}
                  className="w-full bg-[#ffffff] border border-[#d8d3c7] rounded px-2.5 py-1.5 text-[#282521] focus:outline-hidden focus:border-[#556354]"
                />
              </div>
              <div>
                <label className="text-[#6d665c] block mb-1">高度 (px)</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={customH}
                  onChange={(e) => setCustomH(Number(e.target.value))}
                  className="w-full bg-[#ffffff] border border-[#d8d3c7] rounded px-2.5 py-1.5 text-[#282521] focus:outline-hidden focus:border-[#556354]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 rounded bg-[#eeebe3] hover:bg-[#e4e0d5] text-[#554f46] text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleApplyCustom}
                className="px-3 py-1.5 rounded bg-[#556354] hover:bg-[#465345] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                確認設定
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

