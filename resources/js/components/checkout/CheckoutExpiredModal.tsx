import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export interface CheckoutExpiredModalProps {
  isExpired: boolean;
  onReturnToCart: () => void;
}

export const CheckoutExpiredModal: React.FC<CheckoutExpiredModalProps> = ({
  isExpired,
  onReturnToCart,
}) => {
  if (!isExpired) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-cream-200 animate-scale-up">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
          <AlertTriangle size={32} className="text-amber-500" />
        </div>

        <div>
          <h3 className="font-display font-bold text-xl text-ink-900">
            Phiên thanh toán đã hết hạn!
          </h3>
          <p className="text-xs text-ink-500 mt-1 leading-relaxed">
            Thời gian giữ đơn hàng (15 phút) đã kết thúc nhằm đảm bảo số lượng tồn kho chính xác cho khách hàng khác. Vui lòng quay lại giỏ hàng để cập nhật và thanh toán lại.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onReturnToCart}
            className="w-full btn-accent py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ArrowLeft size={16} />
            <span>Quay lại giỏ hàng</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
