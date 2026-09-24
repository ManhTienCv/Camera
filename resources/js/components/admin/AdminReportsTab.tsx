import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  BarChart3,
  Table as TableIcon,
  PieChart,
  Calendar,
  Loader2,
  RefreshCw,
  CreditCard,
  Sparkles,
  Database,
  Award,
  PackageCheck,
  ArrowUpRight,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { GlidingIndicator } from '../ui/GlidingIndicator';
import type { ReportSummaryData, ReportChartsData, TopSellingProductItem } from '../../types';

interface MiniPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemName?: string;
  onPageChange: (page: number) => void;
}

type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; jumpTo: number };

const getPaginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, i) => ({ type: 'page', page: i + 1 }));
  }

  const items: PaginationItem[] = [];

  // Luôn có trang 1
  items.push({ type: 'page', page: 1 });

  if (currentPage <= 2) {
    // Kiểu 1, 2, ... N
    items.push({ type: 'page', page: 2 });
    if (totalPages > 2) {
      const jumpTo = Math.min(totalPages - 1, Math.ceil((2 + totalPages) / 2));
      items.push({ type: 'ellipsis', jumpTo });
      items.push({ type: 'page', page: totalPages });
    }
    return items;
  }

  if (currentPage >= totalPages - 1) {
    // Kiểu 1, ... N-1, N
    const jumpTo = Math.max(2, Math.floor((1 + totalPages - 1) / 2));
    items.push({ type: 'ellipsis', jumpTo });
    items.push({ type: 'page', page: totalPages - 1 });
    items.push({ type: 'page', page: totalPages });
    return items;
  }

  // Ở giữa: 1, ..., current, ..., N
  const jumpLeft = Math.max(2, Math.floor((1 + currentPage) / 2));
  items.push({ type: 'ellipsis', jumpTo: jumpLeft });
  items.push({ type: 'page', page: currentPage });
  const jumpRight = Math.min(totalPages - 1, Math.ceil((currentPage + totalPages) / 2));
  items.push({ type: 'ellipsis', jumpTo: jumpRight });
  items.push({ type: 'page', page: totalPages });

  return items;
};

const MiniPagination: React.FC<MiniPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemName = 'mục',
  onPageChange,
}) => {
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  // Sinh danh sách trang rút gọn dạng 1, 2, ...
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div className="px-5 py-3 border-t border-cream-100 dark:border-ink-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-cream-50/40 dark:bg-ink-950/40 text-xs">
      <div className="text-ink-500 dark:text-ink-400 font-medium">
        Hiển thị <span className="font-semibold text-ink-800 dark:text-cream-200">{startIdx} - {endIdx}</span> trên <span className="font-semibold text-ink-800 dark:text-cream-200">{totalItems}</span> {itemName}
        {totalPages > 1 && (
          <span className="ml-1.5 text-ink-400 dark:text-ink-500">
            (Trang {currentPage}/{totalPages})
          </span>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-lg border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-600 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            title="Trang trước"
          >
            <ChevronLeft size={14} />
          </button>

          {paginationItems.map((item, idx) => {
            if (item.type === 'ellipsis') {
              return (
                <button
                  key={`ellipsis-${idx}`}
                  type="button"
                  onClick={() => onPageChange(item.jumpTo)}
                  className="min-w-[24px] h-6 px-1 rounded-lg text-xs font-bold text-ink-400 dark:text-ink-500 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors cursor-pointer select-none font-mono"
                  title={`Chuyển đến trang ${item.jumpTo}`}
                >
                  ...
                </button>
              );
            }

            const isActive = item.page === currentPage;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => onPageChange(item.page)}
                className={`min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                  isActive
                    ? 'bg-accent-500 text-white shadow-2xs'
                    : 'border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-600 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800'
                }`}
              >
                {item.page}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-lg border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-600 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            title="Trang sau"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        <span className="text-[11px] text-ink-400 dark:text-ink-500 font-medium">
          Đã hiển thị toàn bộ {totalItems} {itemName}
        </span>
      )}
    </div>
  );
};

export const AdminReportsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'tables' | 'charts'>('tables');
  const [dataMode, setDataMode] = useState<'mock' | 'real'>('mock');
  const [summaryData, setSummaryData] = useState<ReportSummaryData | null>(null);
  const [chartsData, setChartsData] = useState<ReportChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination states for tables
  const [dailyPage, setDailyPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [yearlyPage, setYearlyPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [topProductsPage, setTopProductsPage] = useState(1);

  // Page size constants
  const dailyPageSize = 7; // 1 week per page
  const monthlyPageSize = 6; // 6 months per page (half-year)
  const yearlyPageSize = 5;
  const categoryPageSize = 5;
  const topProductsPageSize = 5;

  const loadReportData = async (mode: 'mock' | 'real' = dataMode) => {
    setLoading(true);
    try {
      const params = mode === 'mock' ? { mock: true } : { real: true };
      const [summary, charts] = await Promise.all([
        api.getAdminReportSummary(params).catch(() => null),
        api.getAdminReportCharts(params).catch(() => null),
      ]);
      setSummaryData(summary);
      setChartsData(charts);
    } catch (err) {
      console.error('Lỗi tải dữ liệu báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData(dataMode);
  }, []);

  const handleModeChange = (newMode: 'mock' | 'real') => {
    if (newMode === dataMode && !loading) return;
    setDataMode(newMode);
    setDailyPage(1);
    setMonthlyPage(1);
    setYearlyPage(1);
    setCategoryPage(1);
    setTopProductsPage(1);
    loadReportData(newMode);
  };

  if (loading && !summaryData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center text-ink-400 dark:text-ink-500">
        <Loader2 size={32} className="animate-spin text-accent-500 mb-3" />
        <p className="text-sm font-medium">Đang tổng hợp báo cáo doanh thu và chỉ số kinh doanh...</p>
      </div>
    );
  }

  const {
    totalOrders = 0,
    totalCustomers = 0,
    totalRevenue = 0,
    categoryRevenue = [],
    revenueByDate = [],
    revenueByMonth = [],
    revenueByYear = [],
    topSellingProducts = [],
    isMock = dataMode === 'mock',
  } = summaryData || {};

  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Pagination calculation
  const dailyTotalPages = Math.max(1, Math.ceil(revenueByDate.length / dailyPageSize));
  const paginatedDaily = revenueByDate.slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize);

  const monthlyTotalPages = Math.max(1, Math.ceil(revenueByMonth.length / monthlyPageSize));
  const paginatedMonthly = revenueByMonth.slice((monthlyPage - 1) * monthlyPageSize, monthlyPage * monthlyPageSize);

  const yearlyTotalPages = Math.max(1, Math.ceil(revenueByYear.length / yearlyPageSize));
  const paginatedYearly = revenueByYear.slice((yearlyPage - 1) * yearlyPageSize, yearlyPage * yearlyPageSize);

  const categoryTotalPages = Math.max(1, Math.ceil(categoryRevenue.length / categoryPageSize));
  const paginatedCategory = categoryRevenue.slice((categoryPage - 1) * categoryPageSize, categoryPage * categoryPageSize);

  const topProductsTotalPages = Math.max(1, Math.ceil(topSellingProducts.length / topProductsPageSize));
  const paginatedTopProducts = topSellingProducts.slice((topProductsPage - 1) * topProductsPageSize, topProductsPage * topProductsPageSize);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-2xl font-display font-bold text-ink-900 dark:text-cream-50">
              Báo cáo & Phân tích Doanh thu
            </h3>
            {isMock ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 flex items-center gap-1">
                <Sparkles size={11} /> Dữ liệu giả định
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 flex items-center gap-1">
                <Database size={11} /> Dữ liệu CSDL
              </span>
            )}
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Tổng hợp đơn hàng đã thu tiền, doanh số theo danh mục, chu kỳ thời gian và top sản phẩm bán chạy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher: Giả định vs Thực tế */}
          <div className="relative bg-cream-200/60 dark:bg-ink-800 p-1 rounded-2xl flex items-center gap-1 border border-cream-200 dark:border-ink-700 shadow-2xs" role="tablist" aria-label="Chế độ dữ liệu báo cáo">
            <button
              role="tab"
              aria-selected={dataMode === 'mock'}
              onClick={() => handleModeChange('mock')}
              disabled={loading}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none outline-none ${
                dataMode === 'mock'
                  ? 'text-white'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
              }`}
              title="Xem dữ liệu mô phỏng phong phú cho báo cáo"
            >
              {dataMode === 'mock' && (
                <GlidingIndicator
                  layoutId="admin-reports-mode-pill"
                  className="inset-0 bg-amber-500 rounded-xl shadow-xs"
                />
              )}
              <Sparkles size={13} className="relative z-10" />
              <span className="relative z-10">Dữ liệu giả định</span>
            </button>
            <button
              role="tab"
              aria-selected={dataMode === 'real'}
              onClick={() => handleModeChange('real')}
              disabled={loading}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none outline-none ${
                dataMode === 'real'
                  ? 'text-white'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
              }`}
              title="Lấy số liệu thực tế đã đặt trong cơ sở dữ liệu"
            >
              {dataMode === 'real' && (
                <GlidingIndicator
                  layoutId="admin-reports-mode-pill"
                  className="inset-0 bg-ink-900 dark:bg-accent-600 rounded-xl shadow-xs"
                />
              )}
              <Database size={13} className="relative z-10" />
              <span className="relative z-10">Dữ liệu thực tế</span>
            </button>
          </div>

          {/* Sub-tab toggle buttons */}
          <div className="relative bg-cream-200/60 dark:bg-ink-800 p-1 rounded-2xl flex items-center gap-1 border border-cream-200 dark:border-ink-700 shadow-2xs" role="tablist" aria-label="Dạng xem báo cáo">
            <button
              role="tab"
              aria-selected={subTab === 'tables'}
              onClick={() => setSubTab('tables')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer select-none outline-none ${
                subTab === 'tables'
                  ? 'text-ink-900 dark:text-cream-50'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              {subTab === 'tables' && (
                <GlidingIndicator
                  layoutId="admin-reports-view-pill"
                  className="inset-0 bg-white dark:bg-ink-900 rounded-xl shadow-xs"
                />
              )}
              <TableIcon size={14} className="relative z-10" />
              <span className="relative z-10">Bảng số liệu</span>
            </button>
            <button
              role="tab"
              aria-selected={subTab === 'charts'}
              onClick={() => setSubTab('charts')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer select-none outline-none ${
                subTab === 'charts'
                  ? 'text-ink-900 dark:text-cream-50'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              {subTab === 'charts' && (
                <GlidingIndicator
                  layoutId="admin-reports-view-pill"
                  className="inset-0 bg-white dark:bg-ink-900 rounded-xl shadow-xs"
                />
              )}
              <BarChart3 size={14} className="relative z-10" />
              <span className="relative z-10">Biểu đồ trực quan</span>
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => loadReportData(dataMode)}
            disabled={loading}
            className="p-2 bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 rounded-xl hover:bg-cream-50 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Làm mới số liệu"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Mode Banner / Notice */}
      {dataMode === 'mock' ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 dark:border-amber-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">
                Đang hiển thị Dữ liệu Giả định (Mô phỏng 30 ngày & 12 tháng)
              </p>
              <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Các số liệu về doanh số, số đơn hàng và sản phẩm bán chạy được mô phỏng trực quan chuẩn quy mô phân phối máy ảnh CameraHub.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleModeChange('real')}
            className="font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 cursor-pointer flex items-center gap-1"
          >
            Chuyển sang dữ liệu thực tế <ArrowUpRight size={13} />
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/25 dark:border-blue-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-blue-900 dark:text-blue-200 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Database size={16} />
            </div>
            <div>
              <p className="font-bold text-blue-950 dark:text-blue-100">
                Đang hiển thị Dữ liệu Thực tế CSDL
              </p>
              <p className="text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                Số liệu được tính toán dựa trên các đơn hàng có trạng thái thanh toán hợp lệ trong hệ thống cơ sở dữ liệu hiện tại.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleModeChange('mock')}
            className="font-bold text-blue-800 dark:text-blue-300 hover:underline shrink-0 cursor-pointer flex items-center gap-1"
          >
            Quay lại dữ liệu giả định <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs flex items-center justify-between transition-all">
          <div>
            <p className="text-xs font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Tổng số đơn hàng</p>
            <h4 className="text-2xl font-display font-bold text-ink-900 dark:text-cream-50 mt-1">
              {totalOrders.toLocaleString('vi-VN')}
            </h4>
            <span className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 inline-block">
              {isMock ? '+14.2% so với tháng trước' : 'Đơn hàng trong CSDL'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingCart size={22} />
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs flex items-center justify-between transition-all">
          <div>
            <p className="text-xs font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Tổng số khách hàng</p>
            <h4 className="text-2xl font-display font-bold text-ink-900 dark:text-cream-50 mt-1">
              {totalCustomers.toLocaleString('vi-VN')}
            </h4>
            <span className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 inline-block">
              {isMock ? '+8 tài khoản mới trong tuần' : 'Tài khoản người dùng'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs flex items-center justify-between transition-all">
          <div>
            <p className="text-xs font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Tổng doanh thu</p>
            <h4 className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalRevenue)}
            </h4>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 inline-block">
              {isMock ? '+18.4% tăng trưởng YoY' : 'Đơn đã hoàn tất thanh toán'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-ink-900 p-5 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs flex items-center justify-between transition-all">
          <div>
            <p className="text-xs font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Giá trị trung bình/đơn</p>
            <h4 className="text-2xl font-display font-bold text-accent-600 dark:text-accent-400 mt-1">
              {formatCurrency(averageOrderValue)}
            </h4>
            <span className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 inline-block">AOV bình quân mỗi giỏ hàng</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* VIEW 1: DATA TABLES */}
      {subTab === 'tables' && (
        <div className="space-y-6">
          {/* Top Selling Products Card */}
          {topSellingProducts && topSellingProducts.length > 0 && (
            <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-cream-100 dark:border-ink-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-ink-900 dark:text-cream-50 flex items-center gap-2">
                    <Award size={18} className="text-amber-500" />
                    Top 5 Sản phẩm Bán chạy nhất
                  </h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                    Xếp hạng sản phẩm có lượt bán và doanh thu cao nhất của CameraHub.
                  </p>
                </div>
                <span className="text-xs font-bold text-ink-500 dark:text-ink-400 bg-cream-100 dark:bg-ink-800 px-2.5 py-1 rounded-xl">
                  {topSellingProducts.length} sản phẩm dẫn đầu
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-cream-50 dark:bg-ink-800/60 border-b border-cream-200 dark:border-ink-800 text-xs font-bold text-ink-600 dark:text-ink-300 uppercase">
                      <th className="py-3.5 px-6 w-16 text-center">Hạng</th>
                      <th className="py-3.5 px-6">Sản phẩm</th>
                      <th className="py-3.5 px-6 text-right">Đơn giá niêm yết</th>
                      <th className="py-3.5 px-6 text-right">Đã bán</th>
                      <th className="py-3.5 px-6 text-right">Tổng doanh số</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100 dark:divide-ink-800">
                    {paginatedTopProducts.map((p, idx) => {
                      const absoluteRank = (topProductsPage - 1) * topProductsPageSize + idx;
                      const medalBg =
                        absoluteRank === 0
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300'
                          : absoluteRank === 1
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                          : absoluteRank === 2
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300'
                          : 'bg-cream-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400 border-cream-200';

                      return (
                        <tr key={p.id || idx} className="hover:bg-cream-50/50 dark:hover:bg-ink-800/40 transition-colors">
                          <td className="py-3.5 px-6 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-bold border ${medalBg}`}>
                              #{absoluteRank + 1}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-cream-200 dark:border-ink-700 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-cream-100 dark:bg-ink-800 flex items-center justify-center text-ink-400 shrink-0">
                                  <PackageCheck size={18} />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-ink-900 dark:text-cream-50 leading-tight">
                                  {p.name}
                                </p>
                                <span className="text-[11px] text-ink-400 dark:text-ink-500 font-mono">Mã SP: #{p.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-right font-mono text-ink-700 dark:text-ink-300">
                            {formatCurrency(p.price)}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <span className="font-bold text-ink-900 dark:text-cream-50 font-mono">
                              {p.sold_qty.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-xs text-ink-400 ml-1">máy</span>
                          </td>
                          <td className="py-3.5 px-6 text-right font-bold text-accent-600 dark:text-accent-400 font-mono">
                            {formatCurrency(p.total_revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <MiniPagination
                currentPage={topProductsPage}
                totalPages={topProductsTotalPages}
                totalItems={topSellingProducts.length}
                pageSize={topProductsPageSize}
                itemName="sản phẩm"
                onPageChange={setTopProductsPage}
              />
            </div>
          )}

          {/* Category Revenue Table */}
          <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-cream-100 dark:border-ink-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">Doanh thu theo danh mục sản phẩm</h4>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                  Tính theo giá trị sản phẩm khi khách đặt mua, không tính phí vận chuyển.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-cream-50 dark:bg-ink-800/60 border-b border-cream-200 dark:border-ink-800 text-xs font-bold text-ink-600 dark:text-ink-300 uppercase">
                    <th className="py-3.5 px-6">Danh mục</th>
                    <th className="py-3.5 px-6 text-right">Số lượng bán</th>
                    <th className="py-3.5 px-6 text-right">Doanh thu</th>
                    <th className="py-3.5 px-6 text-right">Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-ink-800">
                  {categoryRevenue.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-ink-400 dark:text-ink-500 text-xs">
                        Chưa có doanh thu phát sinh theo danh mục.
                      </td>
                    </tr>
                  ) : (
                    paginatedCategory.map((item, idx) => {
                      const totalCatRev = categoryRevenue.reduce((acc, cur) => acc + (cur.total_revenue || 0), 0);
                      const sharePct = totalCatRev > 0 ? Math.round((item.total_revenue / totalCatRev) * 100) : 0;

                      return (
                        <tr key={idx} className="hover:bg-cream-50/50 dark:hover:bg-ink-800/40 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-ink-900 dark:text-cream-50">
                            {item.category_name || `Danh mục #${item.category_id}`}
                          </td>
                          <td className="py-3.5 px-6 text-right font-mono text-ink-700 dark:text-ink-300">
                            {item.total_qty.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-6 text-right font-bold text-accent-600 dark:text-accent-400 font-mono">
                            {formatCurrency(item.total_revenue)}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cream-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 font-mono">
                              {sharePct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <MiniPagination
              currentPage={categoryPage}
              totalPages={categoryTotalPages}
              totalItems={categoryRevenue.length}
              pageSize={categoryPageSize}
              itemName="danh mục"
              onPageChange={setCategoryPage}
            />
          </div>

          {/* Daily Revenue Table with Mini Pagination */}
          <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-cream-100 dark:border-ink-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">Doanh thu theo ngày (30 ngày gần nhất)</h4>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Biến động doanh thu và lượng đơn thanh toán mỗi ngày (7 ngày / trang)</p>
              </div>
              <span className="text-xs font-bold text-ink-500 dark:text-ink-400 bg-cream-100 dark:bg-ink-800 px-2.5 py-1 rounded-xl">
                Trang {dailyPage} / {dailyTotalPages}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-cream-50 dark:bg-ink-800/60 border-b border-cream-200 dark:border-ink-800 text-xs font-bold text-ink-600 dark:text-ink-300 uppercase">
                    <th className="py-3 px-6">Ngày</th>
                    <th className="py-3 px-6 text-right">Số đơn đã thanh toán</th>
                    <th className="py-3 px-6 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-ink-800">
                  {revenueByDate.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-ink-400 dark:text-ink-500 text-xs">
                        Chưa có doanh thu theo ngày.
                      </td>
                    </tr>
                  ) : (
                    paginatedDaily.map((row, idx) => (
                      <tr key={idx} className="hover:bg-cream-50/50 dark:hover:bg-ink-800/40 transition-colors">
                        <td className="py-3 px-6 font-mono text-ink-700 dark:text-ink-300">{row.date}</td>
                        <td className="py-3 px-6 text-right font-bold">
                          <span className="px-2.5 py-0.5 rounded-full bg-cream-100 dark:bg-ink-800 text-ink-800 dark:text-ink-200 text-xs font-mono">
                            {row.order_count} đơn
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(row.total_revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <MiniPagination
              currentPage={dailyPage}
              totalPages={dailyTotalPages}
              totalItems={revenueByDate.length}
              pageSize={dailyPageSize}
              itemName="ngày"
              onPageChange={setDailyPage}
            />
          </div>

          {/* Monthly & Yearly Revenue Tables Grid with Mini Pagination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly */}
            <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-cream-100 dark:border-ink-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">Doanh thu theo tháng</h4>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">12 tháng gần nhất (6 tháng / trang)</p>
                  </div>
                  <span className="text-xs font-bold text-ink-500 dark:text-ink-400 bg-cream-100 dark:bg-ink-800 px-2 py-0.5 rounded-lg">
                    {monthlyPage}/{monthlyTotalPages}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-cream-50 dark:bg-ink-800/60 border-b border-cream-200 dark:border-ink-800 text-xs font-bold text-ink-600 dark:text-ink-300 uppercase">
                        <th className="py-3 px-5">Tháng</th>
                        <th className="py-3 px-5 text-right">Số đơn</th>
                        <th className="py-3 px-5 text-right">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100 dark:divide-ink-800">
                      {revenueByMonth.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-ink-400 dark:text-ink-500 text-xs">
                            Chưa có dữ liệu.
                          </td>
                        </tr>
                      ) : (
                        paginatedMonthly.map((m, idx) => (
                          <tr key={idx} className="hover:bg-cream-50/50 dark:hover:bg-ink-800/40 transition-colors">
                            <td className="py-3 px-5 font-mono text-ink-700 dark:text-ink-300">{m.month}</td>
                            <td className="py-3 px-5 text-right font-semibold text-ink-800 dark:text-ink-200 font-mono">
                              {m.order_count}
                            </td>
                            <td className="py-3 px-5 text-right font-bold text-accent-600 dark:text-accent-400 font-mono">
                              {formatCurrency(m.total_revenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <MiniPagination
                currentPage={monthlyPage}
                totalPages={monthlyTotalPages}
                totalItems={revenueByMonth.length}
                pageSize={monthlyPageSize}
                itemName="tháng"
                onPageChange={setMonthlyPage}
              />
            </div>

            {/* Yearly */}
            <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-cream-100 dark:border-ink-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">Doanh thu theo năm</h4>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Tổng kết lũy kế theo từng năm tài chính</p>
                  </div>
                  <span className="text-xs font-bold text-ink-500 dark:text-ink-400 bg-cream-100 dark:bg-ink-800 px-2 py-0.5 rounded-lg">
                    {revenueByYear.length} năm
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-cream-50 dark:bg-ink-800/60 border-b border-cream-200 dark:border-ink-800 text-xs font-bold text-ink-600 dark:text-ink-300 uppercase">
                        <th className="py-3 px-5">Năm</th>
                        <th className="py-3 px-5 text-right">Số đơn</th>
                        <th className="py-3 px-5 text-right">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100 dark:divide-ink-800">
                      {revenueByYear.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-ink-400 dark:text-ink-500 text-xs">
                            Chưa có dữ liệu.
                          </td>
                        </tr>
                      ) : (
                        paginatedYearly.map((y, idx) => (
                          <tr key={idx} className="hover:bg-cream-50/50 dark:hover:bg-ink-800/40 transition-colors">
                            <td className="py-3 px-5 font-mono font-bold text-ink-800 dark:text-cream-50">{y.year}</td>
                            <td className="py-3 px-5 text-right font-semibold text-ink-800 dark:text-ink-200 font-mono">
                              {y.order_count}
                            </td>
                            <td className="py-3 px-5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {formatCurrency(y.total_revenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <MiniPagination
                currentPage={yearlyPage}
                totalPages={yearlyTotalPages}
                totalItems={revenueByYear.length}
                pageSize={yearlyPageSize}
                itemName="năm"
                onPageChange={setYearlyPage}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CHARTS (5 Charts required by Lab 08) */}
      {subTab === 'charts' && chartsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Doanh thu theo danh mục (Bar chart) */}
            <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">1. Doanh thu theo danh mục</h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Tỷ trọng doanh số từng phân khúc sản phẩm</p>
                </div>
                <span className="text-xs text-ink-400 dark:text-ink-500 font-medium">Biểu đồ cột ngang</span>
              </div>
              <div className="space-y-3 pt-2">
                {chartsData.catLabels.map((lbl, idx) => {
                  const rev = chartsData.catRevenue[idx] || 0;
                  const maxRev = Math.max(...chartsData.catRevenue, 1);
                  const pct = Math.round((rev / maxRev) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-ink-800 dark:text-ink-200 truncate max-w-[200px]">{lbl}</span>
                        <span className="text-accent-600 dark:text-accent-400 font-mono">{formatCurrency(rev)}</span>
                      </div>
                      <div className="w-full h-3 bg-cream-100 dark:bg-ink-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-500 dark:bg-accent-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Doanh thu theo ngày 30 ngày (Bar/Line visual) */}
            <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">2. Doanh thu 30 ngày gần nhất</h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Biểu đồ xung nhịp kinh doanh theo ngày</p>
                </div>
                <span className="text-xs text-ink-400 dark:text-ink-500 font-medium">Xu hướng 30 ngày</span>
              </div>
              <div className="h-48 flex items-end gap-1 pt-6 px-1 border-b border-cream-200 dark:border-ink-800">
                {chartsData.revDateData.map((val, idx) => {
                  const maxVal = Math.max(...chartsData.revDateData, 1);
                  const hPct = Math.max(Math.round((val / maxVal) * 100), 4);
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-ink-900 dark:bg-ink-800 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap z-20 shadow-lg pointer-events-none border border-ink-700">
                        <p className="font-bold text-cream-100">Ngày {chartsData.revDateLabels[idx]}</p>
                        <p className="text-emerald-400 font-mono">{formatCurrency(val)}</p>
                      </div>
                      <div
                        className="w-full bg-blue-400 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 rounded-t-sm transition-all"
                        style={{ height: `${hPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-ink-400 dark:text-ink-500 font-mono">
                <span>{chartsData.revDateLabels[0]}</span>
                <span>{chartsData.revDateLabels[Math.floor(chartsData.revDateLabels.length / 2)]}</span>
                <span>{chartsData.revDateLabels[chartsData.revDateLabels.length - 1]}</span>
              </div>
            </div>

            {/* Chart 3: Doanh thu theo tháng 12 tháng */}
            <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">3. Doanh thu theo tháng (12 tháng)</h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Tiến trình tăng trưởng doanh số theo tháng</p>
                </div>
                <span className="text-xs text-ink-400 dark:text-ink-500 font-medium">Chu kỳ tháng</span>
              </div>
              <div className="h-48 flex items-end gap-2 pt-6 px-1 border-b border-cream-200 dark:border-ink-800">
                {chartsData.revMonthData.map((val, idx) => {
                  const maxVal = Math.max(...chartsData.revMonthData, 1);
                  const hPct = Math.max(Math.round((val / maxVal) * 100), 4);
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    >
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-ink-900 dark:bg-ink-800 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap z-20 shadow-lg pointer-events-none border border-ink-700">
                        <p className="font-bold text-cream-100">Tháng {chartsData.revMonthLabels[idx]}</p>
                        <p className="text-emerald-400 font-mono">{formatCurrency(val)}</p>
                      </div>
                      <div
                        className="w-full bg-emerald-400 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 rounded-t-md transition-all"
                        style={{ height: `${hPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-ink-400 dark:text-ink-500 font-mono">
                <span>{chartsData.revMonthLabels[0]}</span>
                <span>{chartsData.revMonthLabels[chartsData.revMonthLabels.length - 1]}</span>
              </div>
            </div>

            {/* Chart 4: Doanh thu theo năm */}
            <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">4. Doanh thu theo từng năm</h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">So sánh tổng kết quy mô tài chính qua các năm</p>
                </div>
                <span className="text-xs text-ink-400 dark:text-ink-500 font-medium">Quy mô năm</span>
              </div>
              <div className="space-y-3 pt-2">
                {chartsData.revYearLabels.map((lbl, idx) => {
                  const rev = chartsData.revYearData[idx] || 0;
                  const maxRev = Math.max(...chartsData.revYearData, 1);
                  const pct = Math.round((rev / maxRev) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-ink-900 dark:text-cream-50 font-bold">Năm {lbl}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(rev)}</span>
                      </div>
                      <div className="w-full h-3 bg-cream-100 dark:bg-ink-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart 5: Doanh thu theo phương thức thanh toán MoMo vs COD */}
          <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-ink-900 dark:text-cream-50">
                  5. Doanh thu theo phương thức thanh toán (MoMo vs COD vs VietQR)
                </h4>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Tỷ trọng đóng góp dòng tiền của từng cổng thanh toán</p>
              </div>
              <CreditCard size={20} className="text-accent-500 dark:text-accent-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {chartsData.paymentMethodLabels.map((method, idx) => {
                const rev = chartsData.paymentMethodRevenue[idx] || 0;
                const totalM = chartsData.paymentMethodRevenue.reduce((a, b) => a + b, 0);
                const pct = totalM > 0 ? Math.round((rev / totalM) * 100) : 0;
                const isMomo = method.toLowerCase().includes('momo');
                const isCod = method.toLowerCase().includes('tiền mặt') || method.toLowerCase().includes('cod');

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isMomo
                        ? 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/40'
                        : isCod
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink-800 dark:text-cream-100">{method}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-ink-800 text-ink-800 dark:text-ink-200 shadow-2xs font-mono">
                        {pct}%
                      </span>
                    </div>
                    <p className="text-lg font-bold text-ink-900 dark:text-cream-50 mt-2 font-mono">
                      {formatCurrency(rev)}
                    </p>
                    <div className="w-full h-1.5 bg-white/80 dark:bg-ink-800 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full ${
                          isMomo ? 'bg-pink-500' : isCod ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
