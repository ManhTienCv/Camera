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
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
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

  // Modal / Confirm state for updating COD status
  const [updatingItem, setUpdatingItem] = useState<{
    item: FinanceTransactionItem;
    targetStatus: string;
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

  // Submit COD status transition
  const handleConfirmStatusUpdate = async () => {
    if (!updatingItem) return;
    setIsUpdatingStatus(true);
    const { item, targetStatus } = updatingItem;

    try {
      await api.updateAdminFinanceStatus(item.id, {
        payment_status: targetStatus,
        current_payment_status: item.payment_status,
        current_order_status: item.order_status || item.status,
        current_payment_id: item.payment_id || 0,
      });

      toast.success(
        `Đã cập nhật trạng thái đơn #${item.order_code || item.id} thành "${
          STATUS_CONFIG[targetStatus]?.label || targetStatus
        }".`
      );
      setUpdatingItem(null);
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
          <div className="bg-cream-100 dark:bg-ink-950 p-1.5 rounded-2xl flex items-center gap-1 border border-cream-200 dark:border-ink-800">
            <button
              onClick={() => setSubTab('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'summary'
                  ? 'bg-accent-500 text-white shadow-xs'
                  : 'text-ink-600 dark:text-cream-300 hover:text-ink-900 dark:hover:text-cream-100'
              }`}
            >
              <TrendingUp size={15} />
              <span>Thống kê tổng quan</span>
            </button>
            <button
              onClick={() => setSubTab('transactions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'transactions'
                  ? 'bg-accent-500 text-white shadow-xs'
                  : 'text-ink-600 dark:text-cream-300 hover:text-ink-900 dark:hover:text-cream-100'
              }`}
            >
              <Receipt size={15} />
              <span>Chi tiết giao dịch & COD</span>
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
              {/* Hero Overview Card */}
              <div className="bg-gradient-to-br from-ink-900 to-ink-950 text-white p-6 sm:p-8 rounded-3xl border border-ink-800 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                  <div className="lg:col-span-7 space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      <CircleDollarSign size={14} />
                      Tổng Doanh Thu Đơn Hàng Theo Bộ Lọc
                    </span>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white">
                      {formatCurrency(summaryData?.summary?.total_amount || 0)}
                    </h1>
                    <p className="text-xs text-ink-300 max-w-lg leading-relaxed">
                      Bao gồm toàn bộ các đơn hàng phù hợp với điều kiện tìm kiếm và khoảng thời gian đã chọn.
                    </p>
                  </div>

                  <div className="lg:col-span-5 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-ink-800 pt-4 lg:pt-0 lg:pl-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
                        <Receipt size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-ink-400 block font-medium">Tổng số đơn hàng ghi nhận</span>
                        <span className="text-2xl font-bold font-display text-white">
                          {summaryData?.summary?.order_count || 0} đơn
                        </span>
                        <span className="text-[11px] text-accent-400 block mt-0.5">
                          ✓ Mỗi đơn được tính duy nhất 1 lần
                        </span>
                      </div>
                    </div>

                    {/* Breakdown by Payment Gateway */}
                    <div className="pt-2 grid grid-cols-2 gap-2 border-t border-ink-800/80">
                      <div className="bg-ink-800/60 p-2.5 rounded-xl border border-ink-700/60">
                        <span className="text-[10px] text-ink-400 block uppercase font-bold">Thu qua COD</span>
                        <p className="text-xs font-bold text-amber-300 truncate">
                          {formatCurrency(summaryData?.methodTotals?.cod?.total_amount || 0)}
                        </p>
                        <span className="text-[10px] text-ink-400">
                          {summaryData?.methodTotals?.cod?.order_count || 0} đơn
                        </span>
                      </div>
                      <div className="bg-ink-800/60 p-2.5 rounded-xl border border-ink-700/60">
                        <span className="text-[10px] text-ink-400 block uppercase font-bold">Thu qua MoMo</span>
                        <p className="text-xs font-bold text-pink-300 truncate">
                          {formatCurrency(summaryData?.methodTotals?.momo?.total_amount || 0)}
                        </p>
                        <span className="text-[10px] text-ink-400">
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
                            <div className="inline-flex items-center gap-1.5">
                              {allowedTransitions
                                .filter((t) => t !== order.payment_status)
                                .map((targetSt) => {
                                  const targetCfg = STATUS_CONFIG[targetSt];
                                  return (
                                    <button
                                      key={targetSt}
                                      type="button"
                                      onClick={() =>
                                        setUpdatingItem({
                                          item: order,
                                          targetStatus: targetSt,
                                        })
                                      }
                                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-accent-50 dark:bg-accent-950/60 text-accent-700 dark:text-accent-400 border border-accent-200 dark:border-accent-800/80 hover:bg-accent-100 dark:hover:bg-accent-900/60 transition-all cursor-pointer shadow-2xs"
                                    >
                                      → {targetCfg?.label || targetSt}
                                    </button>
                                  );
                                })}
                            </div>
                          ) : isCod ? (
                            <span className="text-[10px] text-ink-400 font-medium">Đã kết thúc</span>
                          ) : (
                            <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
                              Tự động qua MoMo
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

      {/* CONFIRMATION MODAL FOR COD STATUS UPDATE */}
      {updatingItem && (
        <div
          className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => !isUpdatingStatus && setUpdatingItem(null)}
        >
          <div
            className="bg-white dark:bg-ink-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-cream-200 dark:border-ink-800 cursor-default animate-scale-up space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-100 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 flex items-center justify-center shadow-xs">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold font-display text-ink-900 dark:text-cream-50">
                  Xác nhận chuyển trạng thái COD?
                </h4>
                <p className="text-xs text-ink-400">
                  Đơn hàng: #{updatingItem.item.order_code || updatingItem.item.id}
                </p>
              </div>
            </div>

            <div className="bg-cream-50 dark:bg-ink-950 p-3.5 rounded-2xl border border-cream-200 dark:border-ink-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Trạng thái hiện tại:</span>
                <span className="font-bold text-ink-800 dark:text-cream-200">
                  {STATUS_CONFIG[updatingItem.item.payment_status]?.label || updatingItem.item.payment_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Chuyển sang:</span>
                <span className="font-bold text-accent-600 dark:text-accent-400">
                  {STATUS_CONFIG[updatingItem.targetStatus]?.label || updatingItem.targetStatus}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-cream-200 dark:border-ink-800">
                <span className="text-ink-400">Số tiền đơn hàng:</span>
                <span className="font-extrabold text-ink-900 dark:text-cream-50">
                  {formatCurrency(updatingItem.item.total_amount || updatingItem.item.total_price || 0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-ink-400 leading-relaxed">
              Lưu ý: Hành động này sẽ được ghi nhận vào lịch sử giao dịch đối soát của Quản trị viên.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => setUpdatingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-ink-700 dark:text-cream-200 bg-cream-100 dark:bg-ink-800 hover:bg-cream-200 dark:hover:bg-ink-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleConfirmStatusUpdate}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <Loader2 size={13} className="animate-spin text-white" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                <span>Xác nhận lưu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
