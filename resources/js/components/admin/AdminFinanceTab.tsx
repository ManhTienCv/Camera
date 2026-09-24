import React, { useState, useEffect, useCallback } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  Receipt,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  Clock,
  Smartphone,
  XCircle,
  Ban,
  Undo2,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Wallet,
  ShieldCheck,
  CreditCard,
  Building,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { GlidingIndicator } from '../ui/GlidingIndicator';
import type {
  FinanceSummaryData,
  FinanceTransactionsData,
  FinanceTransactionItem,
  FinanceFilterParams,
} from '../../types';

export const AdminFinanceTab: React.FC = () => {
  const toast = useToast();
  const [subTab, setSubTab] = useState<'summary' | 'transactions'>('summary');

  // Loading states
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Data states
  const [summaryData, setSummaryData] = useState<FinanceSummaryData | null>(null);
  const [transactionsData, setTransactionsData] = useState<FinanceTransactionsData | null>(null);

  // Filter states
  const [filters, setFilters] = useState<FinanceFilterParams>({
    search: '',
    date_from: '',
    date_to: '',
    min_amount: '',
    max_amount: '',
    gateway: '',
    payment_status: '',
    sort: 'newest',
    page: 1,
  });

  // Modal state for reconciling COD transaction
  const [reconcilingItem, setReconcilingItem] = useState<{
    order: FinanceTransactionItem;
    availableTargets: string[];
    selectedTarget: string;
  } | null>(null);

  // Fetch Summary Data
  const fetchSummary = useCallback(async (customFilters?: FinanceFilterParams) => {
    setLoadingSummary(true);
    try {
      const activeFilters = customFilters || filters;
      const res = await api.getAdminFinanceSummary(activeFilters);
      setSummaryData(res);
    } catch (err: any) {
      console.error('Lỗi tải thống kê tài chính:', err);
      toast.error('Không thể tải số liệu thống kê tài chính.');
    } finally {
      setLoadingSummary(false);
    }
  }, [filters, toast]);

  // Fetch Transactions Data
  const fetchTransactions = useCallback(async (customFilters?: FinanceFilterParams) => {
    setLoadingTransactions(true);
    try {
      const activeFilters = customFilters || filters;
      const res = await api.getAdminFinanceTransactions(activeFilters);
      setTransactionsData(res);
    } catch (err: any) {
      console.error('Lỗi tải danh sách giao dịch:', err);
      toast.error('Không thể tải danh sách giao dịch.');
    } finally {
      setLoadingTransactions(false);
    }
  }, [filters, toast]);

  // Initial load
  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    if (subTab === 'summary') {
      fetchSummary(updated);
    } else {
      fetchTransactions(updated);
    }
  };

  const handleResetFilter = () => {
    const emptyFilters: FinanceFilterParams = {
      search: '',
      date_from: '',
      date_to: '',
      min_amount: '',
      max_amount: '',
      gateway: '',
      payment_status: '',
      sort: 'newest',
      page: 1,
    };
    setFilters(emptyFilters);
    fetchSummary(emptyFilters);
    fetchTransactions(emptyFilters);
  };

  const handlePageChange = (newPage: number) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    fetchTransactions(updated);
  };

  // Open reconciliation modal
  const handleOpenReconcile = (order: FinanceTransactionItem, allowedTransitions: string[]) => {
    const targets = allowedTransitions.filter((t) => t !== order.payment_status);
    if (targets.length === 0) return;
    const defaultTarget = targets.includes('paid') ? 'paid' : targets[0];
    setReconcilingItem({
      order,
      availableTargets: targets,
      selectedTarget: defaultTarget,
    });
  };

  // Submit COD status transition from reconciliation modal
  const handleConfirmReconciliation = async () => {
    if (!reconcilingItem || !reconcilingItem.selectedTarget) return;
    setIsUpdatingStatus(true);
    const { order, selectedTarget } = reconcilingItem;

    try {
      await api.updateAdminFinanceStatus(order.id, {
        payment_status: selectedTarget,
        current_payment_status: order.payment_status,
        current_order_status: order.order_status || order.status,
        current_payment_id: order.payment_id || 0,
      });

      toast.success(
        `Đã cập nhật đối soát đơn #${order.order_code || order.id} thành "${
          STATUS_CONFIG[selectedTarget]?.label || selectedTarget
        }".`
      );
      setReconcilingItem(null);
      // Refresh both tabs
      fetchSummary();
      fetchTransactions();
    } catch (err: any) {
      console.error('Lỗi cập nhật COD:', err);
      toast.error(err.message || 'Không thể cập nhật trạng thái thanh toán.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // STATUS CONFIGURATION
  const STATUS_CONFIG: Record<
    string,
    { label: string; icon: React.ComponentType<{ size: number; className?: string }>; color: string; bg: string; border: string }
  > = {
    pending: {
      label: 'Chờ thanh toán',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-200 dark:border-amber-800',
    },
    initiated: {
      label: 'Đang chờ MoMo',
      icon: Smartphone,
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-50 dark:bg-pink-950/60',
      border: 'border-pink-200 dark:border-pink-800',
    },
    paid: {
      label: 'Đã thanh toán',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    failed: {
      label: 'Thanh toán thất bại',
      icon: XCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      border: 'border-rose-200 dark:border-rose-800',
    },
    cancelled: {
      label: 'Đã hủy',
      icon: Ban,
      color: 'text-ink-500 dark:text-ink-400',
      bg: 'bg-cream-100 dark:bg-ink-800',
      border: 'border-cream-300 dark:border-ink-700',
    },
    refund_pending: {
      label: 'Chờ hoàn tiền',
      icon: Undo2,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-200 dark:border-amber-800',
    },
    refunded: {
      label: 'Đã hoàn tiền',
      icon: ArrowRightLeft,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/60',
      border: 'border-sky-200 dark:border-sky-800',
    },
  };

  const RECONCILE_STATUS_INFO: Record<
    string,
    {
      title: string;
      description: string;
      icon: React.ComponentType<{ size: number; className?: string }>;
      accentColor: string;
      badgeText: string;
      borderActiveClass: string;
      bgActiveClass: string;
    }
  > = {
    paid: {
      title: 'Đã thu tiền COD (Giao thành công)',
      description: 'Shipper đã giao hàng thành công và thu đủ tiền mặt từ khách hàng.',
      icon: CheckCircle2,
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      badgeText: 'Khuyên dùng',
      borderActiveClass: 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20',
      bgActiveClass: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    },
    failed: {
      title: 'Thanh toán thất bại / Hoàn hàng',
      description: 'Khách hàng từ chối nhận, hoàn đơn hoặc giao hàng không thành công.',
      icon: XCircle,
      accentColor: 'text-rose-600 dark:text-rose-400',
      badgeText: 'Thất bại',
      borderActiveClass: 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20',
      bgActiveClass: 'bg-rose-50/80 dark:bg-rose-950/40',
    },
    pending: {
      title: 'Khôi phục Chờ thanh toán',
      description: 'Đơn đang hẹn giao lại hoặc cần đối soát lại với bên chuyển phát.',
      icon: Clock,
      accentColor: 'text-amber-600 dark:text-amber-400',
      badgeText: 'Chờ giao',
      borderActiveClass: 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20',
      bgActiveClass: 'bg-amber-50/80 dark:bg-amber-950/40',
    },
    refund_pending: {
      title: 'Tạo yêu cầu Chờ hoàn tiền',
      description: 'Khách trả hàng sau khi đã thu tiền hoặc có yêu cầu hoàn tiền COD.',
      icon: Undo2,
      accentColor: 'text-amber-600 dark:text-amber-400',
      badgeText: 'Hoàn trả',
      borderActiveClass: 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20',
      bgActiveClass: 'bg-amber-50/80 dark:bg-amber-950/40',
    },
    refunded: {
      title: 'Xác nhận Đã hoàn tiền',
      description: 'Đã hoàn tất chuyển tiền hoàn trả cho khách hàng qua số tài khoản.',
      icon: ArrowRightLeft,
      accentColor: 'text-sky-600 dark:text-sky-400',
      badgeText: 'Đã hoàn',
      borderActiveClass: 'border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/20',
      bgActiveClass: 'bg-sky-50/80 dark:bg-sky-950/40',
    },
  };

  const GATEWAY_CONFIG: Record<string, { label: string; badge: string }> = {
    cod: {
      label: 'COD (Tiền mặt)',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300',
    },
    momo: {
      label: 'Ví MoMo',
      badge: 'bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300 border-pink-300',
    },
    unknown: {
      label: 'Chưa xác định',
      badge: 'bg-cream-200 text-ink-700 dark:bg-ink-800 dark:text-cream-300 border-cream-300',
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-accent-100 dark:bg-accent-950/60 text-accent-700 dark:text-accent-400 border border-accent-200 dark:border-accent-800/80 flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Quản trị Tài chính
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-ink-900 dark:text-cream-50 leading-tight">
            Thống Kê Tài Chính & Đối Soát Giao Dịch
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Theo dõi dòng tiền, thống kê doanh số theo cổng thanh toán và quản lý đối soát đơn hàng.
          </p>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative bg-cream-100 dark:bg-ink-950 p-1.5 rounded-2xl flex items-center gap-1 border border-cream-200 dark:border-ink-800" role="tablist" aria-label="Phân hệ tài chính">
            <button
              role="tab"
              aria-selected={subTab === 'summary'}
              onClick={() => setSubTab('summary')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer select-none outline-none ${
                subTab === 'summary'
                  ? 'text-white'
                  : 'text-ink-600 dark:text-cream-300 hover:text-ink-900 dark:hover:text-cream-100'
              }`}
            >
              {subTab === 'summary' && (
                <GlidingIndicator
                  layoutId="admin-finance-subtab-pill"
                  className="inset-0 bg-accent-500 rounded-xl shadow-xs"
                />
              )}
              <TrendingUp size={15} className="relative z-10" />
              <span className="relative z-10">Thống kê tổng quan</span>
            </button>
            <button
              role="tab"
              aria-selected={subTab === 'transactions'}
              onClick={() => setSubTab('transactions')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer select-none outline-none ${
                subTab === 'transactions'
                  ? 'text-white'
                  : 'text-ink-600 dark:text-cream-300 hover:text-ink-900 dark:hover:text-cream-100'
              }`}
            >
              {subTab === 'transactions' && (
                <GlidingIndicator
                  layoutId="admin-finance-subtab-pill"
                  className="inset-0 bg-accent-500 rounded-xl shadow-xs"
                />
              )}
              <Receipt size={15} className="relative z-10" />
              <span className="relative z-10">Chi tiết giao dịch & COD</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (subTab === 'summary') fetchSummary();
              else fetchTransactions();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-cream-100 dark:bg-ink-800 hover:bg-cream-200 dark:hover:bg-ink-700 text-ink-600 dark:text-cream-200 transition-colors cursor-pointer border border-cream-200 dark:border-ink-700 shadow-2xs"
            title="Làm mới dữ liệu"
          >
            <RotateCcw size={16} className={loadingSummary || loadingTransactions ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* FILTER DRAWER / BAR */}
      <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cream-100 dark:border-ink-800">
          <div className="flex items-center gap-2 text-ink-900 dark:text-cream-50 font-bold text-sm">
            <Filter size={16} className="text-accent-500" />
            <span>Bộ Lọc Dữ Liệu Tài Chính</span>
          </div>
          {(filters.search || filters.gateway || filters.payment_status || filters.date_from || filters.date_to || filters.min_amount || filters.max_amount) && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-400 border border-accent-200 dark:border-accent-800">
              Đang kích hoạt bộ lọc
            </span>
          )}
        </div>

        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {/* Keyword search */}
          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-200 mb-1">
              Mã đơn / Khách hàng / SĐT
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="CAM-1002, 0988..."
                className="w-full pl-8 pr-3 py-2 bg-cream-50/80 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            </div>
          </div>

          {/* Date from */}
          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-200 mb-1">
              Từ ngày tạo
            </label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))}
              className="w-full px-3 py-2 bg-cream-50/80 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-200 mb-1">
              Đến ngày tạo
            </label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))}
              className="w-full px-3 py-2 bg-cream-50/80 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500"
            />
          </div>

          {/* Gateway */}
          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-200 mb-1">
              Cổng thanh toán
            </label>
            <select
              value={filters.gateway || ''}
              onChange={(e) => setFilters((p) => ({ ...p, gateway: e.target.value }))}
              className="w-full px-3 py-2 bg-cream-50/80 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500"
            >
              <option value="">-- Tất cả cổng --</option>
              <option value="cod">COD (Thanh toán khi nhận hàng)</option>
              <option value="momo">Ví điện tử MoMo</option>
              <option value="unknown">Chưa xác định</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-200 mb-1">
              Trạng thái thanh toán
            </label>
            <select
              value={filters.payment_status || ''}
              onChange={(e) => setFilters((p) => ({ ...p, payment_status: e.target.value }))}
              className="w-full px-3 py-2 bg-cream-50/80 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500"
            >
              <option value="">-- Tất cả trạng thái --</option>
              {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => (
                <option key={stKey} value={stKey}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Min amount */}
          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-200 mb-1">
              Số tiền tối thiểu (VNĐ)
            </label>
            <input
              type="number"
              step="1000"
              value={filters.min_amount || ''}
              onChange={(e) => setFilters((p) => ({ ...p, min_amount: e.target.value }))}
              placeholder="Từ 0đ..."
              className="w-full px-3 py-2 bg-cream-50/80 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500"
            />
          </div>

          {/* Max amount */}
          <div>
            <label className="block font-bold text-ink-700 dark:text-cream-200 mb-1">
              Số tiền tối đa (VNĐ)
            </label>
            <input
              type="number"
              step="1000"
              value={filters.max_amount || ''}
              onChange={(e) => setFilters((p) => ({ ...p, max_amount: e.target.value }))}
              placeholder="Đến..."
              className="w-full px-3 py-2 bg-cream-50/80 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Filter size={13} />
              <span>Áp dụng</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="py-2 px-3 bg-cream-100 dark:bg-ink-800 hover:bg-cream-200 dark:hover:bg-ink-700 text-ink-700 dark:text-cream-200 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Đặt lại
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: THỐNG KÊ TỔNG QUAN */}
      {/* ========================================================================= */}
      {subTab === 'summary' && (
        <div className="space-y-6">
          {loadingSummary ? (
            <div className="py-24 flex flex-col items-center justify-center text-center text-ink-400">
              <Loader2 size={32} className="animate-spin text-accent-500 mb-3" />
              <p className="text-sm font-medium">Đang tổng hợp báo cáo tài chính...</p>
            </div>
          ) : (
            <>
              {/* Hero Overview Card - Redesigned to match CameraHub page theme */}
              <div className="bg-gradient-to-br from-white via-cream-50/80 to-accent-50/30 dark:from-ink-900 dark:via-ink-900/90 dark:to-accent-950/20 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                {/* Soft ambient background glow */}
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-accent-500/8 dark:bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-64 h-64 bg-amber-400/8 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                  <div className="lg:col-span-7 space-y-3.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                      <CircleDollarSign size={14} className="text-amber-600 dark:text-amber-400" />
                      Tổng Doanh Thu Đơn Hàng Theo Bộ Lọc
                    </span>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-ink-900 dark:text-cream-50">
                      {formatCurrency(summaryData?.summary?.total_amount || 0)}
                    </h1>
                    <p className="text-xs text-ink-500 dark:text-cream-400/80 max-w-lg leading-relaxed">
                      Bao gồm toàn bộ các đơn hàng phù hợp với điều kiện tìm kiếm và khoảng thời gian đã chọn.
                    </p>
                  </div>

                  <div className="lg:col-span-5 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-cream-200 dark:border-ink-800 pt-4 lg:pt-0 lg:pl-8 space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-accent-100 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0 shadow-2xs">
                        <Receipt size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-ink-500 dark:text-cream-400 block font-medium">Tổng số đơn hàng ghi nhận</span>
                        <span className="text-2xl font-bold font-display text-ink-900 dark:text-cream-50">
                          {summaryData?.summary?.order_count || 0} đơn
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                          <span>✓</span>
                          <span>Mỗi đơn được tính duy nhất 1 lần</span>
                        </span>
                      </div>
                    </div>

                    {/* Breakdown by Payment Gateway */}
                    <div className="pt-2 grid grid-cols-2 gap-2.5 border-t border-cream-200/80 dark:border-ink-800/80">
                      <div className="bg-amber-50/80 dark:bg-amber-950/25 p-3 rounded-2xl border border-amber-200/70 dark:border-amber-800/50 shadow-2xs">
                        <span className="text-[10px] text-amber-800 dark:text-amber-400 block uppercase font-bold tracking-wider">Thu qua COD</span>
                        <p className="text-sm font-bold text-ink-900 dark:text-cream-50 truncate mt-0.5 font-mono">
                          {formatCurrency(summaryData?.methodTotals?.cod?.total_amount || 0)}
                        </p>
                        <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                          {summaryData?.methodTotals?.cod?.order_count || 0} đơn
                        </span>
                      </div>
                      <div className="bg-pink-50/80 dark:bg-pink-950/25 p-3 rounded-2xl border border-pink-200/70 dark:border-pink-800/50 shadow-2xs">
                        <span className="text-[10px] text-pink-800 dark:text-pink-400 block uppercase font-bold tracking-wider">Thu qua MoMo</span>
                        <p className="text-sm font-bold text-ink-900 dark:text-cream-50 truncate mt-0.5 font-mono">
                          {formatCurrency(summaryData?.methodTotals?.momo?.total_amount || 0)}
                        </p>
                        <span className="text-[11px] text-pink-700/80 dark:text-pink-400/80 font-medium">
                          {summaryData?.methodTotals?.momo?.order_count || 0} đơn
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown KPI Cards (8 individual states) */}
              <div className="space-y-3">
                <h3 className="text-base font-display font-bold text-ink-900 dark:text-cream-50 flex items-center gap-2">
                  <TrendingUp size={16} className="text-accent-500" />
                  <span>Chỉ Số Theo Trạng Thái Thanh Toán Giao Dịch</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => {
                    const statusItem = summaryData?.statusTotals?.[stKey];
                    const count = statusItem?.order_count || 0;
                    const amount = statusItem?.total_amount || 0;
                    const Icon = cfg.icon;

                    return (
                      <div
                        key={stKey}
                        className="bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                          >
                            <Icon size={12} />
                            <span>{cfg.label}</span>
                          </span>
                          <span className="text-sm font-bold font-display text-ink-900 dark:text-cream-50">
                            {count} <span className="text-[11px] font-normal text-ink-400">đơn</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-ink-400 block uppercase font-bold tracking-wide">
                            Tổng giá trị
                          </span>
                          <p className="text-base font-extrabold text-ink-900 dark:text-cream-50 mt-0.5">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: CHI TIẾT GIAO DỊCH & CẬP NHẬT COD */}
      {/* ========================================================================= */}
      {subTab === 'transactions' && (
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-50">
                Danh Sách Giao Dịch & Đối Soát Đơn Hàng
              </h3>
              <p className="text-xs text-ink-400 mt-0.5">
                Tổng cộng {transactionsData?.orders?.total || 0} giao dịch được ghi nhận trong hệ thống
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-400 font-bold shrink-0">Sắp xếp:</span>
              <select
                value={filters.sort || 'newest'}
                onChange={(e) => {
                  const updated = { ...filters, sort: e.target.value, page: 1 };
                  setFilters(updated);
                  fetchTransactions(updated);
                }}
                className="px-3 py-1.5 bg-cream-50 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs text-ink-800 dark:text-cream-100 focus:outline-none focus:border-accent-500"
              >
                <option value="newest">Mới nhất trước</option>
                <option value="oldest">Cũ nhất trước</option>
                <option value="amount_desc">Số tiền cao nhất</option>
                <option value="amount_asc">Số tiền thấp nhất</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          {loadingTransactions ? (
            <div className="py-20 flex flex-col items-center justify-center text-center text-ink-400">
              <Loader2 size={32} className="animate-spin text-accent-500 mb-2" />
              <p className="text-xs">Đang tải danh sách giao dịch...</p>
            </div>
          ) : !transactionsData?.orders?.data?.length ? (
            <div className="py-16 text-center text-ink-400 space-y-2">
              <Receipt size={36} className="mx-auto text-ink-300 dark:text-ink-600" />
              <p className="text-sm font-bold text-ink-700 dark:text-cream-200">
                Không tìm thấy giao dịch nào
              </p>
              <p className="text-xs text-ink-400">Thử thay đổi điều kiện lọc hoặc đặt lại bộ lọc tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cream-200 dark:border-ink-800 bg-cream-50/60 dark:bg-ink-950/60 text-ink-500 dark:text-ink-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5">Mã Đơn</th>
                    <th className="py-3 px-3.5">Khách Hàng</th>
                    <th className="py-3 px-3.5">Thời Gian</th>
                    <th className="py-3 px-3.5">Số Tiền</th>
                    <th className="py-3 px-3.5">Cổng TT</th>
                    <th className="py-3 px-3.5">Trạng Thái TT</th>
                    <th className="py-3 px-3.5 text-right">Đối Soát COD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-ink-800">
                  {transactionsData.orders.data.map((order) => {
                    const stCfg = STATUS_CONFIG[order.payment_status] || {
                      label: order.payment_status,
                      color: 'text-ink-600',
                      bg: 'bg-cream-100 dark:bg-ink-800',
                      border: 'border-cream-300',
                    };
                    const gwCfg = GATEWAY_CONFIG[order.gateway] || {
                      label: order.gateway || 'COD',
                      badge: 'bg-cream-100 text-ink-700',
                    };

                    const isCod = order.gateway === 'cod';
                    const allowedTransitions = transactionsData?.codTransitions?.[order.payment_status] || [];
                    const canTransition = isCod && allowedTransitions.filter((t) => t !== order.payment_status).length > 0;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-cream-50/50 dark:hover:bg-ink-800/40 transition-colors"
                      >
                        {/* Order Code */}
                        <td className="py-3 px-3.5 font-bold text-ink-900 dark:text-cream-100">
                          #{order.order_code || order.id}
                        </td>

                        {/* Customer Info */}
                        <td className="py-3 px-3.5">
                          <p className="font-bold text-ink-900 dark:text-cream-100">
                            {order.customer_name || order.name || 'Khách vãng lai'}
                          </p>
                          <p className="text-[10px] text-ink-400 font-mono">
                            {order.customer_phone || order.phone || 'Chưa có SĐT'}
                          </p>
                        </td>

                        {/* Time */}
                        <td className="py-3 px-3.5 text-ink-600 dark:text-cream-300 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-3.5 font-extrabold text-ink-900 dark:text-cream-50 whitespace-nowrap">
                          {formatCurrency(order.total_amount || order.total_price || 0)}
                        </td>

                        {/* Gateway */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${gwCfg.badge}`}
                          >
                            {gwCfg.label}
                          </span>
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stCfg.bg} ${stCfg.color} ${stCfg.border}`}
                          >
                            {stCfg.label}
                          </span>
                        </td>

                        {/* Actions / COD Transition */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          {canTransition ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReconcile(order, allowedTransitions)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/60 border border-accent-200/90 dark:border-accent-800/80 hover:bg-accent-500 hover:text-white dark:hover:bg-accent-600 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
                              title="Mở bảng đối soát giao dịch COD"
                            >
                              <ArrowRightLeft size={13} className="text-accent-600 dark:text-accent-400 group-hover:text-white group-hover:rotate-180 transition-all duration-300" />
                              <span>Đối soát COD</span>
                            </button>
                          ) : isCod ? (
                            order.payment_status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs">
                                <CheckCircle2 size={11} className="text-emerald-500" />
                                Đã thu tiền COD
                              </span>
                            ) : order.payment_status === 'refunded' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60 shadow-2xs">
                                <ArrowRightLeft size={11} className="text-sky-500" />
                                Đã hoàn tiền
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-cream-100 dark:bg-ink-800 text-ink-500 dark:text-cream-400 border border-cream-200 dark:border-ink-700 shadow-2xs">
                                <CheckCircle2 size={11} className="text-ink-400" />
                                Đã kết thúc
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/50 shadow-2xs">
                              <Sparkles size={11} className="text-pink-500" />
                              Tự động MoMo
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {transactionsData && transactionsData.orders.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-cream-200 dark:border-ink-800 text-xs">
              <span className="text-ink-400">
                Hiển thị trang {transactionsData.orders.current_page} /{' '}
                {transactionsData.orders.last_page}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={transactionsData.orders.current_page <= 1}
                  onClick={() => handlePageChange(transactionsData.orders.current_page - 1)}
                  className="px-3 py-1.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-cream-50 dark:bg-ink-950 text-ink-700 dark:text-cream-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream-100 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={transactionsData.orders.current_page >= transactionsData.orders.last_page}
                  onClick={() => handlePageChange(transactionsData.orders.current_page + 1)}
                  className="px-3 py-1.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-cream-50 dark:bg-ink-950 text-ink-700 dark:text-cream-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream-100 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RECONCILIATION MODAL FOR COD STATUS UPDATE */}
      {reconcilingItem && (
        <div
          className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => !isUpdatingStatus && setReconcilingItem(null)}
        >
          <div
            className="bg-white dark:bg-ink-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-cream-200 dark:border-ink-800 cursor-default animate-scale-up space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-accent-100 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 flex items-center justify-center shadow-xs">
                  <ArrowRightLeft size={22} />
                </div>
                <div>
                  <h4 className="text-base font-bold font-display text-ink-900 dark:text-cream-50">
                    Đối soát thu hộ COD
                  </h4>
                  <p className="text-xs text-ink-400">
                    Mã đơn hàng:{' '}
                    <span className="font-mono font-bold text-ink-700 dark:text-cream-200">
                      #{reconcilingItem.order.order_code || reconcilingItem.order.id}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => setReconcilingItem(null)}
                className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 dark:hover:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors cursor-pointer"
                aria-label="Đóng bảng đối soát"
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Snapshot Card */}
            <div className="bg-cream-50 dark:bg-ink-950 p-4 rounded-2xl border border-cream-200 dark:border-ink-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Khách hàng:</span>
                <span className="font-bold text-ink-800 dark:text-cream-200">
                  {reconcilingItem.order.customer_name || reconcilingItem.order.name || 'Khách vãng lai'}
                  {(reconcilingItem.order.customer_phone || reconcilingItem.order.phone) && (
                    <span className="font-normal text-ink-400 font-mono ml-1.5">
                      ({reconcilingItem.order.customer_phone || reconcilingItem.order.phone})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Trạng thái hiện tại:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  {STATUS_CONFIG[reconcilingItem.order.payment_status]?.label || reconcilingItem.order.payment_status}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-cream-200 dark:border-ink-800">
                <span className="text-ink-500 font-medium">Số tiền COD cần thu:</span>
                <span className="text-base font-extrabold text-accent-600 dark:text-accent-400">
                  {formatCurrency(reconcilingItem.order.total_amount || reconcilingItem.order.total_price || 0)}
                </span>
              </div>
            </div>

            {/* Select Target Status */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-cream-400">
                Chọn kết quả đối soát thực tế:
              </label>
              <div className="space-y-2">
                {reconcilingItem.availableTargets.map((targetKey) => {
                  const isSelected = reconcilingItem.selectedTarget === targetKey;
                  const targetMeta = RECONCILE_STATUS_INFO[targetKey] || {
                    title: STATUS_CONFIG[targetKey]?.label || targetKey,
                    description: 'Cập nhật trạng thái thanh toán của đơn hàng này.',
                    icon: CheckCircle2,
                    accentColor: 'text-accent-600 dark:text-accent-400',
                    badgeText: 'Thay đổi',
                    borderActiveClass: 'border-accent-500 ring-2 ring-accent-500/20',
                    bgActiveClass: 'bg-accent-50/60 dark:bg-accent-950/40',
                  };
                  const TargetIcon = targetMeta.icon;

                  return (
                    <button
                      key={targetKey}
                      type="button"
                      onClick={() =>
                        setReconcilingItem((prev) =>
                          prev ? { ...prev, selectedTarget: targetKey } : null
                        )
                      }
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? `${targetMeta.borderActiveClass} ${targetMeta.bgActiveClass}`
                          : 'border-cream-200 dark:border-ink-800 hover:border-cream-300 dark:hover:border-ink-700 bg-white dark:bg-ink-900/60'
                      }`}
                    >
                      {/* Radio Circle or Indicator */}
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'border-accent-500 bg-accent-500 text-white'
                            : 'border-cream-300 dark:border-ink-700 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs ${
                              isSelected ? 'text-ink-900 dark:text-cream-50' : 'text-ink-800 dark:text-cream-200'
                            }`}
                          >
                            {targetMeta.title}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cream-100 dark:bg-ink-800 text-ink-500 dark:text-cream-400 border border-cream-200 dark:border-ink-700">
                            {targetMeta.badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-400 dark:text-ink-400 mt-0.5 leading-snug">
                          {targetMeta.description}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 p-1.5 rounded-xl ${
                          isSelected ? 'bg-white dark:bg-ink-800 shadow-2xs' : 'text-ink-300 dark:text-ink-600'
                        }`}
                      >
                        <TargetIcon size={16} className={targetMeta.accentColor} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <p className="text-[11px] text-ink-400 leading-relaxed bg-cream-50/50 dark:bg-ink-950/50 p-2.5 rounded-xl border border-cream-200/60 dark:border-ink-800/60">
              💡 <span className="font-semibold text-ink-600 dark:text-cream-300">Ghi chú kiểm toán:</span> Thay đổi này sẽ đồng bộ ngay với báo cáo tài chính và lưu lịch sử xử lý của Quản trị viên.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => setReconcilingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-ink-700 dark:text-cream-200 bg-cream-100 dark:bg-ink-800 hover:bg-cream-200 dark:hover:bg-ink-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus || !reconcilingItem.selectedTarget}
                onClick={handleConfirmReconciliation}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={13} className="animate-spin text-white" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                <span>Xác nhận đối soát</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
