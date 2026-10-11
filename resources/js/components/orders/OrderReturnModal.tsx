import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { EnhancedOrder } from './types';

export interface OrderReturnModalProps {
  order: EnhancedOrder | null;
  defaultAccountHolder?: string;
  onClose: () => void;
  onConfirm: (payload: {
    order: EnhancedOrder;
    reason: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }) => Promise<void>;
}

const COMMON_BANKS = [
  'Vietcombank',
  'MB Bank (Quân Đội)',
  'Techcombank',
  'BIDV',
  'Agribank',
  'ACB (Á Châu)',
  'VPBank',
  'TPBank',
  'Sacombank',
  'VIB',
  'SeABank',
  'Khác',
];

const RETURN_REASONS = [
  'Sản phẩm lỗi kỹ thuật / không hoạt động',
  'Hàng bị nứt vỡ, trầy xước do vận chuyển',
  'Giao sai mẫu mã, thiếu phụ kiện so với mô tả',
  'Sản phẩm không đúng như kỳ vọng / đổi ý',
  'Lý do khác',
];

export const OrderReturnModal: React.FC<OrderReturnModalProps> = ({
  order,
  defaultAccountHolder = '',
  onClose,
  onConfirm,
}) => {
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [bankName, setBankName] = useState('Vietcombank');
  const [customBankName, setCustomBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setReturnReason(RETURN_REASONS[0]);
      setCustomReason('');
      setBankName('Vietcombank');
      setCustomBankName('');
      setAccountNumber('');
      setAccountHolder(defaultAccountHolder ? defaultAccountHolder.toUpperCase() : '');
      setIsSubmitting(false);
    }
  }, [order, defaultAccountHolder]);

  if (!order) return null;

  const handleConfirm = async () => {
    const finalReason = returnReason === 'Lý do khác' ? customReason.trim() || 'Lý do khác' : returnReason;
    const finalBank = bankName === 'Khác' ? customBankName.trim() || 'Ngân hàng khác' : bankName;

    setIsSubmitting(true);
    try {
      await onConfirm({
        order,
        reason: finalReason,
        bankName: finalBank,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    (returnReason !== 'Lý do khác' || customReason.trim().length > 0) &&
    (bankName !== 'Khác' || customBankName.trim().length > 0) &&
    accountNumber.trim().length > 4 &&
    accountHolder.trim().length > 2;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-ink-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-cream-200 dark:border-ink-800 space-y-5 animate-scale-up cursor-default my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-cream-100 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 shadow-2xs shrink-0">
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50">
                Yêu Cầu Trả Hàng & Hoàn Tiền
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Đơn hàng: <strong className="text-ink-900 dark:text-cream-100">{order.order_code}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full hover:bg-cream-100 dark:hover:bg-ink-800 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount Box */}
        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-amber-900 dark:text-amber-300 font-medium">Số tiền hoàn trả dự kiến:</span>
            <span className="font-display font-bold text-base text-accent-600 dark:text-accent-400">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Áp dụng chính sách đổi trả trong vòng 7 ngày. Sau khi xác nhận thu hồi sản phẩm, tiền sẽ được hoàn trả trực tiếp về số tài khoản dưới đây.
          </p>
        </div>

        {/* Reason Select */}
        <div className="space-y-2 text-xs">
          <label className="block font-bold text-ink-800 dark:text-cream-100 uppercase tracking-wider text-[11px]">
            Lý do bạn muốn trả hàng *
          </label>
          <div className="space-y-1.5">
            {RETURN_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  returnReason === r
                    ? 'border-accent-500 bg-accent-50/60 dark:bg-accent-950/30 text-ink-900 dark:text-cream-50 font-semibold'
                    : 'border-cream-200 dark:border-ink-800 hover:bg-cream-50/60 dark:hover:bg-ink-800 text-ink-700 dark:text-cream-300'
                }`}
              >
                <input
                  type="radio"
                  name="returnReason"
                  checked={returnReason === r}
                  onChange={() => setReturnReason(r)}
                  className="accent-accent-600"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {returnReason === 'Lý do khác' && (
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết lỗi hoặc lý do cần trả hàng..."
              className="w-full mt-2 p-2.5 rounded-xl border border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-800 text-xs text-ink-900 dark:text-cream-100 focus:outline-none focus:border-accent-500 resize-none"
            />
          )}
        </div>

        {/* Bank Account Form */}
        <div className="space-y-3 pt-2 border-t border-cream-100 dark:border-ink-800 text-xs">
          <h4 className="font-bold text-ink-900 dark:text-cream-50 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Thông tin tài khoản nhận tiền hoàn *</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-600 dark:text-cream-300">Ngân hàng</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-800 text-xs font-medium text-ink-900 dark:text-cream-100 focus:outline-none focus:border-accent-500 cursor-pointer"
              >
                {COMMON_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {bankName === 'Khác' && (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-ink-600 dark:text-cream-300">Tên ngân hàng khác</label>
                <input
                  type="text"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  placeholder="Ví dụ: OCB, Shinhan Bank..."
                  className="w-full p-2.5 rounded-xl border border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-800 text-xs text-ink-900 dark:text-cream-100 focus:outline-none focus:border-accent-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-600 dark:text-cream-300">Số tài khoản nhận</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ví dụ: 0011002345678"
                className="w-full p-2.5 rounded-xl border border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-800 text-xs font-mono font-bold text-ink-900 dark:text-cream-100 focus:outline-none focus:border-accent-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-ink-600 dark:text-cream-300">
                Họ và tên chủ tài khoản (viết in hoa không dấu)
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                placeholder="Ví dụ: NGUYEN VAN A"
                className="w-full p-2.5 rounded-xl border border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-800 text-xs font-bold uppercase text-ink-900 dark:text-cream-100 focus:outline-none focus:border-accent-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-100 dark:border-ink-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-700 dark:text-cream-200 text-xs font-bold transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !isFormValid}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <RotateCcw size={14} className={isSubmitting ? 'animate-spin' : ''} />
            <span>{isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Trả Hàng'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
