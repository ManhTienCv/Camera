import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModal } from './components/AuthModal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { CompareTray } from './components/CompareTray';
import { CameraSelectorModal } from './components/CameraSelectorModal';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { api } from './lib/api';
import type { Page, Category } from './types';

// Import trực tiếp các trang chính của người dùng để chuyển trang tức thì (0ms latency, không chờ nạp chunk)
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { ComparePage } from './pages/ComparePage';
import { WarrantyLookupPage } from './pages/WarrantyLookupPage';


// Chỉ tải lười (lazy) đối với trang Quản trị (Admin) vì dung lượng lớn và chỉ dành cho Admin
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

// Loading Spinner tinh gọn chỉ dành cho lúc nạp trang Admin
const PageFallback: React.FC = () => (
  <div className="flex-1 min-h-[55vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="relative w-9 h-9">
      <div className="absolute inset-0 rounded-full border-2 border-cream-200 dark:border-ink-800" />
      <div className="absolute inset-0 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
    </div>
    <span className="text-xs font-semibold text-ink-400 dark:text-cream-400 animate-pulse tracking-wide">
      Đang tải trang quản trị...
    </span>
  </div>
);

// Helper to parse page from current browser URL
const parseLocation = (): Page => {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);

  if (path.startsWith('/admin')) {
    const tab = (search.get('tab') as any) || 'dashboard';
    return { name: 'admin', tab };
  }
  if (path.startsWith('/catalog')) {
    return {
      name: 'catalog',
      categorySlug: search.get('cat') || undefined,
      brand: search.get('brand') || undefined,
    };
  }
  if (path.startsWith('/product/')) {
    const slug = path.replace('/product/', '');
    return { name: 'product', slug };
  }
  if (path.startsWith('/cart')) {
    return { name: 'cart' };
  }
  if (path.startsWith('/checkout')) {
    return { name: 'checkout' };
  }
  if (path.startsWith('/order-success')) {
    return { name: 'order-success', orderId: search.get('id') || undefined };
  }
  if (path.startsWith('/orders')) {
    return { name: 'orders' };
  }
  if (path.startsWith('/profile')) {
    const tab = (search.get('tab') as any) || 'profile';
    return { name: 'profile', tab };
  }
  if (path.startsWith('/search')) {
    return { name: 'search', query: search.get('q') || '' };
  }
  if (path.startsWith('/compare')) {
    const idsParam = search.get('ids');
    const ids = idsParam ? idsParam.split(',').filter(Boolean) : undefined;
    return { name: 'compare', ids };
  }
  if (path.startsWith('/warranty') || path.startsWith('/tra-cuu-bao-hanh')) {
    return { name: 'warranty' };
  }
  return { name: 'home' };
};

// Component xử lý thông báo sau khi Google chuyển hướng về ứng dụng
const GoogleAuthHandler: React.FC = () => {
  const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('google_token');
    const googleName = params.get('google_name');
    const authError = params.get('auth_error');

    if (googleToken) {
      toast.success(
        googleName
          ? `Đăng nhập Google thành công! Chào mừng ${decodeURIComponent(googleName)}.`
          : 'Đăng nhập thành công qua tài khoản Google!'
      );
    } else if (authError) {
      toast.error(decodeURIComponent(authError));
    }
  }, [toast]);

  return null;
};

export default function App() {
  const [page, setPage] = useState<Page>(() => parseLocation());
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectorModalOpen, setSelectorModalOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleOpenSelector = () => setSelectorModalOpen(true);
    window.addEventListener('camerahub_open_selector', handleOpenSelector);
    return () => window.removeEventListener('camerahub_open_selector', handleOpenSelector);
  }, []);


  useEffect(() => {
    (async () => {
      try {
        const data = await api.getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch categories:', e);
        setCategories([]);
      }
    })();
  }, []);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setPage(parseLocation());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Tự động kích hoạt tỉ lệ thu nhỏ -10% khi truy cập trang admin
  useEffect(() => {
    if (page.name === 'admin') {
      document.documentElement.classList.add('admin-mode');
    } else {
      document.documentElement.classList.remove('admin-mode');
    }
  }, [page.name]);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    // Tự động cuộn ngay về đầu trang
    window.scrollTo(0, 0);

    // Sync browser URL bar so reloads (F5) stay on the exact same page/tab
    let targetUrl = '/';
    if (p.name === 'admin') {
      targetUrl = p.tab && p.tab !== 'dashboard' ? `/admin?tab=${p.tab}` : '/admin';
    } else if (p.name === 'catalog') {
      const params = new URLSearchParams();
      if (p.categorySlug) params.set('cat', p.categorySlug);
      if (p.brand) params.set('brand', p.brand);
      const q = params.toString();
      targetUrl = q ? `/catalog?${q}` : '/catalog';
    } else if (p.name === 'product') {
      targetUrl = `/product/${p.slug}`;
    } else if (p.name === 'cart') {
      targetUrl = '/cart';
    } else if (p.name === 'checkout') {
      targetUrl = '/checkout';
    } else if (p.name === 'order-success') {
      targetUrl = p.orderId ? `/order-success?id=${p.orderId}` : '/order-success';
    } else if (p.name === 'orders') {
      targetUrl = '/orders';
    } else if (p.name === 'profile') {
      targetUrl = p.tab && p.tab !== 'profile' ? `/profile?tab=${p.tab}` : '/profile';
    } else if (p.name === 'search') {
      targetUrl = `/search?q=${encodeURIComponent(p.query)}`;
    } else if (p.name === 'compare') {
      targetUrl = p.ids && p.ids.length > 0 ? `/compare?ids=${p.ids.join(',')}` : '/compare';
    } else if (p.name === 'warranty') {
      targetUrl = '/warranty';
    }

    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState({ page: p }, '', targetUrl);
    }
    window.dispatchEvent(new Event('camerahub_route_change'));
  }, []);

  // Xác định Transition Key duy nhất cho từng màn hình
  const pageTransitionKey = (() => {
    switch (page.name) {
      case 'home':
        return 'home';
      case 'catalog':
        return `catalog-${page.categorySlug || 'all'}`;
      case 'product':
        return `product-${page.slug}`;
      case 'cart':
        return 'cart';
      case 'checkout':
        return 'checkout';
      case 'order-success':
        return `order-success-${page.orderId || ''}`;
      case 'search':
        return `search-${page.query}`;
      case 'orders':
        return 'orders';
      case 'profile':
        return `profile-${page.tab || 'profile'}`;
      case 'compare':
        return `compare-${(page.ids || []).join('-')}`;
      case 'warranty':
        return 'warranty';
      case 'admin':
        return `admin-${page.tab || 'dashboard'}`;
      default:
        return (page as any).name || 'page';
    }
  })();

  // Chuyển cảnh cực nhanh, nhẹ nhàng, không gây cảm giác chờ đợi
  const pageVariants = {
    initial: shouldReduceMotion
      ? { opacity: 1 }
      : { opacity: 0, y: 6 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.16,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          y: -6,
          transition: {
            duration: shouldReduceMotion ? 0 : 0.12,
            ease: [0.22, 1, 0.36, 1],
          },
        },
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <GoogleAuthHandler />
            <CartProvider>
              <CompareProvider>
                {page.name === 'admin' ? (
                  <Suspense fallback={<PageFallback />}>
                    <AdminPage onNavigate={navigate} initialTab={page.tab || 'dashboard'} />
                  </Suspense>
                ) : (
                  <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950 text-ink-800 dark:text-cream-100 transition-colors duration-200">
                    <Header onNavigate={navigate} currentPage={page} categories={categories} />

                    <main className="flex-1 relative overflow-hidden flex flex-col">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={pageTransitionKey}
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="w-full flex-1 flex flex-col will-change-transform"
                        >
                          {page.name === 'home' && <HomePage onNavigate={navigate} categories={categories} />}
                          {page.name === 'catalog' && (
                            <CatalogPage
                              onNavigate={navigate}
                              categories={categories}
                              categorySlug={page.categorySlug}
                              brand={page.brand}
                            />
                          )}
                          {page.name === 'product' && (
                            <ProductDetailPage
                              slug={page.slug}
                              onNavigate={navigate}
                              categories={categories}
                            />
                          )}
                          {page.name === 'cart' && <CartPage onNavigate={navigate} />}
                          {page.name === 'checkout' && <CheckoutPage onNavigate={navigate} />}
                          {page.name === 'order-success' && (
                            <OrderSuccessPage orderId={page.orderId} onNavigate={navigate} />
                          )}
                          {page.name === 'search' && <SearchPage query={page.query} onNavigate={navigate} />}
                          {page.name === 'orders' && <OrdersPage onNavigate={navigate} />}
                          {page.name === 'profile' && (
                            <ProfilePage initialTab={page.tab || 'profile'} onNavigate={navigate} />
                          )}
                          {page.name === 'compare' && (
                            <ComparePage onNavigate={navigate} initialProductIds={page.ids} />
                          )}
                          {page.name === 'warranty' && (
                            <WarrantyLookupPage onNavigate={navigate} />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </main>

                    <Footer onNavigate={navigate} categories={categories} />
                    <AuthModal />
                    <LiveChatWidget onNavigate={navigate} />
                    <CompareTray currentPage={page} onNavigate={navigate} />
                    <CameraSelectorModal
                      isOpen={selectorModalOpen}
                      onClose={() => setSelectorModalOpen(false)}
                      onNavigate={navigate}
                    />
                  </div>
                )}
              </CompareProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
