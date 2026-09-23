import React from 'react';
import { ContentSwitchDialogRequest } from '../types';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  request: ContentSwitchDialogRequest;
}

export const ContentSwitchModal: React.FC<Props> = ({ request }) => {
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

  const isImageToText = request.fromType === 'image' && request.toType === 'text';
  const isTextToImage = request.fromType === 'text' && request.toType === 'image';

  const message = isImageToText
    ? '切換成文字後，目前圖片將從此圖框移除，確定要切換嗎？'
    : isTextToImage
    ? '切換成圖片後，目前文字內容將被移除，確定要切換嗎？'
    : '切換內容類型將移除現有內容，確定要繼續嗎？';

  return (
    <div
      id="content-switch-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          request.onCancel();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2824]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans"
    >
      <div className="bg-[#faf9f5] border border-[#d8d3c5] text-[#38332c] rounded-xl shadow-xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e1d8]">
          <div className="flex items-center gap-2 text-[#8c6b45] font-semibold text-base">
            <AlertTriangle className="w-5 h-5 text-[#8c6b45]" />
            <span>內容切換確認</span>
          </div>
          <button
            id="btn-content-switch-close"
            onClick={request.onCancel}
            className="text-[#8c8275] hover:text-[#2c2824] transition-colors p-1 rounded hover:bg-[#edeae1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-base font-medium text-[#2c2824]">{message}</p>
          <p className="text-xs text-[#736c62] leading-relaxed">
            注意：圖框形狀、尺寸、旋轉與圖層均會保留。若需要復原原內容，可隨時按 Ctrl+Z 復原。
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            id="btn-content-switch-cancel"
            onClick={request.onCancel}
            className="px-4 py-2 bg-[#edeae1] hover:bg-[#e2ded3] text-[#484138] border border-[#d8d3c5] rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            取消 (Esc)
          </button>
          <button
            id="btn-content-switch-confirm"
            onClick={request.onConfirm}
            className="px-4 py-2 bg-[#556354] hover:bg-[#465345] active:bg-[#384337] text-white rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            確認切換
          </button>
        </div>
      </div>
    </div>
  );
};
