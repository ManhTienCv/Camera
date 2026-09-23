import React from 'react';
import { Package, ShoppingBag, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { Order, Page } from '../../types';

interface ProfileOrdersTabProps {
  orders: Order[];
  loadingOrders: boolean;
  onNavigate: (page: Page) => void;
}

export const ProfileOrdersTab: React.FC<ProfileOrdersTabProps> = ({
  orders,
  loadingOrders,
  onNavigate,
}) => {
  return (
    <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cream-100 dark:border-ink-800">
        <div>
          <div className="flex items-center gap-2">
            <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
              Lịch Sử Đơn Hàng & Mua Sắm
            </h3>
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Theo dõi tình trạng đơn đặt hàng thiết bị máy ảnh và phụ kiện của bạn
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-cream-100 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 text-ink-700 dark:text-cream-200 font-bold text-xs">
          {orders.length} Đơn Hàng Đã Ghi Nhận
        </span>
      </div>

      {loadingOrders ? (
        <div className="p-12 text-center text-ink-400 dark:text-ink-500">Đang tải lịch sử đơn hàng...</div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-cream-100/80 dark:bg-ink-800 text-cream-400 dark:text-ink-500 flex items-center justify-center mx-auto border border-cream-200/60 dark:border-ink-700 shadow-2xs">
            <Package size={40} className="stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50">
              Bạn chưa có đơn hàng nào
            </h4>
            <p className="text-xs text-ink-500 dark:text-ink-400 max-w-md mx-auto">
              Khám phá các sản phẩm máy ảnh, ống kính và phụ kiện chuyên nghiệp ngay hôm nay!
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="btn-accent px-6 py-3 rounded-2xl font-bold text-xs shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ShoppingBag size={15} />
            <span>Mua Sắm Ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusColor =
              order.status === 'delivered'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                : order.status === 'shipping'
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
                  : order.status === 'cancelled'
                    ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
                    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';

            const statusText =
              order.status === 'delivered'
                ? 'Đã giao thành công'
                : order.status === 'shipping'
                ? 'Đang vận chuyển'
                : order.status === 'cancelled'
                ? 'Đã hủy đơn'
                : 'Chờ xác nhận & đóng gói';

            return (
              <div
                key={order.id}
                className="p-5 rounded-3xl border border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-900 hover:border-cream-300 dark:hover:border-ink-700 transition-all shadow-2xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cream-100 dark:border-ink-800">
                  <div>
                    <span className="font-mono font-bold text-sm text-ink-900 dark:text-cream-50">
                      #{order.order_code || order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-ink-400 dark:text-ink-500 ml-3">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}
                    >
                      {statusText}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate({ name: 'orders' })}
                      className="text-xs font-bold text-accent-600 dark:text-accent-400 hover:text-accent-700 flex items-center gap-1 cursor-pointer ml-2"
                    >
                      <span>Xem chi tiết</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-cream-200 dark:border-ink-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-cream-100 dark:bg-ink-800 flex items-center justify-center shrink-0">
                          <Package size={20} className="text-ink-400 dark:text-ink-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-ink-900 dark:text-cream-50 truncate">{item.name}</p>
                        <p className="text-[11px] text-ink-500 dark:text-ink-400">Số lượng: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-xs text-ink-900 dark:text-cream-50">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="pt-3 border-t border-cream-100 dark:border-ink-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-ink-500 dark:text-ink-400">
                    Phương thức:{' '}
                    <strong className="text-ink-700 dark:text-cream-200">
                      {order.payment_method === 'bank_transfer'
                        ? 'Chuyển khoản SePay'
                        : order.payment_method === 'momo'
                          ? 'Ví MoMo'
                          : 'Thanh toán COD'}
                    </strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-500 dark:text-ink-400">Tổng thanh toán:</span>
                    <strong className="font-display font-bold text-base text-accent-600 dark:text-accent-400">
                      {formatCurrency(order.total_amount)}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
