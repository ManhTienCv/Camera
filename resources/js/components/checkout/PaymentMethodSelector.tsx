import React from 'react';
import { QrCode } from 'lucide-react';
import { getStoreSettings } from '../../lib/settings';

export interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const storeSettings = getStoreSettings();
  const availablePaymentMethods = [
    storeSettings.isVietQrEnabled && {
      id: 'vietqr',
      label: `Chuyển khoản VietQR (${storeSettings.bankName} 24/7 - Khuyên dùng)`,
    },
    storeSettings.isCodEnabled && { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)' },
    { id: 'vnpay', label: 'Cổng VNPAY (ATM / Visa / QR Code)' },
    storeSettings.isMomoEnabled && { id: 'momo', label: 'Ví điện tử MoMo' },
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg text-ink-800 flex items-center gap-2">
          <QrCode size={18} className="text-accent-500" />
          <span>Phương thức thanh toán</span>
        </h2>
        <span className="text-xs font-semibold text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 px-2.5 py-0.5 rounded-full">
          Miễn phí giao dịch
        </span>
      </div>

      <div className="space-y-3">
        {availablePaymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <div
              key={method.id}
              className={`rounded-2xl border-2 transition-all overflow-hidden ${
                isSelected
                  ? 'border-accent-500 bg-accent-50/40 dark:bg-accent-500/10 shadow-xs'
                  : 'border-cream-200 dark:border-ink-700 hover:border-cream-300 dark:hover:border-ink-600 bg-white dark:bg-ink-800'
              }`}
            >
              <label className="flex items-start gap-3 p-4 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={isSelected}
                  onChange={(e) => onSelectMethod(e.target.value)}
                  className="w-4 h-4 text-accent-500 focus:ring-accent-400 mt-1 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-ink-900 dark:text-cream-50">{method.label}</p>
                    {method.id === 'momo' && (
                      <span className="text-[10px] font-semibold bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 px-2 py-0.5 rounded-full">
                        Sandbox
                      </span>
                    )}
                  </div>
                  {method.id === 'momo' && isSelected && (
                    <div className="mt-2.5 text-xs text-ink-600 dark:text-ink-400 bg-pink-50/50 dark:bg-pink-950/30 p-2.5 rounded-xl border border-pink-200/70 dark:border-pink-900/40 space-y-1">
                      <p className="font-semibold text-pink-700 dark:text-pink-300">
                        💡 Hướng dẫn test MoMo Sandbox:
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Tại cổng MoMo, vui lòng chọn tab <strong className="text-pink-700 dark:text-pink-300">Thẻ quốc tế (Visa)</strong> &bull; Số thẻ: <code className="bg-white dark:bg-ink-900 px-1 py-0.5 rounded font-mono font-bold text-pink-600">4111 1111 1111 1111</code> &bull; Hạn: <code className="bg-white dark:bg-ink-900 px-1 py-0.5 rounded font-mono text-pink-600">12/28</code> &bull; CVV: <code className="bg-white dark:bg-ink-900 px-1 py-0.5 rounded font-mono text-pink-600">123</code>.
                      </p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        * Tab Thẻ ATM nội địa (Napas) hiện bị máy chủ MoMo Sandbox từ chối (Error 1002 do MoMo đóng cổng liên ngân hàng test).
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
