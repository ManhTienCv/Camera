import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Product } from '../../../types';
import { formatCurrency } from '../../../lib/utils';

export interface ProductViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-ink-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scale-in border border-cream-200 dark:border-ink-800 cursor-default text-ink-900 dark:text-cream-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 dark:border-ink-800">
          <h3 className="text-lg font-bold text-ink-900 dark:text-cream-50">Chi tiết sản phẩm</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-cream-100 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-20 h-20 rounded-2xl object-cover border border-cream-200 dark:border-ink-700 bg-cream-50 dark:bg-ink-800"
            />
            <div>
              <h4 className="font-bold text-ink-900 dark:text-cream-50">{product.name}</h4>
              <p className="text-xs text-ink-500 dark:text-ink-400">Hãng: {product.brand}</p>
              <p className="text-lg font-bold text-accent-500 mt-1">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>
          <p className="text-xs text-ink-600 dark:text-cream-200 leading-relaxed bg-cream-50 dark:bg-ink-800/60 p-3.5 rounded-xl border border-cream-200 dark:border-ink-700">
            {product.description || 'Chưa có mô tả chi tiết.'}
          </p>
        </div>
        <div className="pt-3 border-t border-cream-200 dark:border-ink-800 text-right">
          <button onClick={onClose} className="btn-primary px-4 py-2 text-sm font-medium rounded-xl cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
