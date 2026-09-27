import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Order } from '../../../types';
import { formatCurrency } from '../../../lib/utils';

export interface OrderViewModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderViewModal: React.FC<OrderViewModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-ink-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-scale-in border border-cream-200 dark:border-ink-800 cursor-default max-h-[90vh] flex flex-col text-ink-900 dark:text-cream-100" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 dark:border-ink-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold font-mono text-ink-900 dark:text-cream-50">
              Đơn hàng #{order.order_code || order.id.substring(0, 8)}
            </h3>
            <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
              Ngày đặt: {new Date(order.created_at || Date.now()).toLocaleString('vi-VN')}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream-100 dark:hover:bg-ink-800 flex items-center justify-center text-ink-400 hover:text-ink-700 dark:hover:text-cream-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Customer & Delivery Information */}
          <div className="bg-cream-50 dark:bg-ink-800/60 p-4 rounded-2xl border border-cream-200 dark:border-ink-700 space-y-2">
            <h4 className="font-bold text-ink-900 dark:text-cream-50 text-xs uppercase tracking-wide">Thông tin giao hàng</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-ink-700 dark:text-cream-200">
              <p>
                <span className="text-ink-400 dark:text-ink-500">Khách hàng:</span> <strong className="text-ink-900 dark:text-cream-50">{order.customer_name}</strong>
              </p>
              <p>
                <span className="text-ink-400 dark:text-ink-500">Điện thoại:</span> <strong className="text-ink-900 dark:text-cream-50">{order.customer_phone}</strong>
              </p>
              <p className="sm:col-span-2">
                <span className="text-ink-400 dark:text-ink-500">Email:</span> <span className="font-medium text-ink-900 dark:text-cream-100">{order.customer_email || 'Chưa cung cấp'}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="text-ink-400 dark:text-ink-500">Địa chỉ:</span> <span className="font-medium text-ink-900 dark:text-cream-100">{order.shipping_address}, {order.city}</span>
              </p>
            </div>
          </div>

          {/* Payment & Status Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-cream-50 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700 space-y-1">
              <span className="text-ink-400 dark:text-ink-500 block text-[11px]">Hình thức thanh toán</span>
              <p className="font-bold text-ink-900 dark:text-cream-50">
                {order.payment_method === 'momo'
                  ? 'Ví điện tử MoMo'
                  : order.payment_method === 'vietqr'
                    ? 'VietQR (Vietcombank)'
                    : 'COD (Tiền mặt)'}
              </p>
              <span className={`inline-block text-[11px] font-bold ${order.payment_status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {order.payment_status === 'completed' ? '● Đã thanh toán' : '○ Chờ thanh toán'}
              </span>
            </div>

            <div className="p-3.5 bg-cream-50 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700 space-y-1">
              <span className="text-ink-400 dark:text-ink-500 block text-[11px]">Trạng thái đơn hàng</span>
              <p className="font-bold text-ink-900 dark:text-cream-50 capitalize">
                {order.status === 'shipping'
                  ? 'Đang giao hàng'
                  : order.status === 'completed'
                    ? 'Hoàn thành'
                    : order.status === 'refund_pending'
                      ? 'Chờ hoàn tiền'
                      : order.status === 'cancelled'
                        ? 'Đã hủy'
                        : 'Chờ xử lý'}
              </p>
              <span className="text-[11px] text-ink-400 dark:text-ink-500">
                {order.tracking_code ? `GHN: #${order.tracking_code}` : 'Đơn vị: GHN Express'}
              </span>
            </div>
          </div>

          {/* Bank & Refund Information */}
          {(order.bank_name || order.refund_ref_code || order.status === 'refund_pending' || order.payment_status === 'refund_pending' || order.payment_status === 'refunded') && (
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-2">
              <h4 className="font-bold text-ink-900 dark:text-cream-50 text-xs uppercase tracking-wide flex items-center justify-between">
                <span>Thông tin hoàn tiền & Tài khoản nhận</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.payment_status === 'refunded' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300'}`}>
                  {order.payment_status === 'refunded' ? 'Đã hoàn tất' : 'Chờ Admin xử lý'}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-ink-700 dark:text-cream-200 text-xs">
                <p>
                  <span className="text-ink-400 dark:text-ink-500">Ngân hàng:</span> <strong className="text-ink-900 dark:text-cream-50">{order.bank_name || 'Chưa cung cấp'}</strong>
                </p>
                <p>
                  <span className="text-ink-400 dark:text-ink-500">Số tài khoản:</span> <strong className="text-ink-900 dark:text-cream-50 font-mono">{order.bank_account_number || 'Chưa cung cấp'}</strong>
                </p>
                <p>
                  <span className="text-ink-400 dark:text-ink-500">Chủ tài khoản:</span> <strong className="text-ink-900 dark:text-cream-50 uppercase">{order.bank_account_holder || 'Chưa cung cấp'}</strong>
                </p>
                {order.refund_ref_code && (
                  <p>
                    <span className="text-ink-400 dark:text-ink-500">Mã giao dịch (Ref):</span> <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{order.refund_ref_code}</strong>
                  </p>
                )}
                {order.refunded_at && (
                  <p className="sm:col-span-2">
                    <span className="text-ink-400 dark:text-ink-500">Ngày hoàn tiền:</span> <span className="text-ink-800 dark:text-cream-100">{new Date(order.refunded_at).toLocaleString('vi-VN')}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Ordered Products List */}
          <div>
            <h4 className="font-bold text-ink-900 dark:text-cream-50 text-xs uppercase tracking-wide mb-2.5">
              Danh sách sản phẩm ({order.items?.length || 0})
            </h4>
            {(!order.items || order.items.length === 0) ? (
              <p className="text-ink-400 dark:text-ink-500 italic p-3 bg-cream-50 dark:bg-ink-800/60 rounded-xl border border-cream-100 dark:border-ink-800">
                Chưa tải chi tiết các mặt hàng.
              </p>
            ) : (
              <div className="divide-y divide-cream-100 dark:divide-ink-800 border border-cream-200 dark:border-ink-800 rounded-2xl overflow-hidden">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-ink-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-cream-200 dark:border-ink-700 bg-cream-50 dark:bg-ink-800 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-cream-100 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-xs text-ink-900 dark:text-cream-50 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-ink-400 dark:text-ink-500">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-ink-900 dark:text-cream-50">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="p-4 bg-accent-50/60 dark:bg-accent-950/40 rounded-2xl border border-accent-200 dark:border-accent-900/60 flex items-center justify-between">
            <span className="font-bold text-ink-800 dark:text-cream-200">Tổng thanh toán:</span>
            <span className="font-display font-bold text-base text-accent-600 dark:text-accent-400">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-cream-200 dark:border-ink-800 text-right shrink-0">
          <button onClick={onClose} className="btn-primary px-5 py-2 text-xs font-bold rounded-xl cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
