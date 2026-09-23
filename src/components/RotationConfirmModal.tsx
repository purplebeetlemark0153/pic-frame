import React from 'react';
import { RotationDialogRequest } from '../types';
import { RotateCw, RefreshCw, X } from 'lucide-react';

interface Props {
  request: RotationDialogRequest;
}

export const RotationConfirmModal: React.FC<Props> = ({ request }) => {
  // Support Escape key to cancel
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        request.onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request]);

  return (
    <div
      id="rotation-confirm-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          request.onCancel();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2824]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans"
    >
      <div className="bg-[#faf9f5] border border-[#d8d3c5] text-[#38332c] rounded-xl shadow-xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e1d8]">
          <div className="flex items-center gap-2 text-[#556354] font-semibold text-base">
            <RotateCw className="w-5 h-5" />
            <span>旋轉確認</span>
          </div>
          <button
            id="btn-rotation-modal-close"
            onClick={request.onCancel}
            className="text-[#8c8275] hover:text-[#2c2824] transition-colors p-1 rounded hover:bg-[#edeae1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-base font-medium text-[#2c2824]">
            圖片要跟著圖框一起旋轉嗎？
          </p>
          <p className="text-xs text-[#736c62] leading-relaxed">
            若選擇「不隨圖框旋轉」，系統將自動重新計算圖片在圖框內的相對角度，使圖片在畫布上的最終視覺方向保持不變。
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            id="btn-rotation-follow"
            onClick={() => request.onConfirm('follow')}
            className="flex items-center justify-between w-full px-4 py-3 bg-[#556354] hover:bg-[#465345] active:bg-[#384337] text-white rounded-lg font-medium transition-all text-sm shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              <span>圖片跟圖框一起旋轉</span>
            </div>
            <span className="text-xs text-[#dbe2da]">視覺角度同步變化</span>
          </button>

          <button
            id="btn-rotation-do-not-follow"
            onClick={() => request.onConfirm('doNotFollow')}
            className="flex items-center justify-between w-full px-4 py-3 bg-[#edeae1] hover:bg-[#e2ded3] active:bg-[#d6d1c4] border border-[#d8d3c5] text-[#38332c] rounded-lg font-medium transition-all text-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#556354]" />
              <span>圖片不隨圖框旋轉</span>
            </div>
            <span className="text-xs text-[#736c62]">保持視覺水平/原有方向</span>
          </button>

          <button
            id="btn-rotation-cancel"
            onClick={request.onCancel}
            className="w-full px-4 py-2 mt-1 bg-transparent hover:bg-[#edeae1] text-[#8c8275] hover:text-[#2c2824] rounded-lg text-xs transition-colors cursor-pointer"
          >
            取消旋轉 (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
