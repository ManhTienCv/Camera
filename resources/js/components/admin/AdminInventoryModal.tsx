import React, { useState, useEffect } from 'react';
import {
  X,
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Search,
  Filter,
  Package,
  Calendar,
  User,
  FileText,
  AlertCircle,
  RefreshCw,
  Download,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface MovementItem {
  id: number;
  product_id: number;
  type: 'purchase' | 'cancel_restock' | 'manual_adjust' | 'import_stock';
  qty_before: number;
  qty_change: number;
  qty_after: number;
  order_id: number | null;
  actor_id: number | null;
  actor_name: string | null;
  note: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string;
    brand: string;
    stock: number;
  };
  order?: {
    id: number;
    order_code: string;
    customer_name: string;
  };
}

export function AdminInventoryModal({ isOpen, onClose }: Props) {
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [stats, setStats] = useState({
    total_movements: 0,
    total_purchased_qty: 0,
    total_restocked_qty: 0,
    total_manual_adjusted: 0,
  });
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const fetchMovements = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await api.getInventoryMovements({
        type: typeFilter || undefined,
        search: search.trim() || undefined,
        page: targetPage,
        per_page: 50,
      });
      setMovements((res.data || []) as any);
      if (res.stats) {
        setStats(res.stats);
      }
      if (res.meta) {
        setMeta(res.meta);
        setPage(res.meta.current_page);
      }
    } catch (e) {
      console.error('Error fetching inventory movements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchMovements(1);
    }
  }, [isOpen, typeFilter]);

  if (!isOpen) return null;

  const getTypeBadge = (type: string, change: number) => {
    switch (type) {
      case 'purchase':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <ArrowDownRight size={13} />
            <span>Xuất bán ({change})</span>
          </span>
        );
      case 'cancel_restock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
            <ArrowUpRight size={13} />
            <span>Hoàn kho (+{change})</span>
          </span>
        );
      case 'manual_adjust':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
            <RotateCcw size={13} />
            <span>Điều chỉnh ({change >= 0 ? `+${change}` : change})</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            <Boxes size={13} />
            <span>Nhập kho ({change})</span>
          </span>
        );
    }
  };

  const exportToCsv = () => {
    if (movements.length === 0) return;
    const headers = [
      'STT',
      'Mã bút toán',
      'Thời gian',
      'Mã sản phẩm',
      'Tên sản phẩm',
      'Thương hiệu',
      'Loại biến động',
      'Tồn trước',
      'Biến động',
      'Tồn sau',
      'Mã đơn hàng',
      'Tác nhân thực hiện',
      'Ghi chú',
    ];

    const rows = movements.map((m, idx) => {
      let typeName = 'Nhập kho';
      if (m.type === 'purchase') typeName = 'Xuất bán';
      else if (m.type === 'cancel_restock') typeName = 'Hoàn kho hủy đơn';
      else if (m.type === 'manual_adjust') typeName = 'Điều chỉnh';

      return [
        idx + 1,
        `#MOV-${m.id}`,
        `"${new Date(m.created_at).toLocaleString('vi-VN')}"`,
        m.product_id,
        `"${(m.product?.name || '').replace(/"/g, '""')}"`,
        `"${(m.product?.brand || '').replace(/"/g, '""')}"`,
        `"${typeName}"`,
        m.qty_before,
        m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change,
        m.qty_after,
        `"${m.order?.order_code || '—'}"`,
        `"${(m.actor_name || 'Hệ thống').replace(/"/g, '""')}"`,
        `"${(m.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `So_Cai_Kho_Camera_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-950/75 backdrop-blur-md animate-fade-in text-ink-900 dark:text-cream-100">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-cream-200 dark:border-ink-800 w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] flex flex-col min-h-[580px] max-h-[92vh] overflow-hidden animate-scale-up">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-cream-200 dark:border-ink-800 flex items-center justify-between bg-cream-50/70 dark:bg-ink-950/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-accent-500 to-accent-600 text-white flex items-center justify-center shadow-md shadow-accent-500/20">
              <Boxes size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-cream-50">
                  Sổ Cái Biến Động Kho (Inventory Ledger)
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={13} />
                  <span>Audit Trail</span>
                </span>
              </div>
              <p className="text-xs text-ink-500 dark:text-cream-400 mt-0.5">
                Nhật ký xuất nhập và hoàn kho tự động theo tiêu chuẩn kiểm toán doanh nghiệp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchMovements(page)}
              disabled={loading}
              className="p-2 text-ink-500 hover:text-ink-800 dark:text-cream-400 dark:hover:text-cream-100 rounded-xl hover:bg-cream-200/60 dark:hover:bg-ink-800 transition-colors cursor-pointer"
              title="Làm mới sổ cái"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-ink-400 hover:text-ink-800 dark:hover:text-cream-100 rounded-xl hover:bg-cream-200/60 dark:hover:bg-ink-800 transition-colors cursor-pointer"
              title="Đóng modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-6 py-4 border-b border-cream-200 dark:border-ink-800 bg-cream-50/40 dark:bg-ink-950/30 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-ink-400 dark:text-cream-400 uppercase tracking-wider">Tổng bút toán</p>
              <p className="font-display font-extrabold text-xl text-ink-900 dark:text-cream-50 mt-0.5">
                {stats.total_movements.toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownRight size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Tổng xuất bán</p>
              <p className="font-display font-extrabold text-xl text-rose-600 dark:text-rose-400 mt-0.5">
                -{stats.total_purchased_qty.toLocaleString('vi-VN')} máy
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Hoàn trả do hủy</p>
              <p className="font-display font-extrabold text-xl text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{stats.total_restocked_qty.toLocaleString('vi-VN')} máy
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Điều chỉnh kho</p>
              <p className="font-display font-extrabold text-xl text-amber-600 dark:text-amber-400 mt-0.5">
                {stats.total_manual_adjusted.toLocaleString('vi-VN')} lần
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3.5 border-b border-cream-200 dark:border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-ink-900 shrink-0">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    fetchMovements(1);
                  }
                }}
                placeholder="Tìm sản phẩm, mã đơn (#CAM-...), tác nhân, ghi chú..."
                className="w-full pl-9 pr-8 py-2 bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-xl text-xs focus:outline-none focus:border-accent-500 text-ink-900 dark:text-cream-100 placeholder:text-ink-400"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                    setTimeout(() => fetchMovements(1), 0);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:hover:text-cream-200 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setPage(1);
                fetchMovements(1);
              }}
              className="px-3.5 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Search size={13} />
              <span>Tìm</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-ink-400 shrink-0 hidden sm:block" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-xl text-xs font-semibold text-ink-700 dark:text-cream-300 focus:outline-none focus:border-accent-500 cursor-pointer"
              >
                <option value="">Tất cả loại biến động</option>
                <option value="purchase">Xuất bán đơn hàng (Purchase)</option>
                <option value="cancel_restock">Hoàn kho hủy đơn (Restock)</option>
                <option value="manual_adjust">Điều chỉnh thủ công (Manual Adjust)</option>
                <option value="import_stock">Nhập kho bổ sung (Import Stock)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table Container */}
        <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[300px] bg-white dark:bg-ink-900">
          {loading && movements.length === 0 ? (
            <div className="py-24 text-center text-xs text-ink-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="animate-spin text-accent-500" />
              <span>Đang tải sổ cái biến động kho...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-3xl bg-cream-100 dark:bg-ink-800 flex items-center justify-center text-ink-300 dark:text-ink-500 mb-3">
                <Boxes size={28} />
              </div>
              <p className="text-sm font-bold text-ink-700 dark:text-cream-200">Không tìm thấy bản ghi biến động kho</p>
              <p className="text-xs text-ink-400 mt-1 max-w-sm">
                Thử đổi bộ lọc loại biến động hoặc tìm kiếm với từ khóa khác
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs min-w-[1150px]">
              <thead className="sticky top-0 z-10 bg-cream-100/95 dark:bg-ink-950/95 backdrop-blur-md border-b border-cream-200 dark:border-ink-800 text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-6 w-[150px] min-w-[150px]">Thời gian</th>
                  <th className="p-3.5 min-w-[280px]">Sản phẩm</th>
                  <th className="p-3.5 w-[160px] min-w-[160px]">Loại bút toán</th>
                  <th className="p-3.5 w-20 text-center">Trước</th>
                  <th className="p-3.5 w-24 text-center">Biến động</th>
                  <th className="p-3.5 w-20 text-center">Sau</th>
                  <th className="p-3.5 w-[170px] min-w-[170px]">Đơn hàng / Tác nhân</th>
                  <th className="p-3.5 pr-6 min-w-[240px]">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 dark:divide-ink-800/60 font-sans">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-cream-50/70 dark:hover:bg-ink-800/40 transition-colors">
                    <td className="p-3.5 pl-6 text-ink-500 dark:text-cream-400 font-mono whitespace-nowrap">
                      <div className="font-semibold text-ink-700 dark:text-cream-200">
                        {new Date(m.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                      <div className="text-[11px] text-ink-400">
                        {new Date(m.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {m.product?.image_url ? (
                          <img
                            src={m.product.image_url}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover bg-cream-200 dark:bg-ink-800 shrink-0 border border-cream-200 dark:border-ink-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-cream-100 dark:bg-ink-800 flex items-center justify-center text-ink-400 shrink-0 border border-cream-200 dark:border-ink-700">
                            <Package size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-ink-900 dark:text-cream-100 line-clamp-1 leading-snug" title={m.product?.name}>
                            {m.product?.name || `Product #${m.product_id}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {m.product?.brand && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cream-100 dark:bg-ink-800 text-ink-500 dark:text-cream-400">
                                {m.product.brand}
                              </span>
                            )}
                            <span className="text-[10px] text-ink-400 font-mono">
                              ID: {m.product_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {getTypeBadge(m.type, m.qty_change)}
                    </td>

                    <td className="p-3.5 text-center font-mono font-medium text-ink-600 dark:text-cream-300">
                      {m.qty_before}
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold">
                      <span className={m.qty_change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change}
                      </span>
                    </td>

                    <td className="p-3.5 text-center font-mono font-extrabold text-ink-900 dark:text-cream-50">
                      {m.qty_after}
                    </td>

                    <td className="p-3.5">
                      {m.order ? (
                        <div className="font-mono font-bold text-accent-600 dark:text-accent-400 hover:underline">
                          #{m.order.order_code}
                        </div>
                      ) : (
                        <span className="text-ink-400 font-mono">—</span>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-ink-500 dark:text-cream-400 mt-0.5">
                        <User size={11} className="shrink-0 text-ink-400" />
                        <span className="truncate max-w-[130px]" title={m.actor_name || 'Hệ thống'}>
                          {m.actor_name || 'Hệ thống'}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 pr-6 text-ink-600 dark:text-cream-300 leading-relaxed" title={m.note || ''}>
                      {m.note ? (
                        <span className="line-clamp-2">{m.note}</span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-cream-200 dark:border-ink-800 bg-cream-50/70 dark:bg-ink-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-ink-500 dark:text-cream-400 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                Hiển thị <strong className="text-ink-900 dark:text-cream-100">{movements.length}</strong> / <strong className="text-ink-900 dark:text-cream-100">{meta.total || stats.total_movements}</strong> bút toán
              </span>
            </div>

            <span className="hidden md:inline text-ink-300 dark:text-ink-700">|</span>

            <span className="hidden md:flex items-center gap-1 text-[11px] text-ink-400 dark:text-cream-400">
              <ShieldCheck size={13} className="text-emerald-500" />
              Sổ cái tự động cập nhật & bất biến (WORM Log)
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {meta.last_page > 1 && (
              <div className="flex items-center gap-1 mr-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                      fetchMovements(page - 1);
                    }
                  }}
                  disabled={page <= 1 || loading}
                  className="p-1.5 rounded-lg border border-cream-200 dark:border-ink-700 text-ink-600 dark:text-cream-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 text-ink-500 font-mono text-[11px]">
                  {page} / {meta.last_page}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (page < meta.last_page) {
                      setPage(page + 1);
                      fetchMovements(page + 1);
                    }
                  }}
                  disabled={page >= meta.last_page || loading}
                  className="p-1.5 rounded-lg border border-cream-200 dark:border-ink-700 text-ink-600 dark:text-cream-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={exportToCsv}
              disabled={movements.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-ink-800 border border-cream-300 dark:border-ink-700 text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Xuất dữ liệu sổ cái dạng CSV"
            >
              <Download size={14} />
              <span>Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-ink-900 dark:bg-cream-100 text-white dark:text-ink-900 hover:bg-ink-800 dark:hover:bg-white transition-colors cursor-pointer shadow-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
