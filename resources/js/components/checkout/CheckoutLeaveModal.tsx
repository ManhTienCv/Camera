import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export interface CheckoutLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
}

export const CheckoutLeaveModal: React.FC<CheckoutLeaveModalProps> = ({
  isOpen,
  onClose,
  onConfirmLeave,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-cream-200 animate-scale-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-400 hover:text-ink-700 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
          <AlertTriangle size={24} className="text-amber-500" />
        </div>

        <div>
          <h3 className="font-display font-bold text-lg text-ink-900">
            Quay Lại Giỏ Hàng?
          </h3>
          <p className="text-xs text-ink-500 mt-1 leading-relaxed">
            Thời gian giữ đơn 15 phút sẽ bị hủy bỏ nếu bạn rời khỏi trang thanh toán.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-cream-300 hover:bg-cream-100 text-ink-700 text-xs font-bold transition-all cursor-pointer"
          >
            Ở Lại Tiếp Tục
          </button>
          <button
            type="button"
            onClick={onConfirmLeave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Rời Khỏi
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
