import React from 'react';
import { createPortal } from 'react-dom';
import { Tag, X } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { VoucherItem, AppliedVoucher } from './types';

export interface CheckoutVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableVouchers: VoucherItem[];
  appliedVoucher: AppliedVoucher | null;
  subtotal: number;
  onApplyVoucher: (code: string) => Promise<void>;
}

export const CheckoutVoucherModal: React.FC<CheckoutVoucherModalProps> = ({
  isOpen,
  onClose,
  availableVouchers,
  appliedVoucher,
  subtotal,
  onApplyVoucher,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-cream-200 animate-scale-up space-y-4 max-h-[88vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-ink-900 flex items-center gap-2">
              <Tag size={20} className="text-accent-500" />
              <span>Kho Mã Giảm Giá & Ưu Đãi</span>
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              Chọn mã ưu đãi phù hợp nhất với giá trị đơn hàng của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-ink-400 hover:text-ink-700 hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable list of vouchers */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {availableVouchers.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-400">
              Hiện chưa có mã giảm giá nào đang mở.
            </div>
          ) : (
            availableVouchers.map((v) => {
              const isApplied = appliedVoucher?.code === v.code;
              const isEligible = subtotal >= v.min_order_amount;

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isApplied
                      ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10'
                      : isEligible
                      ? 'border-cream-200 hover:border-accent-300 hover:bg-cream-50/50'
                      : 'border-cream-200 bg-cream-50/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-mono font-bold tracking-wide uppercase">
                          {v.code}
                        </span>
                        <h4 className="font-bold text-xs text-ink-900 truncate">
                          {v.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-ink-600 line-clamp-2">
                        {v.description}
                      </p>
                      <p className="text-[10px] text-ink-400 font-medium">
                        Đơn tối thiểu: {formatCurrency(v.min_order_amount)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isApplied ? (
                        <span className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs inline-block">
                          Đang dùng
                        </span>
                      ) : !isEligible ? (
                        <button
                          type="button"
                          disabled
                          className="px-3.5 py-2 bg-cream-200 text-ink-400 rounded-xl text-xs font-bold cursor-not-allowed"
                        >
                          Chưa đủ ĐK
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            await onApplyVoucher(v.code);
                            onClose();
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          Áp dụng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-cream-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-cream-100 hover:bg-cream-200 text-ink-800 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
