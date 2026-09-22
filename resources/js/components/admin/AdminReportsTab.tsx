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
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import type { ReportSummaryData, ReportChartsData } from '../../types';

export const AdminReportsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'tables' | 'charts'>('tables');
  const [summaryData, setSummaryData] = useState<ReportSummaryData | null>(null);
  const [chartsData, setChartsData] = useState<ReportChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [summary, charts] = await Promise.all([
        api.getAdminReportSummary().catch(() => null),
        api.getAdminReportCharts().catch(() => null),
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
    loadReportData();
  }, []);

  if (loading && !summaryData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center text-ink-400">
        <Loader2 size={32} className="animate-spin text-accent-500 mb-3" />
        <p className="text-sm font-medium">Đang tổng hợp báo cáo doanh thu và đơn hàng...</p>
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
  } = summaryData || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-display font-bold text-ink-900">Báo cáo & Phân tích Doanh thu</h3>
          <p className="text-sm text-ink-500 mt-1">
            Tổng hợp đơn hàng đã thu tiền, doanh số theo danh mục và chu kỳ thời gian (Tuân thủ đặc tả Lab 08).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab toggle buttons */}
          <div className="bg-cream-200/60 p-1 rounded-2xl flex items-center gap-1 border border-cream-200">
            <button
              onClick={() => setSubTab('tables')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'tables'
                  ? 'bg-white text-ink-900 shadow-xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <TableIcon size={14} />
              <span>Bảng số liệu</span>
            </button>
            <button
              onClick={() => setSubTab('charts')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'charts'
                  ? 'bg-white text-ink-900 shadow-xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <BarChart3 size={14} />
              <span>Biểu đồ trực quan</span>
            </button>
          </div>

          <button
            onClick={loadReportData}
            disabled={loading}
            className="p-2 bg-white border border-cream-200 rounded-xl hover:bg-cream-50 text-ink-600 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Làm mới số liệu"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">Tổng số đơn hàng</p>
            <h4 className="text-2xl font-display font-bold text-ink-900 mt-1">
              {totalOrders.toLocaleString('vi-VN')}
            </h4>
            <span className="text-[11px] text-ink-500 mt-0.5 inline-block">Đơn hàng trong CSDL</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">Tổng số khách hàng</p>
            <h4 className="text-2xl font-display font-bold text-ink-900 mt-1">
              {totalCustomers.toLocaleString('vi-VN')}
            </h4>
            <span className="text-[11px] text-ink-500 mt-0.5 inline-block">Tài khoản người dùng</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">Tổng doanh thu thực tế</p>
            <h4 className="text-2xl font-display font-bold text-emerald-600 mt-1">
              {formatCurrency(totalRevenue)}
            </h4>
            <span className="text-[11px] text-emerald-700/80 mt-0.5 inline-block">Bao gồm phí vận chuyển</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* VIEW 1: DATA TABLES */}
      {subTab === 'tables' && (
        <div className="space-y-6">
          {/* Category Revenue Table */}
          <div className="bg-white rounded-3xl border border-cream-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-cream-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-ink-900">Doanh thu theo danh mục sản phẩm</h4>
                <p className="text-xs text-ink-500 mt-0.5">
                  Tính theo giá trị sản phẩm khi khách đặt mua, không tính phí vận chuyển.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200 text-xs font-bold text-ink-600 uppercase">
                    <th className="py-3.5 px-6">Danh mục</th>
                    <th className="py-3.5 px-6 text-right">Số lượng bán</th>
                    <th className="py-3.5 px-6 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {categoryRevenue.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-ink-400 text-xs">
                        Chưa có doanh thu phát sinh theo danh mục.
                      </td>
                    </tr>
                  ) : (
                    categoryRevenue.map((item, idx) => (
                      <tr key={idx} className="hover:bg-cream-50/50">
                        <td className="py-3.5 px-6 font-semibold text-ink-900">
                          {item.category_name || `Danh mục #${item.category_id}`}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-ink-700">
                          {item.total_qty.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-6 text-right font-bold text-accent-600">
                          {formatCurrency(item.total_revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Revenue Table */}
          <div className="bg-white rounded-3xl border border-cream-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-cream-100">
              <h4 className="font-bold text-base text-ink-900">Doanh thu theo ngày (30 ngày gần nhất)</h4>
            </div>
            <div className="overflow-x-auto max-h-[340px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-cream-50 z-10">
                  <tr className="border-b border-cream-200 text-xs font-bold text-ink-600 uppercase">
                    <th className="py-3 px-6">Ngày</th>
                    <th className="py-3 px-6 text-right">Số đơn đã thanh toán</th>
                    <th className="py-3 px-6 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {revenueByDate.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-ink-400 text-xs">
                        Chưa có doanh thu theo ngày.
                      </td>
                    </tr>
                  ) : (
                    revenueByDate.map((row, idx) => (
                      <tr key={idx} className="hover:bg-cream-50/50">
                        <td className="py-3 px-6 font-mono text-ink-700">{row.date}</td>
                        <td className="py-3 px-6 text-right font-bold">
                          <span className="px-2 py-0.5 rounded-full bg-cream-100 text-ink-800 text-xs">
                            {row.order_count}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-emerald-600">
                          {formatCurrency(row.total_revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly & Yearly Revenue Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly */}
            <div className="bg-white rounded-3xl border border-cream-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-cream-100">
                <h4 className="font-bold text-base text-ink-900">Doanh thu theo tháng</h4>
              </div>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-cream-50">
                    <tr className="border-b border-cream-200 text-xs font-bold text-ink-600 uppercase">
                      <th className="py-3 px-5">Tháng</th>
                      <th className="py-3 px-5 text-right">Số đơn</th>
                      <th className="py-3 px-5 text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100">
                    {revenueByMonth.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-ink-400 text-xs">
                          Chưa có dữ liệu.
                        </td>
                      </tr>
                    ) : (
                      revenueByMonth.map((m, idx) => (
                        <tr key={idx} className="hover:bg-cream-50/50">
                          <td className="py-3 px-5 font-mono text-ink-700">{m.month}</td>
                          <td className="py-3 px-5 text-right font-semibold">{m.order_count}</td>
                          <td className="py-3 px-5 text-right font-bold text-accent-600">
                            {formatCurrency(m.total_revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Yearly */}
            <div className="bg-white rounded-3xl border border-cream-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-cream-100">
                <h4 className="font-bold text-base text-ink-900">Doanh thu theo năm</h4>
              </div>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-cream-50">
                    <tr className="border-b border-cream-200 text-xs font-bold text-ink-600 uppercase">
                      <th className="py-3 px-5">Năm</th>
                      <th className="py-3 px-5 text-right">Số đơn</th>
                      <th className="py-3 px-5 text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100">
                    {revenueByYear.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-ink-400 text-xs">
                          Chưa có dữ liệu.
                        </td>
                      </tr>
                    ) : (
                      revenueByYear.map((y, idx) => (
                        <tr key={idx} className="hover:bg-cream-50/50">
                          <td className="py-3 px-5 font-mono font-bold text-ink-800">{y.year}</td>
                          <td className="py-3 px-5 text-right font-semibold">{y.order_count}</td>
                          <td className="py-3 px-5 text-right font-bold text-emerald-600">
                            {formatCurrency(y.total_revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CHARTS (5 Charts required by Lab 08) */}
      {subTab === 'charts' && chartsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Doanh thu theo danh mục (Bar chart) */}
            <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-ink-900">1. Doanh thu theo danh mục</h4>
                <span className="text-xs text-ink-400">Biểu đồ cột</span>
              </div>
              <div className="space-y-3 pt-2">
                {chartsData.catLabels.map((lbl, idx) => {
                  const rev = chartsData.catRevenue[idx] || 0;
                  const maxRev = Math.max(...chartsData.catRevenue, 1);
                  const pct = Math.round((rev / maxRev) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-ink-800 truncate max-w-[200px]">{lbl}</span>
                        <span className="text-accent-600">{formatCurrency(rev)}</span>
                      </div>
                      <div className="w-full h-3 bg-cream-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Doanh thu theo ngày 30 ngày (Bar/Line visual) */}
            <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-ink-900">2. Doanh thu 30 ngày gần nhất</h4>
                <span className="text-xs text-ink-400">Xu hướng ngày</span>
              </div>
              <div className="h-48 flex items-end gap-1 pt-6 px-1 border-b border-cream-200">
                {chartsData.revDateData.map((val, idx) => {
                  const maxVal = Math.max(...chartsData.revDateData, 1);
                  const hPct = Math.max(Math.round((val / maxVal) * 100), 4);
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-ink-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-20 shadow-lg pointer-events-none">
                        <p className="font-bold">{chartsData.revDateLabels[idx]}</p>
                        <p>{formatCurrency(val)}</p>
                      </div>
                      <div
                        className="w-full bg-blue-400 hover:bg-blue-600 rounded-t-sm transition-all"
                        style={{ height: `${hPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-ink-400 font-mono">
                <span>{chartsData.revDateLabels[0]}</span>
                <span>{chartsData.revDateLabels[Math.floor(chartsData.revDateLabels.length / 2)]}</span>
                <span>{chartsData.revDateLabels[chartsData.revDateLabels.length - 1]}</span>
              </div>
            </div>

            {/* Chart 3: Doanh thu theo tháng 12 tháng */}
            <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-ink-900">3. Doanh thu theo tháng (12 tháng)</h4>
                <span className="text-xs text-ink-400">Tháng</span>
              </div>
              <div className="h-48 flex items-end gap-2 pt-6 px-1 border-b border-cream-200">
                {chartsData.revMonthData.map((val, idx) => {
                  const maxVal = Math.max(...chartsData.revMonthData, 1);
                  const hPct = Math.max(Math.round((val / maxVal) * 100), 4);
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    >
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-ink-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-20 shadow-lg pointer-events-none">
                        <p className="font-bold">{chartsData.revMonthLabels[idx]}</p>
                        <p>{formatCurrency(val)}</p>
                      </div>
                      <div
                        className="w-full bg-emerald-400 hover:bg-emerald-600 rounded-t-md transition-all"
                        style={{ height: `${hPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-ink-400 font-mono">
                <span>{chartsData.revMonthLabels[0]}</span>
                <span>{chartsData.revMonthLabels[chartsData.revMonthLabels.length - 1]}</span>
              </div>
            </div>

            {/* Chart 4: Doanh thu theo năm */}
            <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-ink-900">4. Doanh thu theo từng năm</h4>
                <span className="text-xs text-ink-400">Năm</span>
              </div>
              <div className="space-y-3 pt-2">
                {chartsData.revYearLabels.map((lbl, idx) => {
                  const rev = chartsData.revYearData[idx] || 0;
                  const maxRev = Math.max(...chartsData.revYearData, 1);
                  const pct = Math.round((rev / maxRev) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-ink-900 font-bold">Năm {lbl}</span>
                        <span className="text-emerald-600">{formatCurrency(rev)}</span>
                      </div>
                      <div className="w-full h-3 bg-cream-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
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
          <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-ink-900">
                  5. Doanh thu theo phương thức thanh toán (MoMo vs COD vs VietQR)
                </h4>
                <p className="text-xs text-ink-500 mt-0.5">Tỷ trọng đóng góp dòng tiền của từng cổng</p>
              </div>
              <CreditCard size={20} className="text-accent-500" />
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
                    className={`p-4 rounded-2xl border ${
                      isMomo
                        ? 'bg-pink-50/50 border-pink-200'
                        : isCod
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-blue-50/50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink-800">{method}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white shadow-2xs">
                        {pct}%
                      </span>
                    </div>
                    <p className="text-lg font-bold text-ink-900 mt-2">{formatCurrency(rev)}</p>
                    <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden mt-2">
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
