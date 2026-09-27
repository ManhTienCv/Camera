import React from 'react';
import { createPortal } from 'react-dom';
import { Truck, X } from 'lucide-react';
import type { EnhancedOrder } from './types';

export interface OrderTrackingModalProps {
  order: EnhancedOrder | null;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-cream-200 space-y-6 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-cream-100">
          <div className="flex items-center gap-2">
            <Truck size={20} className="text-blue-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">
              Hành Trình Giao Hàng ({order.order_code})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-ink-400">Đối tác vận chuyển:</span>
            <span className="font-bold text-ink-900">{order.shippingPartner}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-400">Mã vận đơn bưu cục:</span>
            <span className="font-bold font-mono text-accent-600">{order.trackingCode}</span>
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="space-y-6 pl-2 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-cream-200">
          {(order.journey || []).map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                  step.done
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step.current
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                    : 'bg-cream-200 text-ink-400'
                }`}
              >
                {step.done ? '✓' : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-bold text-xs text-ink-900">{step.title}</h5>
                  <span className="text-[10px] text-ink-400">{step.time}</span>
                </div>
                <p className="text-xs text-ink-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-cream-100 hover:bg-cream-200 text-xs font-bold text-ink-800 rounded-2xl transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>,
    document.body
  );
};
