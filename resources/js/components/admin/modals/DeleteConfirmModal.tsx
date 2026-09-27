import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onClose,
}) => {
  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-ink-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-scale-in border border-cream-200 dark:border-ink-800 cursor-default text-ink-900 dark:text-cream-100" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} />
        </div>
        <h4 className="text-lg font-bold text-ink-900 dark:text-cream-50 mb-2">{title}</h4>
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-cream-300 dark:border-ink-700 rounded-xl text-sm font-medium text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium shadow-sm cursor-pointer active:scale-98 transition-all"
          >
            Xác nhận Xóa
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
