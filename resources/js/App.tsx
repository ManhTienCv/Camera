import { useState, useEffect, useCallback } from 'react';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthModal } from './components/AuthModal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminPage } from './pages/AdminPage';
import { api } from './lib/api';
import type { Page, Category } from './types';

// Helper to parse page from current browser URL
const parseLocation = (): Page => {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);

  if (path.startsWith('/admin')) {
    const tab = (search.get('tab') as any) || 'dashboard';
    return { name: 'admin', tab };
  }
  if (path.startsWith('/catalog')) {
    return { name: 'catalog', categorySlug: search.get('cat') || undefined };
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
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sync browser URL bar so reloads (F5) stay on the exact same page/tab
    let targetUrl = '/';
    if (p.name === 'admin') {
      targetUrl = p.tab && p.tab !== 'dashboard' ? `/admin?tab=${p.tab}` : '/admin';
    } else if (p.name === 'catalog') {
      targetUrl = p.categorySlug ? `/catalog?cat=${p.categorySlug}` : '/catalog';
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
    }

    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState({ page: p }, '', targetUrl);
    }
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <GoogleAuthHandler />
          <CartProvider>
            {page.name === 'admin' ? (
              <AdminPage onNavigate={navigate} initialTab={page.tab || 'dashboard'} />
            ) : (
              <div className="min-h-screen flex flex-col bg-cream-50">
                <Header onNavigate={navigate} currentPage={page} categories={categories} />

                <main className="flex-1">
                  {page.name === 'home' && <HomePage onNavigate={navigate} categories={categories} />}
                  {page.name === 'catalog' && (
                    <CatalogPage
                      onNavigate={navigate}
                      categories={categories}
                      categorySlug={page.categorySlug}
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
                </main>

                <Footer onNavigate={navigate} categories={categories} />
                <AuthModal />
                <LiveChatWidget onNavigate={navigate} />
              </div>
            )}
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
