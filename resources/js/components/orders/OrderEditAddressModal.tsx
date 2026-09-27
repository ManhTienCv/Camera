import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, X } from 'lucide-react';
import type { EnhancedOrder } from './types';

export interface OrderEditAddressModalProps {
  order: EnhancedOrder | null;
  onClose: () => void;
  onSave: (orderId: string, newAddress: string) => void;
}

export const OrderEditAddressModal: React.FC<OrderEditAddressModalProps> = ({
  order,
  onClose,
  onSave,
}) => {
  const [addressText, setAddressText] = useState('');

  useEffect(() => {
    if (order) {
      setAddressText(order.shippingAddress || '');
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressText.trim()) return;
    onSave(order.id, addressText.trim());
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-cream-200 space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-cream-100">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-accent-500" />
            <h3 className="font-display font-bold text-lg text-ink-900">Sửa Địa Chỉ Nhận Hàng</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              Địa chỉ nhận hàng mới ({order.order_code}):
            </label>
            <textarea
              rows={3}
              required
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
              className="w-full p-3 bg-cream-50/70 border border-cream-200 rounded-2xl text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-accent-500 focus:bg-white resize-none"
            />
            <p className="text-[11px] text-ink-400 mt-1">
              * Bạn chỉ có thể sửa địa chỉ khi đơn hàng đang ở trạng thái Chờ Duyệt & Đóng Gói.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-cream-200 text-xs font-bold text-ink-700 hover:bg-cream-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-accent px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
