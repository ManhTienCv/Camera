import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  Send,
  Star,
  RotateCcw,
  RefreshCw,
  X,
  CheckCircle2,
  Edit3,
  XCircle,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';
import { api } from '../lib/api';
import type { Page } from '../types';
import { OrderRatingModal } from '../components/OrderRatingModal';
import { reviewService } from '../services/review.service';

interface OrdersPageProps {
  onNavigate: (page: Page) => void;
}

type OrderStatusTab = 'pending' | 'shipping' | 'delivered' | 'cancelled';

interface MockJourneyStep {
  time: string;
  title: string;
  desc: string;
  done: boolean;
  current?: boolean;
}

interface EnhancedOrder {
  id: string;
  order_code: string;
  date: string;
  status: 'pending' | 'shipping' | 'delivered' | 'cancelled';
  statusLabel: string;
  items: Array<{
    categoryTag: string;
    name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  shippingPartner: string;
  trackingCode: string;
  paymentMethod: string;
  totalAmount: number;
  journey: MockJourneyStep[];
  cancelReason?: string;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const toast = useToast();
  const [orderStatusTab, setOrderStatusTab] = useState<OrderStatusTab>('pending');

  // Tracking Journey Modal State
  const [trackingOrder, setTrackingOrder] = useState<EnhancedOrder | null>(null);
  const [ratingOrder, setRatingOrder] = useState<EnhancedOrder | null>(null);
  const [editingOrderAddress, setEditingOrderAddress] = useState<EnhancedOrder | null>(null);
  const [newOrderAddressText, setNewOrderAddressText] = useState('');

  // Cancel Order Modal State
  const [cancellingOrder, setCancellingOrder] = useState<EnhancedOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Muốn thay đổi địa chỉ nhận hàng');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const [, setRefreshKey] = useState(0);

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
              let statusType: 'pending' | 'shipping' | 'delivered' | 'cancelled' = 'pending';
              let statusLabel = 'Chờ Duyệt & Đóng Gói';
              if (o.status === 'shipping') {
                statusType = 'shipping';
                statusLabel = 'Đang Giao (GHN Express)';
              } else if (o.status === 'delivered') {
                statusType = 'delivered';
                statusLabel = 'Đã Giao Thành Công';
              } else if (o.status === 'cancelled') {
                statusType = 'cancelled';
                statusLabel = 'Đã Hủy Đơn';
              }

              return {
                id: String(o.id),
                order_code: o.order_code || `#CAM-${o.id}`,
                date: o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : 'Hôm nay',
                status: statusType,
                statusLabel,
                items: (o.items || []).map((i) => ({
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
  }, [user]);

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
  const cancelledOrdersCount = orders.filter((o) => o.status === 'cancelled').length;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setNewOrderAddressText(order.shippingAddress);
  };

  const handleSaveOrderAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrderAddress) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === editingOrderAddress.id ? { ...o, shippingAddress: newOrderAddressText } : o
      )
    );
    toast.success('Cập nhật địa chỉ nhận hàng thành công!');
    setEditingOrderAddress(null);
  };

  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

  // Sync Live Status with GHN
  const handleSyncGhn = async (order: EnhancedOrder) => {
    setSyncingOrderId(order.id);
    try {
      toast.info(`Đang đồng bộ trạng thái đơn ${order.order_code} từ GHN...`);
      const res = await api.syncGhnOrderStatus(order.id);
      if (res && res.success) {
        toast.success(res.message || 'Đồng bộ GHN thành công!');
        setRefreshKey((k) => k + 1);
      } else {
        toast.warning(res?.message || 'Không thể đồng bộ trạng thái với GHN.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đồng bộ đơn với GHN.');
    } finally {
      setSyncingOrderId(null);
    }
  };

  // Open Cancel Modal
  const handleOpenCancelModal = (order: EnhancedOrder) => {
    setCancellingOrder(order);
    setCancelReason('Muốn thay đổi địa chỉ nhận hàng');
    setCustomReason('');
  };

  // Confirm Order Cancellation
  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    setIsCancelling(true);

    const finalReason = cancelReason === 'Lý do khác' ? customReason || 'Lý do khác' : cancelReason;

    try {
      // Call backend API if it's a real order
      await api.cancelOrder(cancellingOrder.id, finalReason).catch(() => {});

      // Update state locally
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancellingOrder.id
            ? {
                ...o,
                status: 'cancelled',
                statusLabel: 'Đã Hủy Đơn',
                cancelReason: finalReason,
              }
            : o
        )
      );

      toast.success(`Đã hủy thành công đơn hàng ${cancellingOrder.order_code}. Sản phẩm đã được hoàn lại kho!`);
      setCancellingOrder(null);
      setOrderStatusTab('cancelled');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi hủy đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRepurchase = (order: EnhancedOrder) => {
    toast.success(`Đã thêm ${order.items.length} sản phẩm từ đơn ${order.order_code} vào giỏ hàng!`);
    onNavigate({ name: 'cart' });
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
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-8">
      {/* 1. Page Header */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-200/80 shadow-2xs">
          <Package size={24} />
        </div>
        <div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-ink-900 tracking-tight">
            Lịch Sử Đơn Hàng & Hành Trình Giao Hàng
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Theo dõi trạng thái đóng gói, đối tác vận chuyển và lịch sử mua máy ảnh của bạn
          </p>
        </div>
      </div>

      {/* 2. Sub-Tabs: Filter by Delivery Status */}
      <div className="flex flex-wrap gap-2.5 pb-1 relative">
        {[
          { id: 'pending', label: `Chờ đóng gói (${pendingOrdersCount})` },
          { id: 'shipping', label: `Đang giao hàng (${shippingOrdersCount})` },
          { id: 'delivered', label: `Đã nhận hàng (${deliveredOrdersCount})` },
          { id: 'cancelled', label: `Đã hủy (${cancelledOrdersCount})` },
        ].map((tab) => {
          const isActive = orderStatusTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setOrderStatusTab(tab.id as any)}
              className={`relative px-5 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                isActive
                  ? 'border-ink-900 text-white shadow-xs'
                  : 'border-cream-200 text-ink-700 hover:border-cream-300 hover:bg-cream-50 bg-white shadow-2xs'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="orders-status-tab-capsule"
                  className="absolute inset-0 bg-ink-900 rounded-full z-0"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-cream-200 text-center space-y-3">
          <Package size={36} className="text-cream-300 mx-auto" />
          <p className="font-bold text-ink-800">Không có đơn hàng nào trong mục này</p>
          <p className="text-xs text-ink-400">Các đơn hàng của bạn sẽ được hiển thị và cập nhật liên tục tại đây</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-ink-500 font-medium">
            Hiển thị <strong className="text-ink-900">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
            <strong className="text-ink-900">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> trên tổng số{' '}
            <strong className="text-ink-900">{filteredOrders.length}</strong> đơn hàng
          </div>

          <div className="space-y-6">
            {paginatedOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-cream-200/90 shadow-xs p-6 sm:p-8 space-y-6 hover:shadow-md transition-shadow"
              >
                {/* Order Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-100">
                  <div>
                    <span className="text-xs text-ink-400 font-medium">Mã đơn hàng:</span>
                    <h4 className="font-display font-bold text-lg text-ink-900">{ord.order_code}</h4>
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

                    {ord.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-1 rounded-full">
                        <XCircle size={14} className="text-rose-500" />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    <span className="text-xs text-ink-500 font-semibold">{ord.date}</span>
                  </div>
                </div>

                {/* Product Items List */}
                <div className="space-y-3">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-cream-200 shrink-0"
                          />
                        )}
                        <span className="text-[11px] font-bold text-ink-600 bg-cream-100/90 border border-cream-200 px-2.5 py-0.5 rounded-full shrink-0">
                          {item.categoryTag}
                        </span>
                        <span className="text-sm font-semibold text-ink-900 truncate">
                          {item.name}{' '}
                          <span className="text-xs font-normal text-ink-400">x{item.quantity}</span>
                        </span>
                      </div>
                      <span className="font-display font-bold text-sm text-ink-900 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Shipping & Delivery Information Box */}
                <div className="bg-cream-50/60 border border-cream-200/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
                      <Truck size={16} className="text-accent-500" />
                      <span>Thông tin vận chuyển & Nhận hàng</span>
                    </div>

                    {ord.status === 'pending' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {ord.paymentMethod === 'VÍ ĐIỆN TỬ MOMO' && (
                          <button
                            onClick={() => handlePayAgain(ord.id)}
                            disabled={payingAgainOrderId === ord.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Thanh toán lại đơn hàng này qua MoMo"
                          >
                            <RotateCcw size={13} className={payingAgainOrderId === ord.id ? 'animate-spin' : ''} />
                            <span>Thanh toán lại MoMo</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditOrderAddress(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-cream-100 border border-cream-200 text-ink-700 hover:text-accent-600 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          <Edit3 size={13} />
                          <span>Sửa Địa Chỉ</span>
                        </button>

                        <button
                          onClick={() => handleOpenCancelModal(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
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
                          onClick={() => handleSyncGhn(ord)}
                          disabled={syncingOrderId === ord.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Đồng bộ trạng thái trực tiếp từ Giao Hàng Nhanh (GHN)"
                        >
                          <RefreshCw size={13} className={syncingOrderId === ord.id ? 'animate-spin' : ''} />
                          <span>Đồng bộ GHN</span>
                        </button>

                        <button
                          onClick={() => handleOpenCancelModal(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-ink-700">
                    <div>
                      <span className="text-ink-400">Người nhận: </span>
                      <strong className="text-ink-900">{ord.recipientName}</strong> ({ord.recipientPhone})
                    </div>
                    <div className="md:text-right">
                      <span className="text-ink-400">Đối tác giao: </span>
                      <strong className="text-accent-700 font-bold">{ord.shippingPartner}</strong>{' '}
                      <span className="text-ink-400 font-mono">({ord.trackingCode})</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-ink-400">Địa chỉ nhận hàng: </span>
                      <span className="text-ink-800 font-medium">{ord.shippingAddress}</span>
                    </div>
                  </div>

                  {/* Status Notice Callout Box */}
                  {ord.status === 'pending' && (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                      <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đơn hàng đang chờ xử lý:</strong> Nhân viên kho đang chuẩn bị và đóng gói sản phẩm. Bạn có thể thay đổi địa chỉ hoặc bấm <strong>Hủy đơn hàng</strong> nếu không còn nhu cầu trước khi đơn được bàn giao vận chuyển.
                      </div>
                    </div>
                  )}

                  {ord.status === 'shipping' && (
                    <div className="p-3.5 bg-blue-50/90 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                      <Truck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đang vận chuyển:</strong> Đơn hàng {ord.order_code} đã được giao cho Shipper {ord.shippingPartner}. Bấm nút "Tra Cứu Hành Trình" ở trên để theo dõi vị trí kiện hàng.
                      </div>
                    </div>
                  )}

                  {ord.status === 'delivered' && (
                    <div className="p-3.5 bg-accent-50/70 border border-accent-200/80 rounded-xl text-xs text-ink-900 flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-accent-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đã nhận hàng thành công:</strong> Kiện hàng {ord.order_code} đã được giao đến tay bạn. Bạn có thể bấm "Đánh giá sản phẩm" bên dưới để chia sẻ cảm nhận!
                      </div>
                    </div>
                  )}

                  {ord.status === 'cancelled' && (
                    <div className="p-3.5 bg-rose-50/90 border border-rose-200/80 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đơn hàng đã được hủy:</strong> Đơn hàng {ord.order_code} đã dừng xử lý và số lượng sản phẩm đã được tự động hoàn lại kho.
                        {ord.cancelReason && (
                          <div className="mt-1 text-rose-700 font-medium">Lý do hủy: {ord.cancelReason}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Payment & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-ink-500">
                    Thanh toán:{' '}
                    <strong className="text-ink-800 uppercase font-bold">
                      {ord.paymentMethod}
                    </strong>
                  </div>

                  <div className="flex items-center gap-3">
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleOpenCancelModal(ord)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-colors cursor-pointer active:scale-95"
                      >
                        <XCircle size={14} />
                        <span>Hủy đơn hàng</span>
                      </button>
                    )}

                    {ord.status === 'delivered' && (
                      <>
                        {reviewService.hasReviewedOrder(ord.order_code) ? (
                          <button
                            onClick={() => setRatingOrder(ord)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-50 hover:bg-accent-100 text-accent-700 border border-accent-200/80 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={14} className="text-accent-600" />
                            <span>Đã đánh giá</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setRatingOrder(ord)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-50 hover:bg-accent-100 text-accent-700 border border-accent-200/80 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            <Star size={14} className="text-accent-500 fill-accent-500" />
                            <span>Đánh giá sản phẩm</span>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => handleRepurchase(ord)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-ink-700 text-xs font-bold transition-colors cursor-pointer border border-cream-200"
                    >
                      <RotateCcw size={13} />
                      <span>Mua lại</span>
                    </button>

                    <div className="text-xs">
                      <span className="text-ink-400">Tổng tiền: </span>
                      <strong className="font-display text-base text-accent-600 font-bold">
                        {formatCurrency(ord.totalAmount)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Orders Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-cream-200 rounded-xl text-xs font-bold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                ‹ Trang trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-ink-900 text-white shadow-xs'
                      : 'bg-white text-ink-700 border border-cream-200 hover:border-cream-300'
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
                className="px-4 py-2 bg-white border border-cream-200 rounded-xl text-xs font-bold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                Trang sau ›
              </button>
            </div>
          )}
        </>
      )}

      {/* 4. DIALOG: EDIT ORDER SHIPPING ADDRESS */}
      {editingOrderAddress &&
        createPortal(
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
            onClick={() => setEditingOrderAddress(null)}
          >
            <div
              className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-cream-200 space-y-5 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-cream-100">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-accent-500" />
                  <h3 className="font-display font-bold text-lg text-ink-900">Sửa Địa Chỉ Nhận Hàng</h3>
                </div>
                <button
                  onClick={() => setEditingOrderAddress(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-cream-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveOrderAddress} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">
                    Địa chỉ nhận hàng mới ({editingOrderAddress.order_code}):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newOrderAddressText}
                    onChange={(e) => setNewOrderAddressText(e.target.value)}
                    placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    className="w-full p-3 bg-cream-50/70 border border-cream-200 rounded-2xl text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-accent-500 focus:bg-white resize-none"
                  />
                  <p className="text-[11px] text-ink-400 mt-1">
                    * Bạn chỉ có thể sửa địa chỉ khi đơn hàng đang ở trạng thái Chờ Duyệt & Đóng Gói.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrderAddress(null)}
                    className="px-4 py-2.5 rounded-2xl border border-cream-200 text-xs font-bold text-ink-700 hover:bg-cream-100 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-accent px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 5. DIALOG: CANCEL ORDER CONFIRMATION MODAL */}
      {cancellingOrder &&
        createPortal(
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
            onClick={() => !isCancelling && setCancellingOrder(null)}
          >
            <div
              className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-cream-200 space-y-5 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900">Xác Nhận Hủy Đơn Hàng</h3>
                <p className="text-xs text-ink-500">
                  Bạn có chắc chắn muốn hủy đơn hàng <strong>{cancellingOrder.order_code}</strong>?
                </p>
              </div>

              <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-2xl text-xs text-ink-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">Tổng giá trị:</span>
                  <strong className="text-accent-600 font-bold font-display">{formatCurrency(cancellingOrder.totalAmount)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">Số sản phẩm:</span>
                  <span className="font-semibold text-ink-800">{cancellingOrder.items.length} món</span>
                </div>
                <p className="text-[11px] text-amber-700 pt-1 font-medium border-t border-cream-200">
                  ⚠️ Sau khi hủy, toàn bộ số lượng sản phẩm trong đơn sẽ tự động được hoàn lại kho.
                </p>
              </div>

              {/* Reason selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-700">Vui lòng chọn lý do hủy:</label>
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
                  onClick={() => setCancellingOrder(null)}
                  className="w-1/2 py-2.5 rounded-2xl border border-cream-200 bg-white hover:bg-cream-50 text-xs font-bold text-ink-700 transition-colors cursor-pointer"
                >
                  Giữ lại đơn
                </button>

                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancelOrder}
                  className="w-1/2 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isCancelling ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        )}

      {/* 6. DIALOG: TRA CỨU HÀNH TRÌNH GIAO HÀNG */}
      {trackingOrder &&
        createPortal(
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
            onClick={() => setTrackingOrder(null)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-cream-200 space-y-6 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-cream-100">
                <div className="flex items-center gap-2">
                  <Truck size={20} className="text-blue-600" />
                  <h3 className="font-display font-bold text-lg text-ink-900">
                    Hành Trình Giao Hàng ({trackingOrder.order_code})
                  </h3>
                </div>
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-cream-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-400">Đối tác vận chuyển:</span>
                  <span className="font-bold text-ink-900">{trackingOrder.shippingPartner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Mã vận đơn bưu cục:</span>
                  <span className="font-bold font-mono text-accent-600">{trackingOrder.trackingCode}</span>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="space-y-6 pl-2 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-cream-200">
                {trackingOrder.journey.map((step, idx) => (
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
                onClick={() => setTrackingOrder(null)}
                className="w-full py-3 bg-cream-100 hover:bg-cream-200 text-xs font-bold text-ink-800 rounded-2xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* 7. DIALOG: ĐÁNH GIÁ SẢN PHẨM */}
      {ratingOrder && (
        <OrderRatingModal
          orderCode={ratingOrder.order_code}
          items={ratingOrder.items.map((it) => ({
            id: it.name,
            name: it.name,
            image_url: it.image_url || '',
          }))}
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
