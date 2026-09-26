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
    <div className="fixed bottom-[82px] right-6 z-40 select-none print:hidden animate-fade-in">
      <button
        type="button"
        onClick={handleOpen}
        className="group relative flex items-center gap-2.5 px-3.5 py-2.5 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border border-accent-300 dark:border-accent-700/80 hover:border-accent-500 rounded-full shadow-md hover:shadow-xl transition-all duration-300 active:scale-95 cursor-pointer text-ink-900 dark:text-cream-50"
        title="Trợ lý AI tư vấn chọn máy ảnh phù hợp trong 60 giây"
        aria-label="Trợ lý AI tư vấn chọn máy ảnh"
      >
        {/* Glow pulsing ring */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500"></span>
        </span>



        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-tight text-ink-900 dark:text-white">
            Tư vấn chọn máy
          </span>

        </div>
      </button>
    </div>
  );
};
