import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Page } from '../types';

interface Props {
  currentPage: Page;
}

export const CameraSelectorFloatingButton: React.FC<Props> = ({ currentPage }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Lắng nghe trạng thái mở popup LiveChat để tạm ẩn nút khi khách đang chat
  useEffect(() => {
    const handleChatState = (e: any) => {
      if (e?.detail?.isOpen !== undefined) {
        setIsChatOpen(e.detail.isOpen);
      }
    };
    window.addEventListener('camerahub_chat_state', handleChatState);
    return () => window.removeEventListener('camerahub_chat_state', handleChatState);
  }, []);

  // Không hiển thị ở trang admin, trang checkout hoặc khi khung chat đang mở
  if (currentPage.name === 'admin' || currentPage.name === 'checkout' || isChatOpen) {
    return null;
  }

  const handleOpen = () => {
    window.dispatchEvent(new Event('camerahub_open_selector'));
  };

  return (
    <div className="fixed bottom-[80px] right-0 z-40 select-none print:hidden animate-fade-in">
      <button
        type="button"
        onClick={handleOpen}
        className="group relative flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border border-r-0 border-accent-300 dark:border-accent-700/80 hover:border-accent-500 rounded-l-full shadow-md hover:shadow-2xl transition-transform duration-300 ease-out active:scale-95 cursor-pointer text-ink-900 dark:text-cream-50 translate-x-[calc(100%-54px)] hover:translate-x-0"
        title="Trợ lý AI tư vấn chọn máy ảnh phù hợp trong 60 giây"
        aria-label="Trợ lý AI tư vấn chọn máy ảnh"
      >
        {/* Glow pulsing ring */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500"></span>
        </span>

        <div className="w-6 h-6 rounded-full bg-accent-50 dark:bg-accent-950/80 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Sparkles size={14} className="animate-pulse" />
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap pl-0.5">
          <span className="text-xs font-bold tracking-tight text-ink-900 dark:text-white">
            Tư vấn chọn máy
          </span>
          <span className="text-[10px] font-extrabold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/80 px-1.5 py-0.5 rounded-full border border-accent-200 dark:border-accent-800">
            AI 60s
          </span>
        </div>
      </button>
    </div>
  );
};
