import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Users,
  Percent,
  Search,
  Plus,
  RotateCw,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import type { AdminVoucherItem } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../lib/utils';

export const AdminVouchersTab: React.FC = () => {
  const toast = useToast();

  const [vouchers, setVouchers] = useState<AdminVoucherItem[]>([]);
  const [stats, setStats] = useState({
    total_vouchers: 0,
    active_vouchers: 0,
    total_used: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucherItem | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<AdminVoucherItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const totalPages = Math.max(1, Math.ceil(vouchers.length / itemsPerPage));
  const paginatedVouchers = vouchers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.querySelector('main')?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'fixed' as 'fixed' | 'percent',
    discount_value: '',
    min_order_amount: '0',
    max_discount_amount: '',
    usage_limit: '100',
    expires_at: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Vouchers
  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminVouchers({
        q: searchTerm.trim() || undefined,
        status: statusFilter,
      });
      setVouchers(res.vouchers || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      if (err.isUnauthorized || (err.message && err.message.includes('Unauthorized'))) {
        return;
      }
      toast.error(err.message || 'Lỗi tải danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVouchers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchVouchers]);

  // Handle Toggle Status
  const handleToggleStatus = async (id: number) => {
    try {
      const res = await api.toggleAdminVoucherStatus(id);
      toast.success(res.message);
      // Update local state instantly
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: res.voucher.status } : v))
      );
      setStats((prev) => ({
        ...prev,
        active_vouchers:
          res.voucher.status === 'active'
            ? prev.active_vouchers + 1
            : Math.max(0, prev.active_vouchers - 1),
      }));
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật trạng thái voucher.');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingVoucher(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'fixed',
      discount_value: '',
      min_order_amount: '0',
      max_discount_amount: '',
      usage_limit: '100',
      expires_at: '',
      status: 'active',
    });
    setFormError(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (v: AdminVoucherItem) => {
    setEditingVoucher(v);
    setFormData({
      code: v.code,
      name: v.name,
      description: v.description || '',
      discount_type: v.discount_type,
      discount_value: String(v.discount_value),
      min_order_amount: String(v.min_order_amount || 0),
      max_discount_amount: v.max_discount_amount ? String(v.max_discount_amount) : '',
      usage_limit: String(v.usage_limit || 0),
      expires_at: v.expires_at ? v.expires_at.slice(0, 16) : '',
      status: v.status,
    });
    setFormError(null);
    setShowModal(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.code.trim()) {
      setFormError('Vui lòng nhập mã code voucher!');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên chương trình ưu đãi!');
      return;
    }
    const discVal = parseFloat(formData.discount_value);
    if (isNaN(discVal) || discVal <= 0) {
      setFormError('Mức giảm phải là số hợp lệ lớn hơn 0!');
      return;
    }
    if (formData.discount_type === 'percent' && discVal > 100) {
      setFormError('Mức giảm phần trăm không được vượt quá 100%!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<AdminVoucherItem> = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        discount_type: formData.discount_type,
        discount_value: discVal,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_discount_amount:
          formData.discount_type === 'percent' && formData.max_discount_amount
            ? parseFloat(formData.max_discount_amount)
            : null,
        usage_limit: parseInt(formData.usage_limit, 10) || 0,
        expires_at: formData.expires_at || null,
        status: formData.status,
      };

      if (editingVoucher) {
        await api.updateAdminVoucher(editingVoucher.id, payload);
        toast.success(`Đã cập nhật mã ưu đãi "${payload.code}" thành công!`);
      } else {
        await api.createAdminVoucher(payload);
        toast.success(`Đã tạo mã ưu đãi "${payload.code}" thành công!`);
      }
      setShowModal(false);
      fetchVouchers();
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu mã ưu đãi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Voucher
  const handleConfirmDelete = async () => {
    if (!deletingVoucher) return;
    setIsSubmitting(true);
    try {
      await api.deleteAdminVoucher(deletingVoucher.id);
      toast.success(`Đã xóa mã voucher "${deletingVoucher.code}"!`);
      setDeletingVoucher(null);
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Bar (matches media_1790099989435.png) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">
            Quản Lý Mã Giảm Giá & Voucher
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Tạo và quản lý các chương trình khuyến mãi, voucher phần trăm và trợ giá vận chuyển
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchVouchers()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-cream-300 text-ink-700 bg-white hover:bg-cream-100 hover:text-ink-900 rounded-2xl text-sm font-semibold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>Tạo mã mới</span>
          </button>
        </div>
      </div>

      {/* 2. Three Stat Cards (matches media_1790099989435.png) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Tổng số mã ưu đãi */}
        <div className="bg-white rounded-2xl border border-cream-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-400 tracking-wider uppercase">
              TỔNG SỐ MÃ ƯU ĐÃI
            </span>
            <div className="text-3xl font-display font-bold text-ink-900 leading-none">
              {stats.total_vouchers}
            </div>
            <p className="text-xs text-ink-400">
              {stats.active_vouchers} mã đang hoạt động hiệu lực
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Ticket size={24} />
          </div>
        </div>

        {/* Card 2: Lượt khách đã áp dụng */}
        <div className="bg-white rounded-2xl border border-cream-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-400 tracking-wider uppercase">
              LƯỢT KHÁCH ĐÃ ÁP DỤNG
            </span>
            <div className="text-3xl font-display font-bold text-emerald-600 leading-none">
              {stats.total_used} lượt
            </div>
            <p className="text-xs text-ink-400">
              Áp dụng thành công vào giỏ hàng và thanh toán
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
        </div>

        {/* Card 3: Hình thức khuyến mãi */}
        <div className="bg-white rounded-2xl border border-cream-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-400 tracking-wider uppercase">
              HÌNH THỨC KHUYẾN MÃI
            </span>
            <div className="text-2xl font-display font-bold text-indigo-600 leading-tight">
              Trợ giá & %
            </div>
            <p className="text-xs text-ink-400">
              Tối đa hóa tỷ lệ chốt đơn của khách hàng
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Percent size={24} />
          </div>
        </div>
      </div>

      {/* 3. Search and Status Filter Pill Bar (matches media_1790099989435.png) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
          <input
            type="text"
            placeholder="Tìm mã code, chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 transition-colors shadow-xs placeholder:text-ink-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="inline-flex items-center p-1 bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 rounded-2xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-ink-900 dark:bg-accent-500 text-white shadow-xs'
                : 'text-ink-600 dark:text-cream-200 hover:text-ink-900 dark:hover:text-white hover:bg-cream-100/70'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-ink-900 dark:bg-accent-500 text-white shadow-xs'
                : 'text-ink-600 dark:text-cream-200 hover:text-ink-900 dark:hover:text-white hover:bg-cream-100/70'
            }`}
          >
            Đang hiệu lực
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-ink-900 dark:bg-accent-500 text-white shadow-xs'
                : 'text-ink-600 dark:text-cream-200 hover:text-ink-900 dark:hover:text-white hover:bg-cream-100/70'
            }`}
          >
            Tạm ngưng
          </button>
        </div>
      </div>

      {/* 4. Vouchers Card Grid (matches media_1790099989435.png) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-cream-200 p-5 h-56 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-6 bg-cream-200 rounded-lg" />
                <div className="w-16 h-5 bg-cream-200 rounded-full" />
              </div>
              <div className="w-3/4 h-5 bg-cream-200 rounded" />
              <div className="w-full h-4 bg-cream-100 rounded" />
              <div className="border-t border-cream-200 pt-3 space-y-2">
                <div className="w-1/2 h-3 bg-cream-200 rounded" />
                <div className="w-2/3 h-3 bg-cream-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4 text-ink-300">
            <Ticket size={32} />
          </div>
          <h3 className="text-base font-bold text-ink-800">Chưa có mã giảm giá nào phù hợp</h3>
          <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
            Thử thay đổi bộ lọc tìm kiếm hoặc bấm nút "Tạo mã mới" để thêm mã khuyến mãi đầu tiên.
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-accent mt-5 px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md inline-flex items-center gap-2 text-xs font-bold active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Tạo mã ưu đãi mới ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedVouchers.map((voucher) => {
              const isPercent = voucher.discount_type === 'percent';
              const isActive = voucher.status === 'active';

              return (
                <div
                  key={voucher.id}
                  className="bg-white rounded-2xl border border-cream-200/90 hover:border-accent-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Bar: Code Badge & Status Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300/80 rounded-lg font-mono font-bold text-xs tracking-wider uppercase shadow-2xs">
                        {voucher.code}
                      </span>

                      <button
                        onClick={() => handleToggleStatus(voucher.id)}
                        title="Bấm để bật / tắt trạng thái"
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-cream-100 text-ink-500 border-cream-300 hover:bg-cream-200'
                        }`}
                      >
                        {isActive ? 'Hoạt động' : 'Tạm ngưng'}
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-ink-900 text-sm sm:text-base mt-3 leading-snug line-clamp-1 group-hover:text-accent-600 transition-colors">
                      {voucher.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-ink-500 mt-1 line-clamp-2 min-h-[34px] leading-relaxed">
                      {voucher.description || 'Không có mô tả chi tiết cho mã này.'}
                    </p>

                    {/* Dashed Divider */}
                    <div className="border-t border-dashed border-cream-200 my-3.5" />

                    {/* Stats list */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-400">Mức giảm:</span>
                        <span className="font-bold text-accent-600">
                          {isPercent
                            ? `Giảm ${voucher.discount_value}%${
                                voucher.max_discount_amount
                                  ? ` (Tối đa ${formatPrice(voucher.max_discount_amount)})`
                                  : ''
                              }`
                            : `Giảm ${formatPrice(voucher.discount_value)}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-ink-400">Đơn tối thiểu:</span>
                        <span className="font-semibold text-ink-900">
                          {formatPrice(voucher.min_order_amount || 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-ink-400">Đã dùng:</span>
                        <span className="font-semibold text-ink-900">
                          {voucher.used_count} / {voucher.usage_limit > 0 ? voucher.usage_limit : '∞'}
                        </span>
                      </div>

                      {voucher.expires_at && (
                        <div className="flex items-center justify-between pt-0.5 text-[11px] text-ink-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Hết hạn:
                          </span>
                          <span>{new Date(voucher.expires_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons (matches media_1790099989435.png) */}
                  <div className="flex items-center justify-end gap-4 pt-4 mt-3 border-t border-cream-100">
                    <button
                      onClick={() => handleOpenEdit(voucher)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-accent-600 transition-colors cursor-pointer"
                    >
                      <Pencil size={13} />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => setDeletingVoucher(voucher)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Toolbar */}
          {vouchers.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3 text-xs text-ink-600 font-medium">
                <div>
                  Hiển thị <span className="font-bold text-ink-900">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                  <span className="font-bold text-ink-900">{Math.min(currentPage * itemsPerPage, vouchers.length)}</span> trên{' '}
                  <span className="font-bold text-ink-900">{vouchers.length}</span> mã ưu đãi
                </div>

                <div className="flex items-center gap-1.5 border-l border-cream-200 pl-3">
                  <span className="text-[11px] text-ink-400">Hiển thị:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-700 rounded-lg text-xs font-bold text-ink-800 dark:text-cream-100 focus:outline-none focus:border-accent-500 cursor-pointer shadow-2xs"
                  >
                    <option value={6}>6 mã / trang</option>
                    <option value={12}>12 mã / trang</option>
                    <option value={24}>24 mã / trang</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                  >
                    ‹ Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-ink-900 dark:bg-accent-500 text-white shadow-xs'
                          : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-cream-200 border border-cream-300 dark:border-ink-700 hover:bg-cream-100 dark:hover:bg-ink-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                  >
                    Sau ›
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. ADD / EDIT VOUCHER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-cream-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-cream-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
                  <Ticket size={18} />
                </div>
                <h3 className="text-base font-bold text-ink-900 font-display">
                  {editingVoucher ? `Chỉnh sửa mã "${editingVoucher.code}"` : 'Tạo mới mã giảm giá & voucher'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-cream-200/50 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Voucher Code */}
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    Mã Voucher *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CAMERA500K"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-accent-500 uppercase"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                    }
                    className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-sm focus:outline-none focus:border-accent-500"
                  >
                    <option value="active">Hoạt động (Hiệu lực)</option>
                    <option value="inactive">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Tên chương trình ưu đãi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Ưu đãi chào bạn mới - Giảm 50K"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-sm focus:outline-none focus:border-accent-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Mô tả điều kiện áp dụng
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Áp dụng cho đơn hàng phụ kiện và thiết bị máy ảnh từ 500.000đ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-cream-50/60 border border-cream-300 rounded-xl text-xs focus:outline-none focus:border-accent-500"
                />
              </div>

              {/* Discount Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    Hình thức giảm giá *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'fixed' | 'percent',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-sm focus:outline-none focus:border-accent-500"
                  >
                    <option value="fixed">Số tiền trực tiếp (VNĐ)</option>
                    <option value="percent">Theo phần trăm (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    {formData.discount_type === 'percent' ? 'Mức giảm (%) *' : 'Mức giảm (VNĐ) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discount_type === 'percent' ? 100 : undefined}
                    placeholder={formData.discount_type === 'percent' ? '10' : '50000'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-sm focus:outline-none focus:border-accent-500"
                  />
                </div>

                {formData.discount_type === 'percent' && (
                  <div>
                    <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="VD: 200000"
                      value={formData.max_discount_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, max_discount_amount: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-sm focus:outline-none focus:border-accent-500"
                    />
                  </div>
                )}
              </div>

              {/* Usage Limit & Expiration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    Số lượt dùng tối đa
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100 (0 = không giới hạn)"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-sm focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    Hạn sử dụng (Tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50/60 border border-cream-300 rounded-xl text-xs focus:outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-cream-300 text-ink-700 hover:bg-cream-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-accent px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw size={14} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{editingVoucher ? 'Lưu thay đổi' : 'Tạo mã voucher'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingVoucher && (
        <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-cream-200 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink-900 font-display">
                Xác nhận xóa voucher "{deletingVoucher.code}"?
              </h3>
              <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                Mã giảm giá này sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu. Khách hàng sẽ không thể áp dụng mã này khi thanh toán đơn hàng.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVoucher(null)}
                className="px-4 py-2 border border-cream-300 text-ink-700 hover:bg-cream-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Đồng ý xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
