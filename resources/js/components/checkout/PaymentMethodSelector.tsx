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
                  </div>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
