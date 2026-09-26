import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, X, ArrowRight, Trash2 } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import type { Page } from '../types';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const CompareTray: React.FC<Props> = ({ currentPage, onNavigate }) => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  // Ẩn thanh so sánh nếu đang ở trang so sánh hoặc danh sách rỗng
  if (currentPage.name === 'compare' || compareItems.length === 0) {
    return null;
  }

  const handleOpenCompare = () => {
    onNavigate({
      name: 'compare',
      ids: compareItems.map((p) => p.id),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-white/95 dark:bg-ink-900/95 backdrop-blur-xl border border-cream-200 dark:border-ink-700 rounded-3xl shadow-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-ink-900 dark:text-cream-100"
      >
        {/* Left: Indicator & Thumbnails */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-2xl bg-accent-500/10 text-accent-600 dark:text-accent-400 shrink-0">
            <ArrowLeftRight size={20} />
          </div>

          <div className="flex items-center gap-2">
            {compareItems.map((item) => (
              <div
                key={item.id}
                className="relative group w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cream-100 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 overflow-hidden shrink-0 shadow-2xs"
                title={item.name}
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFromCompare(item.id)}
                  className="absolute inset-0 bg-ink-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Bỏ khỏi so sánh"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="hidden md:flex w-12 h-12 rounded-2xl border-2 border-dashed border-cream-300 dark:border-ink-800 items-center justify-center text-ink-300 dark:text-ink-600 text-xs font-semibold"
                title="Thêm máy ảnh để so sánh"
              >
                +
              </div>
            ))}
          </div>

          <div className="hidden sm:block text-left pl-1">
            <p className="text-xs font-bold text-ink-900 dark:text-cream-50 leading-tight">
              So sánh thông số ({compareItems.length}/4)
            </p>
            <p className="text-[11px] text-ink-400 dark:text-cream-400">
              {compareItems.length >= 2 ? 'Sẵn sàng phân tích chi tiết' : 'Chọn thêm ít nhất 1 máy'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearCompare}
            className="p-2 sm:px-3 sm:py-2 text-ink-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Xóa tất cả danh sách so sánh"
          >
            <Trash2 size={16} className="sm:hidden" />
            <span className="hidden sm:inline">Xóa tất cả</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCompare}
            disabled={compareItems.length < 2}
            className="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>So sánh ngay</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
