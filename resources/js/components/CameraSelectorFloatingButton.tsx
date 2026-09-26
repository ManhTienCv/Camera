import React from 'react';
import { Sparkles, Camera } from 'lucide-react';
import type { Page } from '../types';

interface Props {
  currentPage: Page;
}

export const CameraSelectorFloatingButton: React.FC<Props> = ({ currentPage }) => {
  // Không hiển thị ở trang admin hoặc khi đang checkout
  if (currentPage.name === 'admin' || currentPage.name === 'checkout') {
    return null;
  }

  const handleOpen = () => {
    window.dispatchEvent(new Event('camerahub_open_selector'));
  };

  return (
    <div className="fixed bottom-5 left-4 sm:left-6 z-40">
      <button
        type="button"
        onClick={handleOpen}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border border-accent-300 dark:border-accent-700 hover:border-accent-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 cursor-pointer text-ink-900 dark:text-cream-50"
        title="Trợ lý AI tư vấn chọn máy ảnh phù hợp trong 60 giây"
        aria-label="Trợ lý AI tư vấn chọn máy ảnh"
      >
        {/* Glow pulsing ring */}
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500"></span>
        </span>

        <div className="w-7 h-7 rounded-full bg-accent-50 dark:bg-accent-950/80 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Sparkles size={15} className="animate-pulse" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-xs font-extrabold tracking-tight text-ink-900 dark:text-white flex items-center gap-1">
            <span>Tư vấn chọn máy</span>
            <span className="text-[10px] font-extrabold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/80 px-1 rounded">
              AI 60s
            </span>
          </span>
          <span className="text-[10px] text-ink-400 dark:text-cream-400 hidden sm:inline">
            Tìm combo chuẩn nhu cầu
          </span>
        </div>
      </button>
    </div>
  );
};
