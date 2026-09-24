import React, { useState, useEffect } from 'react';
import { Pipette, Palette, Square, Paintbrush, Type, Copy, Check, X } from 'lucide-react';
import { FrameData } from '../types';

interface Props {
  color: string;
  selectedFrames: FrameData[];
  onApplyToCanvasBackground: (color: string) => void;
  onApplyToFrameBorder: (color: string) => void;
  onApplyToFrameBackground: (color: string) => void;
  onApplyToTextColor: (color: string) => void;
  onClose: () => void;
}

export const EyedropperResultModal: React.FC<Props> = ({
  color,
  selectedFrames,
  onApplyToCanvasBackground,
  onApplyToFrameBorder,
  onApplyToFrameBackground,
  onApplyToTextColor,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Parse RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2) || '0', 16);
  const g = parseInt(hex.substring(2, 4) || '0', 16);
  const b = parseInt(hex.substring(4, 6) || '0', 16);

  // Compute contrast text color for preview card
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isDark = luminance < 0.55;

  const hasSelectedFrames = selectedFrames.length > 0;
  const hasTextFrame = selectedFrames.some((f) => f.contentType === 'text');

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard?.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      id="eyedropper-result-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2824]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans"
    >
      <div className="bg-[#faf9f5] border border-[#d8d3c5] text-[#38332c] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e1d8]">
          <div className="flex items-center gap-2 text-[#556354] font-semibold text-base">
            <Pipette className="w-5 h-5 text-[#556354]" />
            <span>滴管已吸取顏色</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8c8275] hover:text-[#2c2824] transition-colors p-1.5 rounded-lg hover:bg-[#edeae1] cursor-pointer"
            title="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Color Display Card */}
        <div className="flex items-center gap-4 bg-[#f2efe9] p-3.5 rounded-xl border border-[#ded9cb]">
          <div
            className="w-16 h-16 rounded-xl border border-black/15 shadow-sm shrink-0 transition-transform flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <div
              className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                isDark ? 'bg-black/30 text-white' : 'bg-white/60 text-black'
              }`}
            >
              HEX
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-[#2c2824] tracking-wider uppercase">
                {color}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                title="複製色碼"
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-[#d0cac0] bg-[#faf9f6] hover:bg-[#eae5d8] text-[#556354] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製' : '複製'}</span>
              </button>
            </div>
            <div className="text-[11px] text-[#736c62] font-mono mt-0.5">
              rgb({r}, {g}, {b})
            </div>
            <div className="text-[11px] text-[#8c8275] mt-0.5">
              已自動保存至調色盤「最近吸取顏色」
            </div>
          </div>
        </div>

        {/* Action Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#556354] block">
            快速套用至 (Quick Apply)：
          </label>

          {/* 1. Canvas Background */}
          <button
            type="button"
            onClick={() => onApplyToCanvasBackground(color)}
            className="flex items-center justify-between w-full px-4 py-2.5 bg-[#ffffff] hover:bg-[#edeae1] border border-[#d8d3c5] rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#f0ede4] text-[#556354] group-hover:bg-[#556354] group-hover:text-white transition-colors">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#2c2824]">填滿畫布背景</div>
                <div className="text-[11px] text-[#8c8275]">將整張畫布底色設為此顏色</div>
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: color }}
            />
          </button>

          {/* 2. Selected Frame Border */}
          <button
            type="button"
            disabled={!hasSelectedFrames}
            onClick={() => onApplyToFrameBorder(color)}
            className={`flex items-center justify-between w-full px-4 py-2.5 border rounded-xl text-left transition-all shadow-2xs ${
              hasSelectedFrames
                ? 'bg-[#ffffff] hover:bg-[#edeae1] border-[#d8d3c5] cursor-pointer group'
                : 'bg-[#f5f3ee] border-[#e2ddd3] opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  hasSelectedFrames
                    ? 'bg-[#f0ede4] text-[#556354] group-hover:bg-[#556354] group-hover:text-white'
                    : 'bg-[#eae7df] text-[#a0978b]'
                }`}
              >
                <Square className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#2c2824]">
                  修改選取圖框邊框
                  {!hasSelectedFrames && <span className="text-[10px] text-[#a0978b] ml-1.5">(請先選取圖框)</span>}
                </div>
                <div className="text-[11px] text-[#8c8275]">
                  {hasSelectedFrames
                    ? `套用至已選取的 ${selectedFrames.length} 個圖框邊框`
                    : '將選取圖框外框設為此顏色 (可隨時調整粗細)'}
                </div>
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: color }}
            />
          </button>

          {/* 3. Selected Frame Background */}
          <button
            type="button"
            disabled={!hasSelectedFrames}
            onClick={() => onApplyToFrameBackground(color)}
            className={`flex items-center justify-between w-full px-4 py-2.5 border rounded-xl text-left transition-all shadow-2xs ${
              hasSelectedFrames
                ? 'bg-[#ffffff] hover:bg-[#edeae1] border-[#d8d3c5] cursor-pointer group'
                : 'bg-[#f5f3ee] border-[#e2ddd3] opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  hasSelectedFrames
                    ? 'bg-[#f0ede4] text-[#556354] group-hover:bg-[#556354] group-hover:text-white'
                    : 'bg-[#eae7df] text-[#a0978b]'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#2c2824]">
                  修改選取圖框底色
                  {!hasSelectedFrames && <span className="text-[10px] text-[#a0978b] ml-1.5">(請先選取圖框)</span>}
                </div>
                <div className="text-[11px] text-[#8c8275]">
                  {hasSelectedFrames
                    ? `將已選取的 ${selectedFrames.length} 個圖框底色填為此顏色`
                    : '填滿圖框內部襯底色'}
                </div>
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: color }}
            />
          </button>

          {/* 4. Text Color */}
          <button
            type="button"
            disabled={!hasTextFrame}
            onClick={() => onApplyToTextColor(color)}
            className={`flex items-center justify-between w-full px-4 py-2.5 border rounded-xl text-left transition-all shadow-2xs ${
              hasTextFrame
                ? 'bg-[#ffffff] hover:bg-[#edeae1] border-[#d8d3c5] cursor-pointer group'
                : 'bg-[#f5f3ee] border-[#e2ddd3] opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  hasTextFrame
                    ? 'bg-[#f0ede4] text-[#556354] group-hover:bg-[#556354] group-hover:text-white'
                    : 'bg-[#eae7df] text-[#a0978b]'
                }`}
              >
                <Type className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#2c2824]">
                  修改文字顏色
                  {!hasTextFrame && <span className="text-[10px] text-[#a0978b] ml-1.5">(需先選取文字圖框)</span>}
                </div>
                <div className="text-[11px] text-[#8c8275]">
                  {hasTextFrame ? '將文字圖框內的字型顏色改為此色' : '修改文字排版之字體色彩'}
                </div>
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: color }}
            />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-[#e5e1d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#edeae1] hover:bg-[#dcd7cb] text-[#556354] hover:text-[#2c2824] rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            完成 / 保留在色票
          </button>
        </div>
      </div>
    </div>
  );
};
