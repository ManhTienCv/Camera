import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye,
  Truck,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Lock,
  CheckCircle2,
  X,
  CreditCard,
} from 'lucide-react';
import type { Order } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface AdminOrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: any) => void;
  onViewOrder: (order: Order) => void;
  onRefreshOrders?: () => void;
}

// Lab 08 Tab Definitions + Refund Workflow
const TABS = [
  { key: 'all', label: 'Tất cả', statuses: [] },
  { key: 'pending', label: 'Chờ xử lý', statuses: ['pending', 'not_shipped', 'processing'] },
  { key: 'ready', label: 'Chờ lấy hàng', statuses: ['ready_to_pick'] },
  { key: 'picking', label: 'Đang lấy hàng', statuses: ['picking'] },
  { key: 'delivering', label: 'Đang giao', statuses: ['shipping', 'delivering', 'picked', 'storing', 'transporting', 'sorting'] },
  { key: 'delivered', label: 'Thành công', statuses: ['delivered', 'completed'] },
  { key: 'refund', label: 'Chờ hoàn tiền', statuses: ['refund_pending'] },
  { key: 'return', label: 'Hoàn hàng', statuses: ['return', 'returning', 'returned'] },
  { key: 'cancelled', label: 'Đã hủy', statuses: ['cancelled'] },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  onUpdateStatus,
  onViewOrder,
  onRefreshOrders,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [adminPageNum, setAdminPageNum] = useState(1);
  const [pushingGhnId, setPushingGhnId] = useState<string | null>(null);
  const [syncingGhnId, setSyncingGhnId] = useState<string | null>(null);
  const [confirmingRefundOrder, setConfirmingRefundOrder] = useState<Order | null>(null);
  const [refundRefCode, setRefundRefCode] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Compute counts for all 8 status tabs (Lab 08)
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    TABS.forEach((tab) => {
      if (tab.key === 'all') return;
      counts[tab.key] = orders.filter((o) => tab.statuses.includes(o.status as any)).length;
    });
    return counts;
  }, [orders]);

  // Filter orders by active tab, search query, and payment filter
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Tab filter
      if (activeTab !== 'all') {
        const tabDef = TABS.find((t) => t.key === activeTab);
        if (tabDef && !tabDef.statuses.includes(o.status as any)) {
          return false;
        }
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (o.order_code || o.id).toLowerCase();
        const name = (o.customer_name || '').toLowerCase();
        const phone = (o.customer_phone || '').toLowerCase();
        const tracking = (o.tracking_code || o.ghn_order_code || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !phone.includes(q) && !tracking.includes(q)) {
          return false;
        }
      }

      // 3. Payment filter
      if (paymentFilter && o.payment_method !== paymentFilter) {
        return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery, paymentFilter]);

  const totalAdminPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (adminPageNum - 1) * itemsPerPage,
    adminPageNum * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    setAdminPageNum(newPage);
    document.querySelector('main')?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePushGhn = async (orderId: string) => {
    setPushingGhnId(orderId);
    try {
      const res = await api.createGhnOrder(orderId);
      if (res.success) {
        toast.success(`Đã đẩy đơn sang GHN! Mã vận đơn: ${res.tracking_code}`);
        if (onRefreshOrders) {
          onRefreshOrders();
        } else {
          onUpdateStatus(orderId, 'shipping');
        }
      } else {
        toast.error(res.message || 'Lỗi khi đẩy đơn sang GHN.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể kết nối tới GHN API.');
    } finally {
      setPushingGhnId(null);
    }
  };

  const handleSyncGhn = async (orderId: string) => {
    setSyncingGhnId(orderId);
    try {
      const res = await api.syncGhnOrderStatus(orderId);
      if (res && res.success) {
        toast.success(res.message || 'Đồng bộ GHN thành công!');
        if (onRefreshOrders) {
          onRefreshOrders();
        }
      } else {
        toast.warning(res?.message || 'Không thể đồng bộ với GHN');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đồng bộ đơn với GHN.');
    } finally {
      setSyncingGhnId(null);
    }
  };

  const handleConfirmRefund = async () => {
    if (!confirmingRefundOrder) return;
    if (!refundRefCode.trim()) {
      toast.error('Vui lòng nhập mã tham chiếu giao dịch ngân hàng / Ref Code.');
      return;
    }
    setIsSubmittingRefund(true);
    try {
      const res = await api.confirmAdminRefund(confirmingRefundOrder.id, refundRefCode.trim());
      if (res.success) {
        toast.success(res.message || 'Đã xác nhận hoàn tiền thành công!');
        setConfirmingRefundOrder(null);
        setRefundRefCode('');
        if (onRefreshOrders) {
          onRefreshOrders();
        } else {
          onUpdateStatus(confirmingRefundOrder.id, 'cancelled');
        }
      } else {
        toast.error(res.message || 'Xác nhận hoàn tiền thất bại.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi khi xác nhận hoàn tiền.');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleStatusSelect = (order: Order, newStatus: string) => {
    // QUY TẮC LAB 08: Nếu đơn hàng ở trạng thái đang giao -> KHÔNG cho Hủy
    const isDelivering = ['shipping', 'delivering', 'picked', 'storing', 'transporting', 'sorting'].includes(order.status);
    if (isDelivering && newStatus === 'cancelled') {
      toast.error('Quy tắc Lab 08: Đơn hàng đang giao không thể Hủy!');
      return;
    }

    onUpdateStatus(order.id, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-display font-bold text-ink-900">Quản lý Đơn hàng & Vận chuyển</h3>
          <p className="text-sm text-ink-500 mt-1">
            Xử lý vòng đời đơn hàng, đồng bộ vận chuyển GHN Express và đối soát thanh toán ({orders.length} đơn).
          </p>
        </div>

        {onRefreshOrders && (
          <button
            onClick={onRefreshOrders}
            className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 self-start cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Làm mới danh sách</span>
          </button>
        )}
      </div>

      {/* Lab 08: 8 Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const count = tabCounts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setAdminPageNum(1);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-ink-900 dark:bg-accent-500 text-white shadow-sm scale-102'
                  : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 border border-cream-200 dark:border-ink-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-cream-200/80 dark:bg-ink-800 text-ink-600 dark:text-cream-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setAdminPageNum(1);
            }}
            placeholder="Tìm theo mã đơn, tên khách, số điện thoại, mã GHN..."
            className="w-full pl-10 pr-4 py-2.5 bg-cream-50/70 border border-cream-200 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setAdminPageNum(1);
            }}
            className="px-3 py-2.5 bg-cream-50/70 border border-cream-200 rounded-2xl text-xs text-ink-800 font-semibold focus:outline-none focus:border-accent-500 cursor-pointer"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="momo">Ví MoMo</option>
            <option value="vietqr">VietQR</option>
            <option value="cod">Tiền mặt (COD)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="admin-orders-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100/70 border-b border-cream-200 text-xs font-bold text-ink-600 uppercase tracking-wider">
                <th className="py-4 px-5 whitespace-nowrap min-w-[140px]">MÃ ĐƠN</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[170px]">KHÁCH HÀNG</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[150px]">THANH TOÁN</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[150px]">VẬN CHUYỂN GHN</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[130px]">TỔNG TIỀN</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[170px]">TRẠNG THÁI</th>
                <th className="py-4 px-5 text-center whitespace-nowrap min-w-[120px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-400">
                    Không có đơn hàng nào trong mục này.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => {
                  const isDelivering = ['shipping', 'delivering', 'picked', 'storing', 'transporting', 'sorting'].includes(o.status);

                  return (
                    <tr key={o.id} className="hover:bg-cream-50/70 transition-colors">
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <span className="font-bold font-mono text-accent-600 text-xs tracking-wide block">
                          {o.order_code || o.id.substring(0, 8)}
                        </span>
                        <p className="text-[11px] text-ink-400 mt-0.5">
                          {new Date(o.created_at || Date.now()).toLocaleDateString('vi-VN')}
                        </p>
                      </td>
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <p className="font-bold text-ink-900 text-xs">{o.customer_name}</p>
                        <p className="text-[11px] text-ink-500 font-mono mt-0.5">{o.customer_phone}</p>
                      </td>
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
                              o.payment_method === 'momo'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : o.payment_method === 'vietqr'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-cream-200/80 text-ink-700 border border-cream-300'
                            }`}
                          >
                            {o.payment_method === 'momo'
                              ? 'Ví MoMo'
                              : o.payment_method === 'vietqr'
                              ? 'VietQR'
                              : 'COD (Tiền mặt)'}
                          </span>
                          <div>
                            <span
                              className={`text-[11px] font-semibold whitespace-nowrap inline-flex items-center gap-1 ${
                                o.payment_status === 'refunded'
                                  ? 'text-purple-600'
                                  : o.payment_status === 'refund_pending'
                                  ? 'text-amber-600'
                                  : o.payment_status === 'completed' || o.payment_status === 'paid'
                                  ? 'text-emerald-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {o.payment_status === 'refunded'
                                ? '● Đã hoàn tiền'
                                : o.payment_status === 'refund_pending'
                                ? '⏳ Chờ hoàn tiền'
                                : o.payment_status === 'completed' || o.payment_status === 'paid'
                                ? '● Đã thanh toán'
                                : '○ Chờ thanh toán'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        {o.tracking_code ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[11px] font-bold font-mono whitespace-nowrap">
                                <Truck size={12} />
                                <span>{o.tracking_code}</span>
                              </span>
                              <button
                                onClick={() => handleSyncGhn(o.id)}
                                disabled={syncingGhnId === o.id}
                                className="p-1 text-ink-500 hover:text-accent-600 hover:bg-cream-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Đồng bộ trạng thái trực tiếp từ GHN"
                              >
                                <RefreshCw size={12} className={syncingGhnId === o.id ? 'animate-spin' : ''} />
                              </button>
                            </div>
                            <p className="text-[10px] text-ink-400">GHN Express</p>
                          </div>
                        ) : o.status === 'pending' ? (
                          <button
                            onClick={() => handlePushGhn(o.id)}
                            disabled={pushingGhnId === o.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                          >
                            {pushingGhnId === o.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Truck size={13} />
                            )}
                            <span>Đẩy GHN</span>
                          </button>
                        ) : (
                          <span className="text-xs text-ink-400 whitespace-nowrap">Tự vận chuyển</span>
                        )}
                      </td>
                      <td className="py-4 px-5 align-middle font-bold text-ink-900 tabular-nums whitespace-nowrap text-xs">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={o.status || 'pending'}
                            onChange={(e) => handleStatusSelect(o, e.target.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border focus:outline-none cursor-pointer transition-all whitespace-nowrap ${
                              o.status === 'completed' || o.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isDelivering
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : o.status === 'refund_pending'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : o.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="ready_to_pick">Chờ lấy hàng</option>
                            <option value="picking">Đang lấy hàng</option>
                            <option value="shipping">Đang giao hàng</option>
                            <option value="completed">Giao thành công / Hoàn tất</option>
                            <option value="refund_pending">Chờ hoàn tiền</option>
                            {/* LAB 08 RULE: Nếu đang giao -> KHÔNG cho Hủy */}
                            <option value="cancelled" disabled={isDelivering}>
                              {isDelivering ? 'Đã hủy (Đang giao: Khóa hủy)' : 'Hủy đơn hàng'}
                            </option>
                          </select>
                          {isDelivering && (
                            <span title="Lab 08: Đơn hàng đang giao KHÔNG cho Hủy">
                              <Lock size={13} className="text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {(o.status === 'refund_pending' || o.payment_status === 'refund_pending') && (
                            <button
                              onClick={() => {
                                setConfirmingRefundOrder(o);
                                setRefundRefCode('');
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 whitespace-nowrap"
                              title="Xem tài khoản ngân hàng và xác nhận đã hoàn tiền"
                            >
                              <RefreshCw size={13} />
                              <span>Hoàn tiền</span>
                            </button>
                          )}
                          <button
                            onClick={() => onViewOrder(o)}
                            className="bg-ink-900 hover:bg-black text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
                          >
                            <Eye size={14} className="shrink-0" />
                            <span className="whitespace-nowrap">Chi tiết</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {filteredOrders.length > 0 && (
          <div className="p-4 px-6 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4 bg-cream-50/70">
            <div className="flex items-center gap-3 text-xs text-ink-600 font-medium">
              <div>
                Hiển thị <span className="font-bold text-ink-900">{(adminPageNum - 1) * itemsPerPage + 1}</span> -{' '}
                <span className="font-bold text-ink-900">{Math.min(adminPageNum * itemsPerPage, filteredOrders.length)}</span> trên{' '}
                <span className="font-bold text-ink-900">{filteredOrders.length}</span> đơn hàng
              </div>

              <div className="flex items-center gap-1.5 border-l border-cream-200 pl-3">
                <span className="text-[11px] text-ink-400">Hiển thị:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setAdminPageNum(1);
                  }}
                  className="px-2 py-1 bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-700 rounded-lg text-xs font-bold text-ink-800 dark:text-cream-100 focus:outline-none focus:border-accent-500 cursor-pointer shadow-2xs"
                >
                  <option value={5}>5 đơn / trang</option>
                  <option value={10}>10 đơn / trang</option>
                  <option value={20}>20 đơn / trang</option>
                  <option value={50}>50 đơn / trang</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(1, adminPageNum - 1))}
                disabled={adminPageNum === 1}
                className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                ‹ Trước
              </button>
              {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    adminPageNum === pageNum
                      ? 'bg-ink-900 dark:bg-accent-500 text-white shadow-xs'
                      : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-cream-200 border border-cream-300 dark:border-ink-700 hover:bg-cream-100 dark:hover:bg-ink-800'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(Math.min(totalAdminPages, adminPageNum + 1))}
                disabled={adminPageNum === totalAdminPages || totalAdminPages === 0}
                className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                Sau ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM REFUND MODAL */}
      {confirmingRefundOrder && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setConfirmingRefundOrder(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-scale-in border border-cream-200 cursor-default max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cream-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink-900">Xác nhận chuyển tiền hoàn</h3>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Đơn hàng #{confirmingRefundOrder.order_code || confirmingRefundOrder.id.substring(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmingRefundOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-cream-100 flex items-center justify-center text-ink-400 hover:text-ink-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-ink-500 font-medium">Khách hàng:</span>
                  <span className="font-bold text-ink-900">{confirmingRefundOrder.customer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500 font-medium">Số điện thoại:</span>
                  <span className="font-bold text-ink-900">{confirmingRefundOrder.customer_phone}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                  <span className="text-ink-700 font-bold">Số tiền cần hoàn trả:</span>
                  <span className="font-display font-bold text-base text-accent-600">
                    {formatCurrency(confirmingRefundOrder.total_amount)}
                  </span>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 space-y-2.5">
                <h4 className="font-bold text-ink-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Tài khoản ngân hàng của khách</span>
                </h4>
                <div className="space-y-1.5 text-xs text-ink-700">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-400">Ngân hàng:</span>
                    <span className="font-bold text-ink-900">
                      {confirmingRefundOrder.bank_name || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-400">Số tài khoản:</span>
                    <span className="font-bold font-mono text-ink-900 bg-white px-2 py-0.5 rounded border border-cream-200">
                      {confirmingRefundOrder.bank_account_number || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-400">Tên chủ thẻ:</span>
                    <span className="font-bold uppercase text-ink-900">
                      {confirmingRefundOrder.bank_account_holder || 'Chưa cung cấp'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Ref Code Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-ink-800 uppercase tracking-wider text-[11px]">
                  Mã tham chiếu ngân hàng (Ref Code / FT...) *
                </label>
                <input
                  type="text"
                  value={refundRefCode}
                  onChange={(e) => setRefundRefCode(e.target.value)}
                  placeholder="Ví dụ: FT2609228899 hoặc MB99283716"
                  className="input-field text-xs font-mono"
                  autoFocus
                />
                <p className="text-[11px] text-ink-400">
                  Sau khi Admin thực hiện chuyển khoản hoàn tiền trên Internet Banking, vui lòng điền mã giao dịch vào đây để đối soát tài chính.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-cream-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmingRefundOrder(null)}
                disabled={isSubmittingRefund}
                className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={isSubmittingRefund || !refundRefCode.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRefund ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>Xác nhận đã hoàn tiền</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
