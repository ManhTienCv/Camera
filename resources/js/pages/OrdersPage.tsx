import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  Send,
  Star,
  RotateCcw,
  Edit3,
  XCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';
import { api } from '../lib/api';
import type { Page } from '../types';
import { OrderRatingModal } from '../components/OrderRatingModal';
import {
  OrderEditAddressModal,
  OrderCancelModal,
  OrderTrackingModal,
} from '../components/orders';
import type { EnhancedOrder, OrderJourneyStep } from '../components/orders';

export type { EnhancedOrder, OrderJourneyStep };

interface OrdersPageProps {
  onNavigate: (page: Page) => void;
}

type OrderStatusTab = 'pending' | 'shipping' | 'delivered' | 'refund_pending' | 'cancelled';

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const toast = useToast();
  const [orderStatusTab, setOrderStatusTab] = useState<OrderStatusTab>('pending');

  // Dialog Modals State
  const [trackingOrder, setTrackingOrder] = useState<EnhancedOrder | null>(null);
  const [ratingOrder, setRatingOrder] = useState<EnhancedOrder | null>(null);
  const [editingOrderAddress, setEditingOrderAddress] = useState<EnhancedOrder | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<EnhancedOrder | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  // Orders Data (purely fetched from real backend database)
  const [orders, setOrders] = useState<EnhancedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [payingAgainOrderId, setPayingAgainOrderId] = useState<string | null>(null);

  // Listen for MoMo failed query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('momo_failed') === '1') {
      toast.warning('Giao dịch MoMo bị hủy hoặc chưa hoàn tất. Bạn có thể nhấn "Thanh toán lại MoMo" để thử lại.');
      window.history.replaceState(null, '', '/orders');
    }
  }, []);

  // Sync real orders from backend
  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      api
        .getMyOrders()
        .then((realOrders) => {
          if (realOrders && realOrders.length > 0) {
            const mappedReal: EnhancedOrder[] = realOrders.map((o) => {
              let statusType: 'pending' | 'shipping' | 'delivered' | 'refund_pending' | 'cancelled' = 'pending';
              let statusLabel = 'Chờ Duyệt & Đóng Gói';
              const rawStatus = (o as any).order_status || o.status;
              const payStatus = o.payment_status;

              if (rawStatus === 'shipping' || rawStatus === 'delivering') {
                statusType = 'shipping';
                statusLabel = 'Đang Giao (GHN Express)';
              } else if (rawStatus === 'delivered' || rawStatus === 'completed') {
                statusType = 'delivered';
                statusLabel = 'Đã Giao Thành Công';
              } else if (rawStatus === 'refund_pending' || payStatus === 'refund_pending') {
                statusType = 'refund_pending';
                statusLabel = 'Chờ Hoàn Tiền';
              } else if (rawStatus === 'cancelled') {
                statusType = 'cancelled';
                statusLabel = payStatus === 'refunded' ? 'Đã Hủy & Đã Hoàn Tiền' : 'Đã Hủy Đơn';
              }

              return {
                id: String(o.id),
                order_code: o.order_code || `#CAM-${o.id}`,
                date: o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : 'Hôm nay',
                status: statusType,
                statusLabel,
                paymentStatus: payStatus,
                paymentMethodCode: o.payment_method,
                bankName: o.bank_name,
                bankAccountNumber: o.bank_account_number,
                bankAccountHolder: o.bank_account_holder,
                refundRefCode: o.refund_ref_code,
                refundedAt: o.refunded_at,
                isReviewed: Boolean((o as any).is_reviewed),
                review: (o as any).review || null,
                cancelReason: o.cancel_reason,
                items: (o.items || []).map((i: any) => ({
                  product_id: i.product_id,
                  slug: i.slug || i.product_id,
                  categoryTag: 'Sản phẩm',
                  name: i.name,
                  quantity: i.quantity,
                  price: i.price,
                  image_url: i.image_url,
                })),
                recipientName: o.customer_name || user.fullName || 'Khách hàng',
                recipientPhone: o.customer_phone || user.phone || '0988888888',
                shippingPartner: o.shipping_partner || 'GHN Express',
                shippingAddress: o.shipping_address || 'Địa chỉ nhận hàng',
                trackingCode: o.tracking_code ? `#${o.tracking_code}` : `#GHN-${o.order_code || o.id}`,
                paymentMethod:
                  o.payment_method === 'momo'
                    ? 'VÍ ĐIỆN TỬ MOMO'
                    : o.payment_method === 'vietqr'
                    ? 'VIETQR NGÂN HÀNG'
                    : 'THU TIỀN KHI NHẬN (COD)',
                totalAmount: o.total_amount,
                journey: [
                  { time: 'Mới đây', title: 'Đặt hàng thành công', desc: 'Đơn hàng đã được tiếp nhận trên hệ thống.', done: true },
                  {
                    time: statusType === 'pending' ? 'Đang xử lý' : 'Hoàn tất',
                    title: 'Chờ duyệt và đóng gói',
                    desc: 'Nhân viên kho đang chuẩn bị sản phẩm.',
                    done: statusType !== 'pending',
                    current: statusType === 'pending',
                  },
                ],
              };
            });

            setOrders(mappedReal);
          } else {
            setOrders([]);
          }
        })
        .catch(() => {
          setOrders([]);
        })
        .finally(() => {
          setLoadingOrders(false);
        });
    } else {
      setOrders([]);
      setLoadingOrders(false);
    }
  }, [user, refreshKey]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (trackingOrder || editingOrderAddress || cancellingOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [trackingOrder, editingOrderAddress, cancellingOrder]);

  useEffect(() => {
    const handleSync = () => setRefreshKey((k) => k + 1);
    window.addEventListener('camerahub_reviews_updated', handleSync);
    return () => window.removeEventListener('camerahub_reviews_updated', handleSync);
  }, []);

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const shippingOrdersCount = orders.filter((o) => o.status === 'shipping').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length;
  const refundOrdersCount = orders.filter((o) => o.status === 'refund_pending').length;
  const cancelledOrdersCount = orders.filter((o) => o.status === 'cancelled').length;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Reset page when switching status tab
  useEffect(() => {
    setCurrentPage(1);
  }, [orderStatusTab]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => o.status === orderStatusTab);
  }, [orders, orderStatusTab]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handleOpenEditOrderAddress = (order: EnhancedOrder) => {
    setEditingOrderAddress(order);
  };

  // Open Cancel Modal
  const handleOpenCancelModal = (order: EnhancedOrder) => {
    setCancellingOrder(order);
  };

  const handleRepurchase = (order: EnhancedOrder) => {
    toast.success(`Đã thêm ${order.items.length} sản phẩm từ đơn ${order.order_code} vào giỏ hàng!`);
    onNavigate({ name: 'cart' });
  };

  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  const handleConfirmPaidOrder = async (orderId: string) => {
    setConfirmingOrderId(orderId);
    try {
      toast.info('Đang xác nhận trạng thái thanh toán đơn hàng...');
      const res = await api.confirmPayment(orderId);
      if (res && res.order) {
        toast.success('Xác nhận thanh toán MoMo thành công! Đơn hàng đã chuyển sang Đang giao.');
        setRefreshKey((k) => k + 1);
      } else {
        toast.warning('Chưa thể xác nhận đơn hàng, vui lòng thử lại.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xác nhận đơn hàng.');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handlePayAgain = async (orderId: string) => {
    setPayingAgainOrderId(orderId);
    try {
      toast.info('Đang chuyển hướng sang cổng thanh toán MoMo Sandbox...');
      const res = await api.payAgainMomo(orderId);
      if (res.success && res.payUrl) {
        window.location.href = res.payUrl;
      } else {
        toast.error('Không thể mở lại cổng MoMo.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gọi cổng MoMo.');
    } finally {
      setPayingAgainOrderId(null);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-accent-50 text-accent-600 flex items-center justify-center mx-auto mb-4 border border-accent-100 shadow-2xs">
          <Package size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold text-ink-900 mb-2">Lịch Sử Đơn Hàng</h2>
        <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
          Vui lòng đăng nhập để tra cứu lịch sử mua hàng và hành trình giao hàng của bạn.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="btn-accent px-6 py-3 rounded-2xl font-bold text-sm shadow-md cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-8">
      {/* 1. Page Header */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-200/80 shadow-2xs">
          <Package size={24} />
        </div>
        <div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-ink-900 dark:text-cream-50 tracking-tight">
            Lịch Sử Đơn Hàng & Hành Trình Giao Hàng
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Theo dõi trạng thái đóng gói, đối tác vận chuyển và lịch sử mua máy ảnh của bạn
          </p>
        </div>
      </div>

      {/* 2. Sub-Tabs: Filter by Delivery Status */}
      <div className="flex flex-wrap items-center gap-2 pb-1 relative">
        {[
          { id: 'pending', label: `Chờ đóng gói (${pendingOrdersCount})` },
          { id: 'shipping', label: `Đang giao hàng (${shippingOrdersCount})` },
          { id: 'delivered', label: `Đã nhận hàng (${deliveredOrdersCount})` },
          { id: 'refund_pending', label: `Chờ hoàn tiền (${refundOrdersCount})` },
          { id: 'cancelled', label: `Đã hủy (${cancelledOrdersCount})` },
        ].map((tab) => {
          const isActive = orderStatusTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setOrderStatusTab(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold transition-colors duration-150 cursor-pointer border select-none ${
                isActive
                  ? 'bg-ink-900 dark:bg-accent-500 border-ink-900 dark:border-accent-500 text-white shadow-xs'
                  : 'bg-white dark:bg-ink-900 border-cream-200 dark:border-ink-800 text-ink-700 dark:text-cream-200 hover:border-cream-300 dark:hover:border-ink-700 hover:bg-cream-50/80 dark:hover:bg-ink-800 shadow-2xs'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Orders List Area with Fixed Min-Height to eliminate vertical height bounce */}
      <div className="w-full min-h-[460px] space-y-4">
        {/* Status Counter Bar - always rendered to keep vertical layout stable */}
        <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400 font-medium min-h-[22px]">
          {filteredOrders.length > 0 ? (
            <div>
              Hiển thị <strong className="text-ink-900 dark:text-cream-100">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
              <strong className="text-ink-900 dark:text-cream-100">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> trên tổng số{' '}
              <strong className="text-ink-900 dark:text-cream-100">{filteredOrders.length}</strong> đơn hàng
            </div>
          ) : (
            <span className="text-ink-400 dark:text-ink-500">Mục này hiện không có đơn hàng nào</span>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="w-full bg-white dark:bg-ink-900 p-12 sm:p-16 rounded-3xl border border-cream-200 dark:border-ink-800 text-center space-y-3.5 shadow-2xs transition-colors">
            <div className="w-16 h-16 rounded-3xl bg-cream-100/80 dark:bg-ink-800 text-cream-400 dark:text-ink-500 flex items-center justify-center mx-auto border border-cream-200/60 dark:border-ink-700 shadow-2xs">
              <Package size={32} className="stroke-[1.5]" />
            </div>
            <p className="font-bold text-base text-ink-900 dark:text-cream-100">Không có đơn hàng nào trong mục này</p>
            <p className="text-xs text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
              Các đơn hàng của bạn sẽ được hiển thị và cập nhật liên tục tại đây khi có giao dịch mới.
            </p>
          </div>
        ) : (
          <>
            <div className="w-full space-y-6">
            {paginatedOrders.map((ord) => (
              <div
                key={ord.id}
                className="w-full bg-white dark:bg-ink-900 rounded-3xl border border-cream-200/90 dark:border-ink-800 shadow-xs p-6 sm:p-8 space-y-6 hover:shadow-md transition-shadow"
              >
                {/* Order Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-100 dark:border-ink-800">
                  <div>
                    <span className="text-xs text-ink-400 dark:text-ink-500 font-medium">Mã đơn hàng:</span>
                    <h4 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50">{ord.order_code}</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    {ord.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50/80 border border-amber-200/80 px-3.5 py-1 rounded-full">
                        <Clock size={14} className="text-amber-500" />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    {ord.status === 'shipping' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3.5 py-1 rounded-full shadow-2xs">
                        <Truck size={14} />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    {ord.status === 'delivered' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-accent-600 px-3.5 py-1 rounded-full shadow-2xs">
                        <CheckCircle2 size={14} />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    {ord.status === 'refund_pending' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-3.5 py-1 rounded-full shadow-2xs">
                        <RotateCcw size={14} className="text-amber-600" />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    {ord.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-1 rounded-full">
                        <XCircle size={14} className="text-rose-500" />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    <span className="text-xs text-ink-500 dark:text-ink-400 font-semibold">{ord.date}</span>
                  </div>
                </div>

                {/* Product Items List */}
                <div className="space-y-3">
                  {ord.items.map((item, idx) => {
                    const productTarget = item.slug || item.product_id;
                    return (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <div
                          className={`flex items-center gap-3 min-w-0 ${productTarget ? 'cursor-pointer group' : ''}`}
                          onClick={() => {
                            if (productTarget) {
                              onNavigate({ name: 'product', slug: String(productTarget) });
                            }
                          }}
                          title={productTarget ? `Xem chi tiết ${item.name}` : undefined}
                        >
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover border border-cream-200 dark:border-ink-700 shrink-0 group-hover:scale-105 group-hover:border-accent-500 transition-all duration-200 shadow-2xs"
                            />
                          )}
                          <span className="text-[11px] font-bold text-ink-600 dark:text-cream-300 bg-cream-100/90 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 px-2.5 py-0.5 rounded-full shrink-0 group-hover:border-accent-400 transition-colors">
                            {item.categoryTag}
                          </span>
                          <span className="text-sm font-semibold text-ink-900 dark:text-cream-100 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 group-hover:underline transition-colors">
                            {item.name}{' '}
                            <span className="text-xs font-normal text-ink-400 dark:text-ink-500">x{item.quantity}</span>
                          </span>
                        </div>
                        <span className="font-display font-bold text-sm text-ink-900 dark:text-cream-100 shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Shipping & Delivery Information Box */}
                <div className="bg-cream-50/60 dark:bg-ink-800/40 border border-cream-200/80 dark:border-ink-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-900 dark:text-cream-100">
                      <Truck size={16} className="text-accent-500" />
                      <span>Thông tin vận chuyển & Nhận hàng</span>
                    </div>

                    {ord.status === 'pending' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {ord.paymentMethod === 'VÍ ĐIỆN TỬ MOMO' && (
                          <>
                            <button
                              onClick={() => handlePayAgain(ord.id)}
                              disabled={payingAgainOrderId === ord.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                              title="Thanh toán lại đơn hàng này qua MoMo"
                            >
                              <RotateCcw size={13} className={payingAgainOrderId === ord.id ? 'animate-spin' : ''} />
                              <span>Thanh toán lại MoMo</span>
                            </button>

                            <button
                              onClick={() => handleConfirmPaidOrder(ord.id)}
                              disabled={confirmingOrderId === ord.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                              title="Xác nhận duyệt ngay nếu MoMo Sandbox bị treo hoặc quay tròn lâu"
                            >
                              <CheckCircle2 size={13} />
                              <span>Xác nhận đã thanh toán</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleOpenEditOrderAddress(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-ink-800 hover:bg-cream-100 dark:hover:bg-ink-700 border border-cream-200 dark:border-ink-700 text-ink-700 dark:text-cream-200 hover:text-accent-600 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          <Edit3 size={13} />
                          <span>Sửa Địa Chỉ</span>
                        </button>

                        <button
                          onClick={() => handleOpenCancelModal(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
                          title="Hủy đơn hàng này"
                        >
                          <XCircle size={13} />
                          <span>Hủy đơn hàng</span>
                        </button>
                      </div>
                    )}

                    {ord.status === 'shipping' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleOpenCancelModal(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
                          title="Hủy đơn hàng này"
                        >
                          <XCircle size={13} />
                          <span>Hủy đơn</span>
                        </button>

                        <button
                          onClick={() => setTrackingOrder(ord)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Send size={13} />
                          <span>Tra Cứu Hành Trình</span>
                        </button>
                      </div>
                    )}

                    {ord.status === 'delivered' && (
                      <button
                        onClick={() => setTrackingOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <Send size={13} />
                        <span>Tra Cứu Hành Trình</span>
                      </button>
                    )}
                  </div>

                  {/* Recipient & Address Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-ink-700 dark:text-cream-200">
                    <div>
                      <span className="text-ink-400 dark:text-ink-500">Người nhận: </span>
                      <strong className="text-ink-900 dark:text-cream-50">{ord.recipientName}</strong> ({ord.recipientPhone})
                    </div>
                    <div className="md:text-right">
                      <span className="text-ink-400 dark:text-ink-500">Đối tác giao: </span>
                      <strong className="text-accent-700 dark:text-accent-400 font-bold">{ord.shippingPartner}</strong>{' '}
                      <span className="text-ink-400 dark:text-ink-500 font-mono">({ord.trackingCode})</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-ink-400 dark:text-ink-500">Địa chỉ nhận hàng: </span>
                      <span className="text-ink-800 dark:text-cream-200 font-medium">{ord.shippingAddress}</span>
                    </div>
                  </div>

                  {/* Status Notice Callout Box */}
                  {ord.status === 'pending' && (
                    <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đơn hàng đang chờ xử lý:</strong> Nhân viên kho đang chuẩn bị và đóng gói sản phẩm. Bạn có thể thay đổi địa chỉ hoặc bấm <strong>Hủy đơn hàng</strong> nếu không còn nhu cầu trước khi đơn được bàn giao vận chuyển.
                      </div>
                    </div>
                  )}

                  {ord.status === 'shipping' && (
                    <div className="p-3.5 bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                      <Truck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đang vận chuyển:</strong> Đơn hàng {ord.order_code} đã được giao cho Shipper {ord.shippingPartner}. Bấm nút "Tra Cứu Hành Trình" ở trên để theo dõi vị trí kiện hàng.
                      </div>
                    </div>
                  )}

                  {ord.status === 'delivered' && (
                    <div className="p-3.5 bg-accent-50/70 dark:bg-accent-950/30 border border-accent-200/80 dark:border-accent-800/60 rounded-xl text-xs text-ink-900 dark:text-cream-100 flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-accent-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đã nhận hàng thành công:</strong> Kiện hàng {ord.order_code} đã được giao đến tay bạn. Bạn có thể bấm "Đánh giá sản phẩm" bên dưới để chia sẻ cảm nhận!
                      </div>
                    </div>
                  )}

                  {ord.status === 'refund_pending' && (
                    <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <RotateCcw size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Yêu cầu hoàn tiền đang được xử lý:</strong> Đơn hàng {ord.order_code} đã được tiếp nhận yêu cầu hủy và toàn bộ tồn kho đã được hoàn lại. Cửa hàng đang xử lý chuyển khoản hoàn tiền vào số tài khoản <strong>{ord.bankAccountNumber} ({ord.bankName} - {ord.bankAccountHolder})</strong> trong vòng 24h làm việc.
                        {ord.cancelReason && (
                          <div className="mt-1 text-amber-800 dark:text-amber-300 font-medium">Lý do hủy: {ord.cancelReason}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {ord.status === 'cancelled' && (
                    <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đơn hàng đã được hủy:</strong> Đơn hàng {ord.order_code} đã dừng xử lý và số lượng sản phẩm đã được tự động hoàn lại kho.
                        {ord.cancelReason && (
                          <div className="mt-1 text-rose-700 dark:text-rose-300 font-medium">Lý do hủy: {ord.cancelReason}</div>
                        )}
                        {ord.refundRefCode && (
                          <div className="mt-1 text-emerald-700 dark:text-emerald-400 font-bold">
                            ✓ Đã hoàn tiền qua ngân hàng. Mã GD: {ord.refundRefCode}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Cân xứng 2 phân tầng chuyên nghiệp */}
                <div className="pt-4 border-t border-cream-100 dark:border-ink-800 space-y-3.5">
                  {/* Hàng 1: Tóm tắt thanh toán & Tổng tiền nổi bật */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-ink-600 dark:text-cream-200">
                      <span className="text-ink-400 dark:text-ink-500">Phương thức thanh toán:</span>
                      <span className="font-bold text-ink-900 dark:text-cream-50 uppercase px-2.5 py-1 rounded-xl bg-cream-100 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 text-[11px] tracking-wide">
                        {ord.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Tổng thanh toán:</span>
                      <span className="font-display text-lg sm:text-xl font-bold text-accent-600 dark:text-accent-400">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 2: Thanh nút thao tác (Action Bar) căn phải đều đặn */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1 border-t border-cream-100/60 dark:border-ink-800/60">
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleOpenCancelModal(ord)}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1.5"
                      >
                        <XCircle size={14} />
                        <span>Hủy đơn hàng</span>
                      </button>
                    )}

                    {ord.status === 'delivered' && (
                      <>
                        {ord.isReviewed ? (
                          <button
                            onClick={() => setRatingOrder(ord)}
                            className="px-4 py-2 rounded-xl bg-accent-50 dark:bg-accent-950/40 hover:bg-accent-100 text-accent-700 dark:text-accent-400 border border-accent-200/80 dark:border-accent-800 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={14} className="text-accent-600" />
                            <span>Đã đánh giá</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setRatingOrder(ord)}
                            className="px-4 py-2 rounded-xl bg-accent-50 dark:bg-accent-950/50 hover:bg-accent-100 text-accent-700 dark:text-accent-400 border border-accent-200 dark:border-accent-800 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5"
                          >
                            <Star size={14} className="text-accent-500 fill-accent-500" />
                            <span>Đánh giá sản phẩm</span>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => handleRepurchase(ord)}
                      className="px-4 py-2 rounded-xl bg-cream-100 dark:bg-ink-800 hover:bg-cream-200 dark:hover:bg-ink-700 text-ink-800 dark:text-cream-100 text-xs font-bold transition-all cursor-pointer border border-cream-200 dark:border-ink-700 shadow-2xs active:scale-95 flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>Mua lại</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Orders Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="mt-8 bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 rounded-2xl p-4 px-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3 text-xs text-ink-600 dark:text-cream-200 font-medium">
                <div>
                  Hiển thị <span className="font-bold text-ink-900 dark:text-cream-100">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                  <span className="font-bold text-ink-900 dark:text-cream-100">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> trên{' '}
                  <span className="font-bold text-ink-900 dark:text-cream-100">{filteredOrders.length}</span> đơn hàng
                </div>

                <div className="flex items-center gap-1.5 border-l border-cream-200 dark:border-ink-800 pl-3">
                  <span className="text-[11px] text-ink-400 dark:text-ink-500">Hiển thị:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-lg text-xs font-bold text-ink-800 dark:text-cream-200 focus:outline-none focus:border-accent-500 cursor-pointer shadow-2xs"
                  >
                    <option value={5}>5 đơn / trang</option>
                    <option value={10}>10 đơn / trang</option>
                    <option value={20}>20 đơn / trang</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 bg-white dark:bg-ink-800 border border-cream-300 dark:border-ink-700 rounded-xl text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                  >
                    ‹ Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-ink-900 dark:bg-accent-500 text-white shadow-xs'
                          : 'bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 border border-cream-300 dark:border-ink-700 hover:bg-cream-100 dark:hover:bg-ink-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 bg-white dark:bg-ink-800 border border-cream-300 dark:border-ink-700 rounded-xl text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                  >
                    Sau ›
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>

      {/* 4. DIALOG: EDIT ORDER SHIPPING ADDRESS */}
      <OrderEditAddressModal
        order={editingOrderAddress}
        onClose={() => setEditingOrderAddress(null)}
        onSave={(orderId, newAddress) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, shippingAddress: newAddress } : o))
          );
          toast.success('Cập nhật địa chỉ nhận hàng thành công!');
          setEditingOrderAddress(null);
        }}
      />

      {/* 5. DIALOG: CANCEL ORDER CONFIRMATION MODAL */}
      <OrderCancelModal
        order={cancellingOrder}
        defaultAccountHolder={user?.fullName || ''}
        onClose={() => setCancellingOrder(null)}
        onConfirm={async ({
          order,
          finalReason,
          isPaidOnline,
          refundBankName,
          refundAccountNumber,
          refundAccountHolder,
        }) => {
          if (isPaidOnline) {
            if (!refundBankName.trim()) {
              toast.error('Vui lòng chọn hoặc nhập tên ngân hàng nhận tiền hoàn.');
              return;
            }
            if (!refundAccountNumber.trim()) {
              toast.error('Vui lòng nhập số tài khoản nhận tiền hoàn.');
              return;
            }
            if (!refundAccountHolder.trim()) {
              toast.error('Vui lòng nhập họ tên chủ tài khoản nhận tiền hoàn.');
              return;
            }
          }

          try {
            await api.cancelOrder(order.id, {
              reason: finalReason,
              bank_name: isPaidOnline ? refundBankName.trim() : undefined,
              bank_account_number: isPaidOnline ? refundAccountNumber.trim() : undefined,
              bank_account_holder: isPaidOnline ? refundAccountHolder.trim().toUpperCase() : undefined,
            });

            if (isPaidOnline) {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === order.id
                    ? {
                        ...o,
                        status: 'refund_pending',
                        statusLabel: 'Chờ Hoàn Tiền',
                        cancelReason: finalReason,
                        bankName: refundBankName.trim(),
                        bankAccountNumber: refundAccountNumber.trim(),
                        bankAccountHolder: refundAccountHolder.trim().toUpperCase(),
                      }
                    : o
                )
              );
              toast.success(
                `Đã gửi yêu cầu hủy và hoàn tiền cho đơn ${order.order_code}! Cửa hàng sẽ hoàn tiền về tài khoản của bạn.`
              );
              setCancellingOrder(null);
              setOrderStatusTab('refund_pending');
            } else {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === order.id
                    ? {
                        ...o,
                        status: 'cancelled',
                        statusLabel: 'Đã Hủy Đơn',
                        cancelReason: finalReason,
                      }
                    : o
                )
              );
              toast.success(`Đã hủy thành công đơn hàng ${order.order_code}. Sản phẩm đã được hoàn lại kho!`);
              setCancellingOrder(null);
              setOrderStatusTab('cancelled');
            }
          } catch (err: any) {
            toast.error(err.message || 'Lỗi khi hủy đơn hàng.');
          }
        }}
      />

      {/* 6. DIALOG: TRA CỨU HÀNH TRÌNH GIAO HÀNG */}
      <OrderTrackingModal
        order={trackingOrder}
        onClose={() => setTrackingOrder(null)}
      />

      {/* 7. DIALOG: ĐÁNH GIÁ SẢN PHẨM */}
      {ratingOrder && (
        <OrderRatingModal
          isOpen={true}
          order={ratingOrder}
          orderCode={ratingOrder.order_code}
          items={ratingOrder.items}
          existingReview={ratingOrder.review}
          onClose={() => setRatingOrder(null)}
          onSuccess={() => {
            setRatingOrder(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};
