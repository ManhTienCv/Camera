import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, AlertTriangle, XCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { EnhancedOrder } from './types';

export interface OrderCancelModalProps {
  order: EnhancedOrder | null;
  defaultAccountHolder?: string;
  onClose: () => void;
  onConfirm: (payload: {
    order: EnhancedOrder;
    finalReason: string;
    isPaidOnline: boolean;
    refundBankName: string;
    refundAccountNumber: string;
    refundAccountHolder: string;
  }) => Promise<void>;
}

export const OrderCancelModal: React.FC<OrderCancelModalProps> = ({
  order,
  defaultAccountHolder = '',
  onClose,
  onConfirm,
}) => {
  const [cancelReason, setCancelReason] = useState('Muốn thay đổi địa chỉ nhận hàng');
  const [customReason, setCustomReason] = useState('');
  const [refundBankName, setRefundBankName] = useState('Vietcombank');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountHolder, setRefundAccountHolder] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (order) {
      setCancelReason('Muốn thay đổi địa chỉ nhận hàng');
      setCustomReason('');
      setRefundBankName('Vietcombank');
      setRefundAccountNumber('');
      setRefundAccountHolder(defaultAccountHolder ? defaultAccountHolder.toUpperCase() : '');
      setIsCancelling(false);
    }
  }, [order, defaultAccountHolder]);

  if (!order) return null;

  const isPaidOnline =
    order.paymentMethodCode !== 'cod' &&
    (order.paymentStatus === 'paid' || order.paymentStatus === 'completed');

  const handleConfirm = async () => {
    const finalReason = cancelReason === 'Lý do khác' ? customReason || 'Lý do khác' : cancelReason;
    setIsCancelling(true);
    try {
      await onConfirm({
        order,
        finalReason,
        isPaidOnline,
        refundBankName,
        refundAccountNumber,
        refundAccountHolder,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={() => !isCancelling && onClose()}
    >
      <div
        className={`relative w-full ${isPaidOnline ? 'max-w-lg' : 'max-w-md'} bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-cream-200 space-y-5 animate-scale-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-2xs ${
              isPaidOnline
                ? 'bg-amber-50 border border-amber-200 text-amber-600'
                : 'bg-rose-50 border border-rose-200 text-rose-600'
            }`}
          >
            {isPaidOnline ? <RotateCcw size={28} /> : <AlertTriangle size={28} />}
          </div>
          <h3 className="font-display font-bold text-xl text-ink-900">
            {isPaidOnline ? 'Yêu Cầu Hủy Đơn & Hoàn Tiền' : 'Xác Nhận Hủy Đơn Hàng'}
          </h3>
          <p className="text-xs text-ink-500">
            Đơn hàng <strong>{order.order_code}</strong> ({formatCurrency(order.totalAmount)})
          </p>
        </div>

        {isPaidOnline ? (
          <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl text-xs space-y-3">
            <p className="text-amber-900 leading-relaxed font-medium">
              Đơn hàng đã thanh toán qua <strong>{order.paymentMethod}</strong>. Sau khi bạn gửi yêu cầu, số lượng máy ảnh sẽ hoàn lại kho và cửa hàng sẽ chuyển khoản hoàn trả <strong>{formatCurrency(order.totalAmount)}</strong> vào tài khoản dưới đây:
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-ink-800 mb-1">Ngân hàng / Ví nhận tiền (*):</label>
                <select
                  value={refundBankName}
                  onChange={(e) => setRefundBankName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                >
                  <option value="Vietcombank">Vietcombank (VCB)</option>
                  <option value="MB Bank">MB Bank (Quân Đội)</option>
                  <option value="Techcombank">Techcombank (TCB)</option>
                  <option value="VPBank">VPBank</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="BIDV">BIDV</option>
                  <option value="VietinBank">VietinBank</option>
                  <option value="TPBank">TPBank</option>
                  <option value="Sacombank">Sacombank</option>
                  <option value="MoMo">Ví MoMo</option>
                  <option value="ZaloPay">Ví ZaloPay</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-800 mb-1">Số tài khoản / Số điện thoại ví (*):</label>
                <input
                  type="text"
                  value={refundAccountNumber}
                  onChange={(e) => setRefundAccountNumber(e.target.value)}
                  placeholder="Ví dụ: 0988888888 hoặc 1023456789"
                  className="w-full p-2.5 bg-white border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-800 mb-1">Họ và tên chủ tài khoản (*):</label>
                <input
                  type="text"
                  value={refundAccountHolder}
                  onChange={(e) => setRefundAccountHolder(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  className="w-full p-2.5 bg-white border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-bold uppercase tracking-wide"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-2xl text-xs text-ink-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-ink-400">Tổng giá trị:</span>
              <strong className="text-accent-600 font-bold font-display">{formatCurrency(order.totalAmount)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-400">Số sản phẩm:</span>
              <span className="font-semibold text-ink-800">{order.items.length} món</span>
            </div>
            <p className="text-[11px] text-amber-700 pt-1 font-medium border-t border-cream-200">
              ⚠️ Sau khi hủy, toàn bộ số lượng sản phẩm trong đơn sẽ tự động được hoàn lại kho.
            </p>
          </div>
        )}

        {/* Reason selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-ink-700">Lý do hủy đơn:</label>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full p-3 bg-cream-50 border border-cream-200 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
          >
            <option value="Muốn thay đổi địa chỉ nhận hàng">Muốn thay đổi địa chỉ nhận hàng</option>
            <option value="Đặt nhầm sản phẩm / số lượng">Đặt nhầm sản phẩm / số lượng</option>
            <option value="Tìm thấy mức giá hoặc khuyến mãi tốt hơn">Tìm thấy mức giá hoặc khuyến mãi tốt hơn</option>
            <option value="Thay đổi ý định, không còn nhu cầu">Thay đổi ý định, không còn nhu cầu</option>
            <option value="Lý do khác">Lý do khác</option>
          </select>

          {cancelReason === 'Lý do khác' && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập lý do của bạn..."
              className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 mt-2"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isCancelling}
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-2xl border border-cream-200 bg-white hover:bg-cream-50 text-xs font-bold text-ink-700 transition-colors cursor-pointer"
          >
            Giữ lại đơn
          </button>

          <button
            type="button"
            disabled={isCancelling}
            onClick={handleConfirm}
            className={`w-1/2 py-2.5 rounded-2xl text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${
              isPaidOnline ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isCancelling ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPaidOnline ? (
              <>
                <RotateCcw size={15} />
                <span>Gửi Yêu Cầu Hoàn Tiền</span>
              </>
            ) : (
              <>
                <XCircle size={15} />
                <span>Xác nhận hủy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
