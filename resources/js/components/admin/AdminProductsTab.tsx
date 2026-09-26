import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Boxes,
} from 'lucide-react';
import type { Product, Category } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { GlidingIndicator } from '../ui/GlidingIndicator';
import { AdminInventoryModal } from './AdminInventoryModal';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleStatus: (product: Product) => void;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'outofstock';
type SortOption = 'newest' | 'price-desc' | 'price-asc' | 'stock-asc' | 'stock-desc';

const MOCK_ADMIN_PRODUCTS: Product[] = [
  {
    id: 'prod-mock-1',
    name: 'Sony Alpha A7 IV (Body Only)',
    slug: 'sony-alpha-a7-iv',
    category_id: '1',
    category: { id: '1', name: 'Máy Ảnh Mirrorless', slug: 'may-anh-mirrorless' },
    brand: 'Sony',
    price: 52990000,
    original_price: 59990000,
    stock: 14,
    description: 'Máy ảnh full-frame chuyên nghiệp 33MP với khả năng quay 4K 60p 10-bit 4:2:2.',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    rating: 4.9,
    reviews_count: 28,
  },
  {
    id: 'prod-mock-2',
    name: 'Canon EOS R6 Mark II Body',
    slug: 'canon-eos-r6-mark-ii',
    category_id: '1',
    category: { id: '1', name: 'Máy Ảnh Mirrorless', slug: 'may-anh-mirrorless' },
    brand: 'Canon',
    price: 58500000,
    original_price: 64900000,
    stock: 4,
    description: 'Cảm biến 24.2MP CMOS, chụp liên tiếp 40fps, lấy nét Dual Pixel CMOS AF II.',
    image_url: 'https://images.unsplash.com/photo-1502982720700-bfff97f2da8d?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    rating: 4.8,
    reviews_count: 19,
  },
  {
    id: 'prod-mock-3',
    name: 'Fujifilm X-T5 Silver',
    slug: 'fujifilm-x-t5-silver',
    category_id: '1',
    category: { id: '1', name: 'Máy Ảnh Mirrorless', slug: 'may-anh-mirrorless' },
    brand: 'Fujifilm',
    price: 43900000,
    original_price: 46900000,
    stock: 0,
    description: 'Thiết kế hoài cổ, cảm biến X-Trans CMOS 5 HR 40.2MP, chống rung 5 trục 7 stops.',
    image_url: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80',
    status: 'inactive',
    rating: 4.7,
    reviews_count: 15,
  },
  {
    id: 'prod-mock-4',
    name: 'DJI Mini 4 Pro Fly More Combo',
    slug: 'dji-mini-4-pro-fly-more-combo',
    category_id: '2',
    category: { id: '2', name: 'Flycam & Gimbal', slug: 'flycam-gimbal' },
    brand: 'DJI',
    price: 21990000,
    original_price: 23990000,
    stock: 8,
    description: 'Flycam siêu nhẹ dưới 249g, cảm biến vật cản đa hướng, quay 4K/60fps HDR.',
    image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    rating: 5.0,
    reviews_count: 32,
  },
];

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  categories,
  loading,
  onOpenAddModal,
  onOpenEditModal,
  onViewProduct,
  onDeleteProduct,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [adminPageNum, setAdminPageNum] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showInventoryLedger, setShowInventoryLedger] = useState(false);

  // Active products with mock fallback if no database products
  const activeProducts = useMemo(() => {
    return products && products.length > 0 ? products : MOCK_ADMIN_PRODUCTS;
  }, [products]);

  // Reset page when filters change
  useEffect(() => {
    setAdminPageNum(1);
  }, [searchQuery, selectedCategoryFilter, selectedBrandFilter, statusFilter, sortOption]);

  // Derived stats
  const activeCount = activeProducts.filter((p) => p.status === 'active' && p.stock > 0).length;
  const inactiveCount = activeProducts.filter((p) => p.status === 'inactive').length;
  const outOfStockCount = activeProducts.filter((p) => p.stock <= 0).length;
  const totalStockValue = activeProducts.reduce((acc, p) => acc + p.price * p.stock, 0);

  // Brands list from products
  const brandsList = useMemo(() => {
    const set = new Set<string>();
    activeProducts.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [activeProducts]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let result = activeProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = !selectedCategoryFilter || p.category_id === selectedCategoryFilter;
      const matchesBrand =
        !selectedBrandFilter || p.brand.toLowerCase() === selectedBrandFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = p.status === 'active' && p.stock > 0;
      } else if (statusFilter === 'inactive') {
        matchesStatus = p.status === 'inactive';
      } else if (statusFilter === 'outofstock') {
        matchesStatus = p.stock <= 0;
      }

      return matchesSearch && matchesCat && matchesBrand && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'stock-asc') return a.stock - b.stock;
      if (sortOption === 'stock-desc') return b.stock - a.stock;
      return 0; // Default order
    });

    return result;
  }, [products, searchQuery, selectedCategoryFilter, selectedBrandFilter, statusFilter, sortOption]);

  const totalAdminPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedAdminProducts = filteredProducts.slice(
    (adminPageNum - 1) * itemsPerPage,
    adminPageNum * itemsPerPage
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('');
    setSelectedBrandFilter('');
    setStatusFilter('all');
    setSortOption('newest');
  };

  const handlePageChange = (newPage: number) => {
    setAdminPageNum(newPage);
    document.querySelector('main')?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP HEADER WITH STATS SUMMARY */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight">
            Quản lý Sản phẩm Camera
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Quản lý danh sách máy ảnh mirrorless, DSLR, compact, ống kính và thông số bán hàng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowInventoryLedger(true)}
            className="px-4 py-2.5 rounded-2xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 hover:border-accent-500 hover:text-accent-600 dark:hover:text-accent-400 flex items-center gap-2 text-sm font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Boxes size={18} className="text-accent-500" />
            <span>Sổ cái Biến động Kho</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Đăng sản phẩm mới
          </button>
        </div>
      </div>

      {/* 2. STATS MINI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center font-bold">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Tổng sản phẩm</p>
            <p className="text-xl font-bold text-ink-900 mt-0.5">{products.length} SP</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Đang kinh doanh</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{activeCount} SP</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Hết hàng / Tạm ẩn</p>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{outOfStockCount + inactiveCount} SP</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Giá trị kho ước tính</p>
            <p className="text-lg font-bold text-ink-900 mt-0.5 truncate">{formatCurrency(totalStockValue)}</p>
          </div>
        </div>
      </div>

      {/* 3. ADVANCED FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-xs space-y-4">
        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cream-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold" role="tablist" aria-label="Bộ lọc tình trạng kho hàng">
            {[
              { id: 'all' as StatusFilter, label: 'Tất cả', count: products.length, activeBg: 'bg-ink-900 dark:bg-accent-500' },
              { id: 'active' as StatusFilter, label: 'Đang bán', count: activeCount, activeBg: 'bg-emerald-600 dark:bg-emerald-500' },
              { id: 'outofstock' as StatusFilter, label: 'Hết hàng', count: outOfStockCount, activeBg: 'bg-rose-600 dark:bg-rose-500' },
              { id: 'inactive' as StatusFilter, label: 'Tạm ẩn', count: inactiveCount, activeBg: 'bg-amber-600 dark:bg-amber-500' },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer select-none outline-none ${
                    isActive
                      ? 'text-white'
                      : 'bg-cream-100/70 text-ink-600 hover:bg-cream-200 dark:bg-ink-800 dark:text-cream-300 dark:hover:bg-ink-700'
                  }`}
                >
                  {isActive && (
                    <GlidingIndicator
                      layoutId="admin-products-status-pill"
                      className={`inset-0 ${tab.activeBg} rounded-xl shadow-xs`}
                    />
                  )}
                  <span className="relative z-10">{tab.label} ({tab.count})</span>
                </button>
              );
            })}
          </div>

          {(searchQuery || selectedCategoryFilter || selectedBrandFilter || statusFilter !== 'all') && (
            <button
              onClick={resetAllFilters}
              className="text-xs font-semibold text-accent-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw size={13} /> Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Search & Select Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-5">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên máy ảnh, ống kính, thương hiệu..."
              className="w-full pl-10 pr-4 py-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white transition-all text-ink-800 placeholder:text-ink-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 text-ink-700 font-medium"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 text-ink-700 font-medium"
            >
              <option value="">Tất cả hãng</option>
              {brandsList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 text-ink-700 font-medium"
            >
              <option value="newest">Mới nhất</option>
              <option value="price-desc">Giá: Cao → Thấp</option>
              <option value="price-asc">Giá: Thấp → Cao</option>
              <option value="stock-asc">Kho: Ít → Nhiều</option>
              <option value="stock-desc">Kho: Nhiều → Ít</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. DATA TABLE */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100/70 dark:bg-ink-950/60 border-b border-cream-200 dark:border-ink-800 text-[11px] font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider whitespace-nowrap">
                <th className="py-4 px-6">SẢN PHẨM</th>
                <th className="py-4 px-6">DANH MỤC</th>
                <th className="py-4 px-6">GIÁ BÁN</th>
                <th className="py-4 px-6">TỒN KHO</th>
                <th className="py-4 px-6">TRẠNG THÁI</th>
                <th className="py-4 px-6 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 dark:divide-ink-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-ink-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-accent-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-ink-500">Đang tải dữ liệu sản phẩm...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-ink-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package size={36} className="text-cream-300" />
                      <p className="font-bold text-ink-700">Không tìm thấy sản phẩm nào</p>
                      <p className="text-xs text-ink-400">Vui lòng thử tìm kiếm hoặc điều chỉnh lại bộ lọc</p>
                      <button
                        onClick={resetAllFilters}
                        className="mt-2 text-xs font-bold text-accent-600 hover:underline"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAdminProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= 5;
                  const discountPercent =
                    p.original_price && p.original_price > p.price
                      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
                      : 0;

                  return (
                    <tr key={p.id} className="hover:bg-cream-50/80 dark:hover:bg-ink-800/40 transition-colors group">
                      {/* Product details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5 min-w-[260px]">
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-cream-300 dark:border-ink-700 bg-cream-50 dark:bg-ink-800 shrink-0 group-hover:scale-105 transition-transform">
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-ink-900 dark:text-cream-50 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors line-clamp-1">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-bold text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/60 border border-accent-200/40 dark:border-accent-800/40 px-2 py-0.5 rounded-md uppercase">
                                {p.brand}
                              </span>
                              <span className="text-[11px] text-ink-400 truncate">Mã: {p.slug.substring(0, 16)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-cream-100/90 dark:bg-ink-800 text-ink-700 dark:text-cream-200 text-xs font-semibold px-3 py-1 rounded-xl border border-cream-200/80 dark:border-ink-700">
                          {(p as any).category_name || 'Camera'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div>
                          <p className="font-display font-bold text-ink-900 dark:text-cream-50 text-base">
                            {formatCurrency(p.price)}
                          </p>
                          {discountPercent > 0 && p.original_price && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-ink-400 line-through">
                                {formatCurrency(p.original_price)}
                              </span>
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                                -{discountPercent}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1.5 min-w-[110px]">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={isOutOfStock ? 'text-rose-600 dark:text-rose-400' : isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
                              {isOutOfStock ? 'Hết hàng (0)' : isLowStock ? `Sắp hết (${p.stock})` : `Còn hàng (${p.stock})`}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-24 h-1.5 bg-cream-200 dark:bg-ink-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (p.stock / 20) * 100)}%` }}
                              className={`h-full rounded-full ${
                                isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(p)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-2xs cursor-pointer ${
                            isOutOfStock
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                              : p.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                          }`}
                          title="Bấm để chuyển đổi trạng thái hiển thị"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isOutOfStock ? 'bg-rose-600' : p.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{isOutOfStock ? 'Hết hàng' : p.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewProduct(p)}
                            className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-700 hover:text-ink-900 dark:text-cream-200 transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(p)}
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 size={15} />
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

        {/* 5. PAGINATION CONTROLS */}
        {filteredProducts.length > 0 && (
          <div className="p-4 px-6 bg-cream-50/80 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex items-center gap-3 text-xs text-ink-600 font-medium">
              <div>
                Hiển thị <span className="font-bold text-ink-900">{(adminPageNum - 1) * itemsPerPage + 1}</span> -{' '}
                <span className="font-bold text-ink-900">{Math.min(adminPageNum * itemsPerPage, filteredProducts.length)}</span> trên{' '}
                <span className="font-bold text-ink-900">{filteredProducts.length}</span> sản phẩm
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
                  <option value={5}>5 sản phẩm / trang</option>
                  <option value={10}>10 sản phẩm / trang</option>
                  <option value={20}>20 sản phẩm / trang</option>
                  <option value={50}>50 sản phẩm / trang</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(1, adminPageNum - 1))}
                disabled={adminPageNum === 1}
                className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              >
                ‹ Trước
              </button>

              {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
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
                className="px-3.5 py-1.5 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              >
                Sau ›
              </button>
            </div>
          </div>
        )}
      </div>

      <AdminInventoryModal
        isOpen={showInventoryLedger}
        onClose={() => setShowInventoryLedger(false)}
      />
    </div>
  );
};
