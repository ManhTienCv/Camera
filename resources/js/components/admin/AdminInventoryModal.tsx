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
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await api.getInventoryMovements({
        type: typeFilter || undefined,
        search: search.trim() || undefined,
        per_page: 50,
      });
      setMovements((res.data || []) as any);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error('Error fetching inventory movements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMovements();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-md animate-fade-in text-ink-900 dark:text-cream-100">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-cream-200 dark:border-ink-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-cream-200 dark:border-ink-800 flex items-center justify-between bg-cream-50/60 dark:bg-ink-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-500 text-white flex items-center justify-center shadow-xs">
              <Boxes size={22} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-cream-50">
                Sổ Cái Biến Động Kho (Inventory Ledger)
              </h2>
              <p className="text-xs text-ink-500 dark:text-cream-400">
                Nhật ký xuất nhập và hoàn kho bất biến chuẩn kế toán doanh nghiệp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-ink-400 hover:text-ink-700 dark:hover:text-cream-200 rounded-full hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="p-5 border-b border-cream-200 dark:border-ink-800 bg-cream-50/30 dark:bg-ink-950/30 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700">
            <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">Tổng bút toán</p>
            <p className="font-display font-bold text-xl text-ink-900 dark:text-cream-50 mt-0.5">
              {stats.total_movements}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700">
            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Tổng xuất bán</p>
            <p className="font-display font-bold text-xl text-rose-600 dark:text-rose-400 mt-0.5">
              -{stats.total_purchased_qty} máy
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700">
            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Hoàn trả do hủy</p>
            <p className="font-display font-bold text-xl text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{stats.total_restocked_qty} máy
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700">
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Điều chỉnh kho</p>
            <p className="font-display font-bold text-xl text-amber-600 dark:text-amber-400 mt-0.5">
              {stats.total_manual_adjusted} lần
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-cream-200 dark:border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMovements()}
                placeholder="Tìm sản phẩm, đơn hàng, ghi chú..."
                className="w-full pl-9 pr-3 py-2 bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-xl text-xs focus:outline-none focus:border-accent-500 text-ink-900 dark:text-cream-100"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            </div>

            <button
              type="button"
              onClick={fetchMovements}
              className="p-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              title="Tìm kiếm"
            >
              <Search size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-xl text-xs font-semibold text-ink-700 dark:text-cream-300 focus:outline-none focus:border-accent-500"
            >
              <option value="">Tất cả loại biến động</option>
              <option value="purchase">Xuất bán đơn hàng (Purchase)</option>
              <option value="cancel_restock">Hoàn kho hủy đơn (Restock)</option>
              <option value="manual_adjust">Điều chỉnh thủ công (Manual)</option>
            </select>

            <button
              type="button"
              onClick={fetchMovements}
              disabled={loading}
              className="p-2 text-ink-400 hover:text-ink-700 dark:hover:text-cream-200 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-y-auto">
          {loading && movements.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-400 animate-pulse">
              Đang tải sổ cái biến động kho...
            </div>
          ) : movements.length === 0 ? (
            <div className="py-16 text-center">
              <Boxes size={36} className="mx-auto text-ink-300 dark:text-ink-600 mb-2" />
              <p className="text-xs font-bold text-ink-500">Chưa có bản ghi biến động kho nào</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-cream-100/90 dark:bg-ink-950/90 backdrop-blur-xs border-b border-cream-200 dark:border-ink-800 text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-6">Thời gian</th>
                  <th className="p-3.5">Sản phẩm</th>
                  <th className="p-3.5">Loại bút toán</th>
                  <th className="p-3.5 text-center">Trước</th>
                  <th className="p-3.5 text-center">Biến động</th>
                  <th className="p-3.5 text-center">Sau</th>
                  <th className="p-3.5">Đơn hàng / Tác nhân</th>
                  <th className="p-3.5 pr-6">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 dark:divide-ink-800/60">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-cream-50/50 dark:hover:bg-ink-800/40 transition-colors">
                    <td className="p-3.5 pl-6 text-ink-500 dark:text-cream-400 font-mono whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="p-3.5 min-w-[200px]">
                      <div className="flex items-center gap-2.5">
                        {m.product?.image_url && (
                          <img
                            src={m.product.image_url}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover bg-cream-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-ink-900 dark:text-cream-100 truncate">
                            {m.product?.name || `Product #${m.product_id}`}
                          </p>
                          <span className="text-[10px] text-ink-400">{m.product?.brand}</span>
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
                      <span className={m.qty_change > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change}
                      </span>
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-ink-900 dark:text-cream-50">
                      {m.qty_after}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {m.order ? (
                        <span className="font-mono font-bold text-accent-600 dark:text-accent-400">
                          #{m.order.order_code}
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                      <p className="text-[10px] text-ink-400 truncate max-w-[120px]">
                        {m.actor_name || 'Hệ thống'}
                      </p>
                    </td>

                    <td className="p-3.5 pr-6 text-ink-500 dark:text-cream-400 max-w-[220px] truncate" title={m.note || ''}>
                      {m.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
