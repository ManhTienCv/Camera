import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Category } from '../../../types';

export interface CategoryFormModalProps {
  show: boolean;
  editingCategory: Category | null;
  formData: { name: string; description: string };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  show,
  editingCategory,
  formData,
  setFormData,
  onSubmit,
  onClose,
}) => {
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-ink-900 rounded-2xl max-w-[400px] w-full p-5 shadow-2xl animate-scale-in border border-cream-200 dark:border-ink-800 cursor-default text-ink-900 dark:text-cream-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 dark:border-ink-800">
          <h3 className="text-xl font-display font-bold text-ink-900 dark:text-cream-50">
            {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          </h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-cream-100 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 uppercase mb-1">
              Tên danh mục *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Máy ảnh Compact & Vlog"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 uppercase mb-1">
              Mô tả danh mục
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả..."
              className="input-field text-sm resize-none"
            />
          </div>
          <div className="pt-4 border-t border-cream-200 dark:border-ink-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-cream-300 dark:border-ink-700 rounded-xl text-sm text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button type="submit" className="btn-accent px-5 py-2 text-sm font-semibold rounded-xl cursor-pointer active:scale-98 transition-all">
              {editingCategory ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
