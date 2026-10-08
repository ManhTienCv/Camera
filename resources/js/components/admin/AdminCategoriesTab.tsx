import React, { useState, useEffect } from 'react';
import {
  Plus,
  Camera,
  Disc,
  Briefcase,
  Edit3,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Tag,
  FolderTree,
} from 'lucide-react';
import type { Category, Brand } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { BrandFormModal } from './modals/BrandFormModal';

interface AdminCategoriesTabProps {
  categories: Category[];
  products?: any[];
  onOpenAddCategory: () => void;
  onOpenEditCategory: (cat: Category) => void;
  onDeleteCategory: (catId: string) => void;
  onViewCategoryProducts?: (categoryId: string) => void;
}

const getCategoryIcon = (slug: string, iconName?: string | null) => {
  if (slug.includes('mirrorless') || slug.includes('dslr') || slug.includes('compact') || iconName === 'Camera') return Camera;
  if (slug.includes('ong-kinh') || slug.includes('lens') || iconName === 'Disc') return Disc;
  return Briefcase;
};

const getCategoryTheme = (idx: number) => {
  const themes = [
    { bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  ];
  return themes[idx % themes.length];
};

const getBrandTheme = (idx: number) => {
  const themes = [
    { bg: 'bg-blue-50', text: 'text-blue-600' },
    { bg: 'bg-rose-50', text: 'text-rose-600' },
    { bg: 'bg-amber-50', text: 'text-amber-600' },
    { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { bg: 'bg-purple-50', text: 'text-purple-600' },
    { bg: 'bg-teal-50', text: 'text-teal-600' },
  ];
  return themes[idx % themes.length];
};

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  categories,
  onOpenAddCategory,
  onOpenEditCategory,
  onDeleteCategory,
  onViewCategoryProducts: _onViewCategoryProducts,
}) => {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'brands'>('categories');

  // Categories Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const totalPages = Math.max(1, Math.ceil(categories.length / itemsPerPage));
  const paginatedCategories = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    document.querySelector('main')?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalProducts = categories.reduce((sum, c) => sum + (c.products_count || 0), 0);

  // Brands Management State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [_loadingBrands, setLoadingBrands] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandFormData, setBrandFormData] = useState({ name: '', description: '', logo_url: '' });
  const [brandSubmitting, setBrandSubmitting] = useState(false);
  const [brandPage, setBrandPage] = useState(1);
  const [brandItemsPerPage, setBrandItemsPerPage] = useState(6);

  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const data = await api.getBrands();
      if (Array.isArray(data)) {
        setBrands(data as Brand[]);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách thương hiệu:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const totalBrandPages = Math.max(1, Math.ceil(brands.length / brandItemsPerPage));
  const paginatedBrands = brands.slice((brandPage - 1) * brandItemsPerPage, brandPage * brandItemsPerPage);

  const handleOpenAddBrand = () => {
    setEditingBrand(null);
    setBrandFormData({ name: '', description: '', logo_url: '' });
    setBrandModalOpen(true);
  };

  const handleOpenEditBrand = (b: Brand) => {
    setEditingBrand(b);
    setBrandFormData({
      name: b.name,
      description: b.description || '',
      logo_url: b.logo_url || '',
    });
    setBrandModalOpen(true);
  };

  const handleSubmitBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandFormData.name.trim()) {
      toast.warning('Vui lòng nhập tên thương hiệu!');
      return;
    }
    try {
      setBrandSubmitting(true);
      if (editingBrand) {
        await api.updateAdminBrand(editingBrand.id, brandFormData);
        toast.success(`Cập nhật thương hiệu "${brandFormData.name}" thành công!`);
      } else {
        await api.createAdminBrand(brandFormData);
        toast.success(`Thêm mới thương hiệu "${brandFormData.name}" thành công!`);
      }
      setBrandModalOpen(false);
      await fetchBrands();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu thông tin thương hiệu.');
    } finally {
      setBrandSubmitting(false);
    }
  };

  const handleDeleteBrand = async (b: Brand) => {
    if ((b.products_count || 0) > 0) {
      toast.error(`Không thể xóa thương hiệu "${b.name}" vì có ${b.products_count} sản phẩm đang thuộc hãng này!`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${b.name}"?`)) return;

    try {
      await api.deleteAdminBrand(b.id);
      toast.success(`Đã xóa thương hiệu "${b.name}" thành công!`);
      await fetchBrands();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa thương hiệu.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 0. SUB-TAB SWITCHER */}
      <div className="flex items-center gap-3 border-b border-cream-200 dark:border-ink-800 pb-3">
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-accent-600 text-white shadow-xs'
              : 'bg-white dark:bg-ink-800 text-ink-600 dark:text-cream-300 hover:bg-cream-100 border border-cream-200 dark:border-ink-700'
          }`}
        >
          <FolderTree size={16} />
          Danh mục sản phẩm ({categories.length})
        </button>
        <button
          onClick={() => setActiveSubTab('brands')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'brands'
              ? 'bg-accent-600 text-white shadow-xs'
              : 'bg-white dark:bg-ink-800 text-ink-600 dark:text-cream-300 hover:bg-cream-100 border border-cream-200 dark:border-ink-700'
          }`}
        >
          <Tag size={16} />
          Thương hiệu / Hãng ({brands.length})
        </button>
      </div>

      {activeSubTab === 'categories' ? (
        <>
          {/* 1. TOP HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight">
                Quản lý Danh mục Sản phẩm
              </h2>
              <p className="text-sm text-ink-500 mt-0.5">
                Phân loại máy ảnh mirrorless, DSLR, compact, ống kính và phụ kiện nhiếp ảnh
              </p>
            </div>

            <button
              onClick={onOpenAddCategory}
              className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={18} />
              Thêm danh mục mới
            </button>
          </div>

          {/* 2. STATS PILL BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center font-bold">
                <Layers size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-400 uppercase">Tổng danh mục</p>
                <p className="text-xl font-bold text-ink-900 mt-0.5">{categories.length} phân loại</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Package size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-400 uppercase">Sản phẩm đã phân loại</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">{totalProducts} sản phẩm</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-400 uppercase">Trạng thái danh mục</p>
                <p className="text-base font-bold text-ink-900 mt-0.5 text-purple-700">100% Hoạt động</p>
              </div>
            </div>
          </div>

          {/* 3. CATEGORIES CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCategories.map((c, idx) => {
              const Icon = getCategoryIcon(c.slug, c.icon);
              const theme = getCategoryTheme(idx);

              return (
                <div
                  key={c.id}
                  className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${theme.bg} ${theme.text} rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-xs font-bold text-ink-700 dark:text-cream-200 bg-cream-100/80 dark:bg-ink-800 px-3 py-1 rounded-full border border-cream-200 dark:border-ink-700">
                        {c.products_count !== undefined ? c.products_count : 0} sản phẩm
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-display font-bold text-ink-900 dark:text-cream-50 text-lg group-hover:text-accent-600 transition-colors mb-1.5">
                      {c.name}
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed line-clamp-3 mb-6">
                      {c.description || 'Chưa có mô tả chi tiết cho danh mục này.'}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-4 border-t border-cream-100 dark:border-ink-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink-400 dark:text-ink-500">
                      Slug: <code className="bg-cream-100 dark:bg-ink-800 px-1.5 py-0.5 rounded text-ink-700 dark:text-cream-300 font-mono text-[11px]">{c.slug}</code>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenEditCategory(c)}
                        className="p-2 rounded-xl bg-cream-100 dark:bg-ink-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-ink-600 dark:text-cream-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        title="Chỉnh sửa danh mục"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(c.id)}
                        className="p-2 rounded-xl bg-cream-100 dark:bg-ink-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-ink-600 dark:text-cream-300 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Xóa danh mục"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ADD NEW CATEGORY PLACEHOLDER CARD */}
            <button
              onClick={onOpenAddCategory}
              className="border-2 border-dashed border-cream-300 dark:border-ink-700 hover:border-accent-400 dark:hover:border-accent-400 bg-cream-50/50 dark:bg-ink-900/60 hover:bg-accent-50/20 dark:hover:bg-accent-500/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-all group cursor-pointer min-h-[220px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-ink-800 border border-cream-300 dark:border-ink-700 group-hover:border-accent-400 flex items-center justify-center text-accent-500 shadow-2xs group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div>
                <p className="font-display font-bold text-ink-900 dark:text-cream-50 text-base group-hover:text-accent-600 transition-colors">
                  Thêm danh mục mới
                </p>
                <p className="text-xs text-ink-400 dark:text-ink-400 mt-1 max-w-[200px]">
                  Tạo mới phân loại máy ảnh, ống kính hoặc thiết bị phụ trợ
                </p>
              </div>
            </button>
          </div>

          {/* Categories Pagination Toolbar */}
          {categories.length > itemsPerPage && (
            <div className="bg-white dark:bg-ink-900 rounded-2xl border border-cream-200 dark:border-ink-800 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3 text-xs text-ink-600 dark:text-ink-400 font-medium">
                <div>
                  Hiển thị <span className="font-bold text-ink-900 dark:text-cream-50">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                  <span className="font-bold text-ink-900 dark:text-cream-50">{Math.min(currentPage * itemsPerPage, categories.length)}</span> trên{' '}
                  <span className="font-bold text-ink-900 dark:text-cream-50">{categories.length}</span> danh mục
                </div>

                <div className="flex items-center gap-1.5 border-l border-cream-200 dark:border-ink-800 pl-3">
                  <span className="text-[11px] text-ink-400">Hiển thị:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-lg text-xs font-bold text-ink-800 dark:text-cream-100 focus:outline-none focus:border-accent-500 cursor-pointer shadow-2xs"
                  >
                    <option value={6}>6 mục / trang</option>
                    <option value={12}>12 mục / trang</option>
                    <option value={24}>24 mục / trang</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-800 text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                  >
                    ‹ Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-accent-600 text-white shadow-xs'
                          : 'bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 border border-cream-300 dark:border-ink-700 hover:bg-cream-100 dark:hover:bg-ink-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-800 text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                  >
                    Sau ›
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* BRANDS SUBTAB */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight">
                Quản lý Thương hiệu & Hãng sản xuất
              </h2>
              <p className="text-sm text-ink-500 mt-0.5">
                Các thương hiệu máy ảnh, ống kính và phụ kiện (Sony, Canon, Fujifilm, Nikon, DJI, Hasselblad...)
              </p>
            </div>

            <button
              onClick={handleOpenAddBrand}
              className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={18} />
              Thêm thương hiệu mới
            </button>
          </div>

          {/* BRANDS STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-400 uppercase">Tổng thương hiệu</p>
                <p className="text-xl font-bold text-ink-900 mt-0.5">{brands.length} hãng</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Package size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-400 uppercase">Hãng có sản phẩm</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">
                  {brands.filter((b) => (b.products_count || 0) > 0).length} hãng
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-400 uppercase">Sản phẩm liên kết</p>
                <p className="text-xl font-bold text-purple-700 mt-0.5">
                  {brands.reduce((sum, b) => sum + (b.products_count || 0), 0)} sản phẩm
                </p>
              </div>
            </div>
          </div>

          {/* BRANDS CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBrands.map((b, idx) => {
              const theme = getBrandTheme(idx);

              return (
                <div
                  key={b.id}
                  className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Brand Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${theme.bg} ${theme.text} rounded-2xl flex items-center justify-center font-display font-bold text-lg shadow-2xs group-hover:scale-110 transition-transform`}>
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-ink-700 dark:text-cream-200 bg-cream-100/80 dark:bg-ink-800 px-3 py-1 rounded-full border border-cream-200 dark:border-ink-700">
                        {b.products_count !== undefined ? b.products_count : 0} sản phẩm
                      </span>
                    </div>

                    {/* Brand Title & Description */}
                    <h3 className="font-display font-bold text-ink-900 dark:text-cream-50 text-lg group-hover:text-accent-600 transition-colors mb-1.5">
                      {b.name}
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed line-clamp-3 mb-6">
                      {b.description || 'Chưa có mô tả chi tiết cho thương hiệu này.'}
                    </p>
                  </div>

                  {/* Brand Footer Actions */}
                  <div className="pt-4 border-t border-cream-100 dark:border-ink-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink-400 dark:text-ink-500">
                      Slug: <code className="bg-cream-100 dark:bg-ink-800 px-1.5 py-0.5 rounded text-ink-700 dark:text-cream-300 font-mono text-[11px]">{b.slug}</code>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditBrand(b)}
                        className="p-2 rounded-xl bg-cream-100 dark:bg-ink-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-ink-600 dark:text-cream-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        title="Chỉnh sửa thương hiệu"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(b)}
                        className="p-2 rounded-xl bg-cream-100 dark:bg-ink-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-ink-600 dark:text-cream-300 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Xóa thương hiệu"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ADD BRAND PLACEHOLDER CARD */}
            <button
              onClick={handleOpenAddBrand}
              className="border-2 border-dashed border-cream-300 dark:border-ink-700 hover:border-accent-400 dark:hover:border-accent-400 bg-cream-50/50 dark:bg-ink-900/60 hover:bg-accent-50/20 dark:hover:bg-accent-500/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-all group cursor-pointer min-h-[220px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-ink-800 border border-cream-300 dark:border-ink-700 group-hover:border-accent-400 flex items-center justify-center text-accent-500 shadow-2xs group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div>
                <p className="font-display font-bold text-ink-900 dark:text-cream-50 text-base group-hover:text-accent-600 transition-colors">
                  Thêm thương hiệu mới
                </p>
                <p className="text-xs text-ink-400 dark:text-ink-400 mt-1 max-w-[200px]">
                  Tạo mới hãng máy ảnh, ống kính hoặc thiết bị phụ trợ
                </p>
              </div>
            </button>
          </div>

          {/* Brands Pagination Toolbar */}
          {brands.length > brandItemsPerPage && (
            <div className="bg-white dark:bg-ink-900 rounded-2xl border border-cream-200 dark:border-ink-800 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3 text-xs text-ink-600 dark:text-ink-400 font-medium">
                <div>
                  Hiển thị <span className="font-bold text-ink-900 dark:text-cream-50">{(brandPage - 1) * brandItemsPerPage + 1}</span> -{' '}
                  <span className="font-bold text-ink-900 dark:text-cream-50">{Math.min(brandPage * brandItemsPerPage, brands.length)}</span> trên{' '}
                  <span className="font-bold text-ink-900 dark:text-cream-50">{brands.length}</span> thương hiệu
                </div>

                <div className="flex items-center gap-1.5 border-l border-cream-200 dark:border-ink-800 pl-3">
                  <span className="text-[11px] text-ink-400">Hiển thị:</span>
                  <select
                    value={brandItemsPerPage}
                    onChange={(e) => {
                      setBrandItemsPerPage(Number(e.target.value));
                      setBrandPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-lg text-xs font-bold text-ink-800 dark:text-cream-100 focus:outline-none focus:border-accent-500 cursor-pointer shadow-2xs"
                  >
                    <option value={6}>6 mục / trang</option>
                    <option value={12}>12 mục / trang</option>
                    <option value={24}>24 mục / trang</option>
                  </select>
                </div>
              </div>

              {totalBrandPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setBrandPage(Math.max(1, brandPage - 1))}
                    disabled={brandPage === 1}
                    className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-800 text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                  >
                    ‹ Trước
                  </button>
                  {Array.from({ length: totalBrandPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setBrandPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        brandPage === pageNum
                          ? 'bg-accent-600 text-white shadow-xs'
                          : 'bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 border border-cream-300 dark:border-ink-700 hover:bg-cream-100 dark:hover:bg-ink-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setBrandPage(Math.min(totalBrandPages, brandPage + 1))}
                    disabled={brandPage === totalBrandPages}
                    className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-800 text-xs font-semibold text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                  >
                    Sau ›
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Brand Modal */}
      <BrandFormModal
        show={brandModalOpen}
        editingBrand={editingBrand}
        formData={brandFormData}
        setFormData={setBrandFormData}
        onSubmit={handleSubmitBrand}
        onClose={() => setBrandModalOpen(false)}
        loading={brandSubmitting}
      />
    </div>
  );
};
