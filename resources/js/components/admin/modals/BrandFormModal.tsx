import React from 'react';
import { createPortal } from 'react-dom';
import { X, Tag } from 'lucide-react';
import type { Brand } from '../../../types';

export interface BrandFormModalProps {
  show: boolean;
  editingBrand: Brand | null;
  formData: { name: string; description: string; logo_url?: string };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading?: boolean;
}

export const BrandFormModal: React.FC<BrandFormModalProps> = ({
  show,
  editingBrand,
  formData,
  setFormData,
  onSubmit,
  onClose,
  loading = false,
}) => {
  if (!show) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-ink-900 rounded-2xl max-w-[440px] w-full p-5 shadow-2xl animate-scale-in border border-cream-200 dark:border-ink-800 cursor-default text-ink-900 dark:text-cream-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-400 flex items-center justify-center">
              <Tag size={18} />
            </div>
            <h3 className="text-xl font-display font-bold text-ink-900 dark:text-cream-50">
              {editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 dark:hover:text-cream-100 p-1 rounded-lg hover:bg-cream-100 dark:hover:bg-ink-800 cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 uppercase mb-1">
              Tên thương hiệu *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Hasselblad, Insta360, Godox, Rode..."
              className="input-field text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 uppercase mb-1">
              Mô tả thương hiệu
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả tóm tắt về hãng sản xuất, nguồn gốc, công nghệ..."
              className="input-field text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 uppercase mb-1">
              Đường dẫn Logo URL (tùy chọn)
            </label>
            <input
              type="url"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="input-field text-sm"
            />
          </div>

          <div className="pt-4 border-t border-cream-200 dark:border-ink-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-cream-300 dark:border-ink-700 rounded-xl text-sm font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-accent px-5 py-2 text-sm font-semibold rounded-xl cursor-pointer active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : editingBrand ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
