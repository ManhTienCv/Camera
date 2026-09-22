import React, { useState, useMemo } from 'react';
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

// Lab 08 Tab Definitions
const TABS = [
  { key: 'all', label: 'Tất cả', statuses: [] },
  { key: 'pending', label: 'Chờ xử lý', statuses: ['pending', 'not_shipped', 'processing'] },
  { key: 'ready', label: 'Chờ lấy hàng', statuses: ['ready_to_pick'] },
  { key: 'picking', label: 'Đang lấy hàng', statuses: ['picking'] },
  { key: 'delivering', label: 'Đang giao', statuses: ['shipping', 'delivering', 'picked', 'storing', 'transporting', 'sorting'] },
  { key: 'delivered', label: 'Thành công', statuses: ['delivered', 'completed'] },
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
  const itemsPerPage = 10;

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

  const totalAdminPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (adminPageNum - 1) * itemsPerPage,
    adminPageNum * itemsPerPage
  );

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
                  ? 'bg-ink-900 text-white shadow-sm scale-102'
                  : 'bg-white text-ink-700 hover:bg-cream-100 border border-cream-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-cream-200/80 text-ink-600'
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100/60 border-b border-cream-200 text-xs font-bold text-ink-600 uppercase tracking-wider">
                <th className="py-4 px-6">MÃ ĐƠN</th>
                <th className="py-4 px-6">KHÁCH HÀNG</th>
                <th className="py-4 px-6">THANH TOÁN</th>
                <th className="py-4 px-6">VẬN CHUYỂN GHN</th>
                <th className="py-4 px-6">TỔNG TIỀN</th>
                <th className="py-4 px-6">TRẠNG THÁI</th>
                <th className="py-4 px-6 text-center">THAO TÁC</th>
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
                      <td className="py-4 px-6">
                        <span className="font-bold font-mono text-accent-600">
                          {o.order_code || o.id.substring(0, 8)}
                        </span>
                        <p className="text-[11px] text-ink-400 mt-0.5">
                          {new Date(o.created_at || Date.now()).toLocaleDateString('vi-VN')}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-ink-900">{o.customer_name}</p>
                        <p className="text-xs text-ink-500">{o.customer_phone}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                              className={`text-[11px] font-semibold ${
                                o.payment_status === 'completed' || o.payment_status === 'paid'
                                  ? 'text-emerald-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {o.payment_status === 'completed' || o.payment_status === 'paid'
                                ? '● Đã thanh toán'
                                : '○ Chờ thanh toán'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {o.tracking_code ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[11px] font-bold font-mono">
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {pushingGhnId === o.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Truck size={13} />
                            )}
                            <span>Đẩy GHN</span>
                          </button>
                        ) : (
                          <span className="text-xs text-ink-400">Tự vận chuyển</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-ink-900">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={o.status || 'pending'}
                            onChange={(e) => handleStatusSelect(o, e.target.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border focus:outline-none cursor-pointer transition-all ${
                              o.status === 'completed' || o.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isDelivering
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
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
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => onViewOrder(o)}
                          className="bg-ink-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        >
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalAdminPages > 1 && (
          <div className="p-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4 bg-cream-50/50">
            <div className="text-xs text-ink-500 font-medium">
              Hiển thị <span className="font-bold text-ink-900">{(adminPageNum - 1) * itemsPerPage + 1}</span> -{' '}
              <span className="font-bold text-ink-900">{Math.min(adminPageNum * itemsPerPage, filteredOrders.length)}</span> trên{' '}
              <span className="font-bold text-ink-900">{filteredOrders.length}</span> đơn hàng
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdminPageNum((p) => Math.max(1, p - 1))}
                disabled={adminPageNum === 1}
                className="px-3 py-1.5 rounded-xl border border-cream-200 bg-white text-xs font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Trước
              </button>
              {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setAdminPageNum(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    adminPageNum === pageNum
                      ? 'bg-ink-900 text-white shadow-xs'
                      : 'bg-white text-ink-700 border border-cream-200 hover:border-cream-300'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setAdminPageNum((p) => Math.min(totalAdminPages, p + 1))}
                disabled={adminPageNum === totalAdminPages || totalAdminPages === 0}
                className="px-3 py-1.5 rounded-xl border border-cream-200 bg-white text-xs font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
