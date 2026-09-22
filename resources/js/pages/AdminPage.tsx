import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Zap,
  ArrowLeft,
  AlertCircle,
  Camera,
  LogOut,
} from 'lucide-react';
import type { Product, Category, Order, Page } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { AdminSidebar, type AdminTab } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminDashboardTab } from '../components/admin/AdminDashboardTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminReportsTab } from '../components/admin/AdminReportsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminChatTab } from '../components/admin/AdminChatTab';
import { AdminReviewsTab } from '../components/admin/AdminReviewsTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import {
  ProductFormModal,
  DeleteConfirmModal,
  ProductViewModal,
  CategoryFormModal,
  OrderViewModal,
} from '../components/admin/AdminModals';

interface AdminPageProps {
  onNavigate: (page: Page) => void;
  initialTab?: AdminTab;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, initialTab = 'dashboard' }) => {
  const { user, login, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const toast = useToast();

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    const targetUrl = tab === 'dashboard' ? '/admin' : `/admin?tab=${tab}`;
    window.history.replaceState(null, '', targetUrl);
  };

  // Admin Login Screen State
  const [adminEmail, setAdminEmail] = useState('admin@camerahub.vn');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Auto-dismiss login error in 3.5s
  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => {
        setLoginError(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [loginError]);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Product Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    category_id: '',
    brand: 'Sony',
    price: '',
    original_price: '',
    stock: '10',
    description: '',
    image_url: '',
    status: 'active',
    gallery: [] as string[],
    features: [] as string[],
    specs: [] as { key: string; value: string }[],
  });

  // Category Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });

  // Order Detail Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats, ords] = await Promise.all([
        api.getProducts({ sort: 'newest' }),
        api.getCategories(),
        api.getAdminOrders().catch(() => []),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      setOrders(ords || []);
      if (cats && cats.length > 0 && !productFormData.category_id) {
        setProductFormData((prev) => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  // Handle Admin Login Submit
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);

    try {
      const res = await login(adminEmail, adminPassword);
      if (res.user.role !== 'admin') {
        setLoginError('Tài khoản này không có quyền Quản trị viên (Admin).');
      } else {
        toast.success(`Chào mừng Quản trị viên ${res.user.fullName}!`);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Tài khoản hoặc mật khẩu Quản trị không chính xác.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleFillAdminCredentials = () => {
    setAdminEmail('admin@camerahub.vn');
    setAdminPassword('admin123');
    setLoginError(null);
  };

  // PRODUCT HANDLERS
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      category_id: categories[0]?.id || '',
      brand: 'Sony',
      price: '',
      original_price: '',
      stock: '10',
      description: '',
      image_url: '',
      status: 'active',
      gallery: [],
      features: [''],
      specs: [{ key: 'Cảm biến', value: '' }],
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductFormData({
      name: p.name,
      category_id: p.category_id,
      brand: p.brand || 'Sony',
      price: p.price.toString(),
      original_price: p.original_price?.toString() || '',
      stock: p.stock.toString(),
      description: p.description || '',
      image_url: p.image_url,
      status: p.status,
      gallery: p.gallery || [],
      features: p.features && p.features.length > 0 ? p.features : [''],
      specs: p.specs && p.specs.length > 0 ? p.specs : [{ key: 'Cảm biến', value: '' }],
    });
    setShowProductModal(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: productFormData.name,
        category_id: productFormData.category_id,
        brand: productFormData.brand,
        price: Number(productFormData.price),
        original_price: productFormData.original_price ? Number(productFormData.original_price) : undefined,
        stock: Number(productFormData.stock),
        description: productFormData.description,
        image_url: productFormData.image_url,
        status: productFormData.status,
        gallery: productFormData.gallery.filter(Boolean),
        features: productFormData.features.filter(Boolean),
        specs: productFormData.specs.filter((s) => s.key && s.value),
      };

      if (editingProduct) {
        await api.updateAdminProduct(editingProduct.id, payload);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await api.createAdminProduct(payload);
        toast.success('Thêm mới sản phẩm thành công!');
      }

      setShowProductModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu thông tin sản phẩm.');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    try {
      await api.deleteAdminProduct(deletingProductId);
      toast.success('Đã xóa sản phẩm khỏi cơ sở dữ liệu!');
      setDeletingProductId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa sản phẩm.');
    }
  };

  // CATEGORY HANDLERS
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCategoryFormData({ name: c.name, description: c.description || '' });
    setShowCategoryModal(true);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateAdminCategory(editingCategory.id, categoryFormData);
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await api.createAdminCategory(categoryFormData);
        toast.success('Thêm mới phân loại danh mục thành công!');
      }
      setShowCategoryModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu danh mục.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    try {
      await api.deleteAdminCategory(deletingCategoryId);
      toast.success('Đã xóa danh mục!');
      setDeletingCategoryId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa danh mục đang chứa sản phẩm.');
    }
  };

  // ORDER STATUS HANDLERS
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled'
  ) => {
    try {
      await api.updateAdminOrderStatus(orderId, status);
      toast.success('Đã cập nhật trạng thái đơn hàng!');
      loadData();
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder({ ...viewingOrder, status });
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái đơn hàng.');
    }
  };

  // Loading state while restoring session
  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-ink-600">Đang khởi tạo phiên Quản trị...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: DEDICATED ADMIN LOGIN (Warm Theme matching Main Web)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Subtle Warm Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-accent-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cream-300/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-white border border-cream-200 rounded-[28px] p-8 sm:p-10 shadow-xl space-y-6 animate-scale-up">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-accent-50 border border-accent-200 text-accent-600 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck size={28} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream-100 border border-cream-200 rounded-full text-[11px] font-bold text-ink-700 mt-1">
              <Camera size={13} className="text-accent-500" />
              <span>CameraHub Security Portal</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight">
              Đăng Nhập Quản Trị
            </h2>
            <p className="text-xs text-ink-500">
              Vui lòng xác thực tài khoản Admin để truy cập Bảng điều khiển
            </p>
          </div>

          {/* Error Banner with Auto-Dismiss */}
          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in shadow-2xs">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span className="font-medium">{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1.5">Email Quản Trị</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@camerahub.vn"
                  className="w-full pl-11 pr-4 py-3 bg-cream-50/70 border border-cream-200 rounded-2xl text-sm text-ink-900 focus:outline-none focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-500/15 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1.5">Mật Khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị..."
                  className="w-full pl-11 pr-4 py-3 bg-cream-50/70 border border-cream-200 rounded-2xl text-sm text-ink-900 focus:outline-none focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-500/15 transition-all font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full btn-accent py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
            >
              {isSubmittingLogin ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Truy Cập Dashboard</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* 1-Click Demo Fill Button */}
            <button
              type="button"
              onClick={handleFillAdminCredentials}
              className="w-full py-2.5 rounded-2xl border border-cream-200 bg-cream-50 hover:bg-cream-100 text-xs font-bold text-ink-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <span>Điền nhanh tài khoản Admin mẫu</span>
            </button>
          </form>

          {/* Return to storefront */}
          <div className="pt-2 text-center border-t border-cream-100">
            <button
              type="button"
              onClick={() => onNavigate({ name: 'home' })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Quay lại trang mua sắm</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACCESS DENIED (Logged in as normal customer)
  // -------------------------------------------------------------
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-cream-200 shadow-xl text-center space-y-5 animate-scale-up">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-ink-900">Không Có Quyền Truy Cập</h3>
            <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
              Tài khoản hiện tại <strong>{user.email}</strong> là tài khoản Khách hàng và không có quyền truy cập vào Bảng điều khiển Quản trị.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                logout();
              }}
              className="btn-primary w-full py-2.5 text-xs font-bold cursor-pointer"
            >
              <LogOut size={15} />
              <span>Đăng xuất & Đăng nhập bằng tài khoản Admin</span>
            </button>
            <button
              onClick={() => onNavigate({ name: 'home' })}
              className="btn-secondary w-full py-2.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Quay lại trang mua sắm</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: FULL ADMIN DASHBOARD (Fixed Full-Height Sticky Navbar)
  // -------------------------------------------------------------
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-cream-100 antialiased">
      {/* FIXED FULL-HEIGHT SIDEBAR */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onNavigate={onNavigate}
        orderCount={orders.filter((o) => o.status === 'pending' || o.status === 'processing').length}
      />

      {/* RIGHT CONTENT AREA: Independently Scrollable */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto bg-cream-100">
        <AdminHeader onNavigate={onNavigate} />

        <main className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              products={products}
              orders={orders}
              setActiveTab={handleTabChange}
              onOpenAddProduct={handleOpenAddProduct}
              onOpenAddCategory={handleOpenAddCategory}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductsTab
              products={products}
              categories={categories}
              loading={loading}
              onOpenAdd={handleOpenAddProduct}
              onOpenEdit={handleOpenEditProduct}
              onOpenDelete={setDeletingProductId}
              onOpenView={setViewingProduct}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategoriesTab
              categories={categories}
              products={products}
              onOpenAdd={handleOpenAddCategory}
              onOpenEdit={handleOpenEditCategory}
              onOpenDelete={setDeletingCategoryId}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              orders={orders}
              onUpdateStatus={handleUpdateOrderStatus}
              onViewOrder={setViewingOrder}
              onRefreshOrders={loadData}
            />
          )}

          {activeTab === 'reports' && <AdminReportsTab />}

          {activeTab === 'users' && <AdminUsersTab />}

          {activeTab === 'chat' && <AdminChatTab />}

          {activeTab === 'reviews' && <AdminReviewsTab />}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              onSaveSuccess={() =>
                toast.success('Cài đặt hệ thống cửa hàng đã được lưu thành công!')
              }
            />
          )}
        </main>

        <footer className="py-6 border-t border-cream-200 text-center text-xs text-ink-400 bg-white flex-shrink-0">
          © 2026 CameraHub Management System - Laravel 11 & React 18 Architecture
        </footer>
      </div>

      {/* ALL MODALS */}
      <ProductFormModal
        show={showProductModal}
        editingProduct={editingProduct}
        categories={categories}
        formData={productFormData}
        setFormData={setProductFormData}
        onSubmit={handleSubmitProduct}
        onClose={() => setShowProductModal(false)}
      />

      {deletingProductId && (
        <DeleteConfirmModal
          title="Xác nhận xóa sản phẩm?"
          message="Hành động này sẽ xóa sản phẩm khỏi hệ thống và không thể khôi phục."
          onConfirm={handleDeleteProduct}
          onClose={() => setDeletingProductId(null)}
        />
      )}

      <ProductViewModal product={viewingProduct} onClose={() => setViewingProduct(null)} />

      <CategoryFormModal
        show={showCategoryModal}
        editingCategory={editingCategory}
        formData={categoryFormData}
        setFormData={setCategoryFormData}
        onSubmit={handleSubmitCategory}
        onClose={() => setShowCategoryModal(false)}
      />

      {deletingCategoryId && (
        <DeleteConfirmModal
          title="Xóa danh mục này?"
          message="Lưu ý: Thao tác này sẽ xóa phân loại khỏi hệ thống!"
          onConfirm={handleDeleteCategory}
          onClose={() => setDeletingCategoryId(null)}
        />
      )}

      <OrderViewModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
    </div>
  );
};
