import type { Category, Product, Cart, Order, User, Address, AuthResponse, ChatMessage, ChatUserItem, ReportSummaryData, ReportChartsData, AdminUserItem, AdminVoucherItem, AdminReviewItem, FinanceFilterParams, FinanceSummaryData, FinanceTransactionsData } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1';

// Session ID for cart persistence
function getSessionId(): string {
  let id = localStorage.getItem('camera_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('camera_session_id', id);
  }
  return id;
}

function getAuthToken(url?: string): string | null {
  if (url && (url.startsWith('/admin') || url.includes('/admin/'))) {
    return localStorage.getItem('camera_admin_token');
  }
  return localStorage.getItem('camera_auth_token');
}

// In-memory cache for GET requests to eliminate page switch flashing
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  const isRealtime = url.includes('/chat') || url.includes('/admin/reports') || url.includes('/admin/users') || url.includes('/admin/finance');
  if (isGet && !isRealtime && apiCache.has(url)) {
    const cached = apiCache.get(url)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const token = getAuthToken(url);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Session-ID': getSessionId(),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (url.startsWith('/admin') || url.includes('/admin/')) {
        localStorage.removeItem('camera_admin_token');
        localStorage.removeItem('camera_admin_user');
        window.dispatchEvent(new Event('camera_admin_session_expired'));
      } else {
        localStorage.removeItem('camera_auth_token');
        localStorage.removeItem('camera_auth_user');
        window.dispatchEvent(new Event('camera_user_session_expired'));
      }
    }

    let errMsg = `API error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.message) errMsg = errData.message;
    } catch (_) {}
    const error: any = new Error(errMsg);
    error.status = response.status;
    error.isUnauthorized = response.status === 401;
    throw error;
  }

  const data = await response.json();
  if (isGet) {
    apiCache.set(url, { data, timestamp: Date.now() });
  } else {
    // If mutating data, clear cache so fresh data is fetched
    apiCache.clear();
  }

  return data;
}

export const api = {
  // Authentication & Profile
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendRegisterOtp: (data: { email: string; fullName?: string }) =>
    request<{ message: string; email: string }>('/auth/send-register-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerWithOtp: (data: { email: string; password: string; fullName: string; phone?: string; otp: string }) =>
    request<AuthResponse>('/auth/register-with-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendForgotPasswordOtp: (data: { email: string }) =>
    request<{ message: string; email: string }>('/auth/forgot-password/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPasswordWithOtp: (data: { email: string; otp: string; newPassword: string }) =>
    request<AuthResponse>('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendChangeEmailOtp: (data: { newEmail: string }) =>
    request<{ message: string; newEmail: string }>('/auth/send-change-email-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyChangeEmailOtp: (data: { newEmail: string; otp: string }) =>
    request<{ message: string; user: User }>('/auth/verify-change-email-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => request<User>('/auth/me'),

  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  }) =>
    request<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    request<{ message: string; user: User }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAddresses: () => request<Address[]>('/auth/addresses'),

  createAddress: (data: {
    label: string;
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    isDefault?: boolean;
  }) =>
    request<{ message: string; address: Address }>('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAddress: (
    id: string,
    data: {
      label?: string;
      recipientName?: string;
      phone?: string;
      address?: string;
      city?: string;
      isDefault?: boolean;
    }
  ) =>
    request<{ message: string; address: Address }>(`/auth/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAddress: (id: string) =>
    request<{ message: string }>(`/auth/addresses/${id}`, {
      method: 'DELETE',
    }),

  getMyOrders: () => request<Order[]>('/auth/orders'),

  // Categories
  getCategories: () => request<Category[]>('/categories'),
  getCategory: (slug: string) => request<{ category: Category; products: Product[] }>(`/categories/${slug}`),

  // Brands
  getBrands: () => request<Array<{ id: string; name: string; slug: string; logo_url: string | null }>>('/brands'),

  // Products
  getProducts: (params?: { category?: string; brand?: string; sort?: string; q?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.brand) searchParams.append('brand', params.brand);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.q) searchParams.append('q', params.q);
    const query = searchParams.toString();
    return request<Product[]>(`/products${query ? `?${query}` : ''}`);
  },

  getFeaturedProducts: (type: 'featured' | 'new' = 'featured') =>
    request<Product[]>(`/products/featured?type=${type}`),

  getBestSellers: (limit: number = 8) =>
    request<Product[]>(`/products/best-sellers?limit=${limit}`),

  searchProducts: (q: string) =>
    request<Product[]>(`/products/search?q=${encodeURIComponent(q)}`),

  getProductBySlug: (slug: string) =>
    request<Product>(`/products/${slug}`),

  getRelatedProducts: (id: string, limit: number = 4) =>
    request<Product[]>(`/products/${id}/related?limit=${limit}`),

  compareProducts: (ids: (string | number)[]) =>
    request<{
      products: Product[];
      allSpecs: string[];
    }>(`/products/compare?ids=${encodeURIComponent(ids.join(','))}`),

  checkWarranty: (query: string) =>
    request<{
      found: boolean;
      serialNumber: string;
      productName: string;
      productImage: string;
      brand: string;
      customerName: string;
      customerPhone: string;
      orderCode: string;
      purchaseDate: string;
      expiryDate: string;
      warrantyDuration: string;
      daysLeft: number;
      status: 'active' | 'expired';
      statusLabel: string;
      serviceCenter: string;
      history: Array<{ date: string; title: string; desc: string }>;
    }>(`/warranty/check?query=${encodeURIComponent(query)}`),

  // Reviews (Database connected)
  getProductReviews: (productId: string) =>
    request<{
      reviews: any[];
      stats: {
        average: number;
        count: number;
        breakdown: Record<number, number>;
        breakdownPercent: Record<number, number>;
        withImagesCount: number;
      };
    }>(`/products/${productId}/reviews`),

  createProductReview: (
    productId: string,
    data: { rating: number; comment: string; variant?: string; images?: string[] }
  ) =>
    request<{ message: string; review: any; newProductStats: { rating: number; review_count: number } }>(
      `/products/${productId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  voteReviewHelpful: (reviewId: string) =>
    request<{ success: boolean; helpful_count: number }>(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
    }),

  // Vouchers / Coupons
  getAvailableVouchers: () =>
    request<Array<{
      id: number;
      code: string;
      name: string;
      description: string;
      discount_type: 'fixed' | 'percent';
      discount_value: number;
      min_order_amount: number;
      max_discount_amount: number | null;
      expires_at: string | null;
    }>>('/vouchers/available'),

  applyVoucher: (code: string, orderAmount: number) =>
    request<{
      valid: boolean;
      message: string;
      voucher?: {
        code: string;
        name: string;
        discount_type: 'fixed' | 'percent';
        discount_value: number;
        discount_amount: number;
        final_amount: number;
      };
    }>('/vouchers/apply', {
      method: 'POST',
      body: JSON.stringify({ code, order_amount: orderAmount }),
    }),

  // Wishlist
  getWishlist: () => request<Product[]>('/wishlist'),
  getWishlistIds: () => request<string[]>('/wishlist/ids'),
  toggleWishlist: (productId: string) =>
    request<{ in_wishlist: boolean; message: string }>('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }),

  // Cart
  getCart: () => request<Cart>('/cart'),

  addToCart: (productId: string, quantity: number = 1) =>
    request<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  updateCartItem: (itemId: string, quantity: number) =>
    request<Cart>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeCartItem: (itemId: string) =>
    request<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  clearCart: () =>
    request<{ message: string }>('/cart', {
      method: 'DELETE',
    }),

  // Orders
  createOrder: (orderData: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    city: string;
    payment_method?: string;
    voucher_code?: string;
    items: Array<{ product_id: string; name: string; price: number; quantity: number; image_url: string }>;
  }) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  getOrder: (id: string) => request<Order>(`/orders/${id}`),

  confirmPayment: (id: string) =>
    request<{ message: string; order: Order }>(`/orders/${id}/confirm-payment`, {
      method: 'POST',
    }),

  cancelOrder: (
    id: string,
    data?: string | { reason?: string; bank_name?: string; bank_account_number?: string; bank_account_holder?: string }
  ) => {
    const payload = typeof data === 'string' ? { reason: data } : data || {};
    return request<{ message: string; order: Order }>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // MoMo Payment Gateway
  createMomoPayment: (orderId: string, redirectUrl?: string) =>
    request<{ success: boolean; payUrl: string; qrCodeUrl?: string; deeplink?: string; order: Order }>('/payment/momo/create', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, redirect_url: redirectUrl }),
    }),

  payAgainMomo: (orderId: string, redirectUrl?: string) =>
    request<{ success: boolean; payUrl: string; qrCodeUrl?: string; deeplink?: string }>(`/orders/${orderId}/pay/momo`, {
      method: 'POST',
      body: JSON.stringify({ redirect_url: redirectUrl }),
    }),

  // Giao Hàng Nhanh (GHN) APIs
  getGhnProvinces: () =>
    request<Array<{ ProvinceID: number; ProvinceName: string }>>('/shipping/ghn/provinces'),

  getGhnDistricts: (provinceId: number) =>
    request<Array<{ DistrictID: number; DistrictName: string }>>(`/shipping/ghn/districts/${provinceId}`),

  getGhnWards: (districtId: number) =>
    request<Array<{ WardCode: string; WardName: string }>>(`/shipping/ghn/wards/${districtId}`),

  calculateGhnFee: (districtId: number, wardCode: string, insuranceValue?: number) =>
    request<{ success: boolean; total: number; service_fee: number; insurance_fee?: number; expected_delivery_time?: string }>('/shipping/ghn/fee', {
      method: 'POST',
      body: JSON.stringify({ district_id: districtId, ward_code: wardCode, insurance_value: insuranceValue }),
    }),

  createGhnOrder: (orderId: string) =>
    request<{ success: boolean; message: string; tracking_code: string; order: Order }>(`/admin/orders/${orderId}/ghn`, {
      method: 'POST',
    }),

  // Admin APIs & Aliases
  createProduct: (data: Partial<Product>) =>
    request<{ message: string; product: Product }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createAdminProduct: (data: Partial<Product>) =>
    request<{ message: string; product: Product }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Partial<Product>) =>
    request<{ message: string; product: Product }>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateAdminProduct: (id: string, data: Partial<Product>) =>
    request<{ message: string; product: Product }>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request<{ message: string }>(`/admin/products/${id}`, {
      method: 'DELETE',
    }),
  deleteAdminProduct: (id: string) =>
    request<{ message: string }>(`/admin/products/${id}`, {
      method: 'DELETE',
    }),

  createCategory: (data: { name: string; description?: string }) =>
    request<{ message: string; category: Category }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createAdminCategory: (data: { name: string; description?: string }) =>
    request<{ message: string; category: Category }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: { name?: string; description?: string }) =>
    request<{ message: string; category: Category }>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateAdminCategory: (id: string, data: { name?: string; description?: string }) =>
    request<{ message: string; category: Category }>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<{ message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),
  deleteAdminCategory: (id: string) =>
    request<{ message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  getAdminOrders: async (params?: { tab?: string; search?: string; payment_method?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const res = await request<any>(`/admin/orders${query}`);
    if (res && Array.isArray(res.orders)) {
      return res.orders as Order[];
    }
    return (Array.isArray(res) ? res : []) as Order[];
  },

  getAdminOrdersFull: (params?: { tab?: string; search?: string; payment_method?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<{ orders: Order[]; tabCounts: Record<string, number>; activeTab: string }>(`/admin/orders${query}`);
  },

  updateOrderStatus: (id: string, status: string, reason?: string) =>
    request<{ message: string; order: Order }>(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),
  updateAdminOrderStatus: (id: string, status: string, reason?: string) =>
    request<{ message: string; order: Order }>(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),

  syncGhnOrderStatus: (orderId: string) =>
    request<{ success: boolean; message: string; order: Order }>(`/shipping/ghn/sync/${orderId}`, {
      method: 'POST',
    }),

  confirmAdminRefund: (orderId: string, refundRefCode: string) =>
    request<{ message: string; order: Order }>(`/admin/orders/${orderId}/confirm-refund`, {
      method: 'POST',
      body: JSON.stringify({ refund_ref_code: refundRefCode }),
    }),

  // ==========================================
  // Lab 07: Live Chat APIs (User & Admin)
  // ==========================================
  getUserChatMessages: (afterId?: number) =>
    request<ChatMessage[]>(`/user/chat/messages${afterId ? '?after_id=' + afterId : ''}`),

  sendUserChatMessage: (message: string) =>
    request<ChatMessage>('/user/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getAdminChatUsers: () =>
    request<ChatUserItem[]>('/admin/chat/users'),

  getAdminChatMessages: (userId: number | string, afterId?: number) =>
    request<ChatMessage[]>(`/admin/chat/messages/${userId}${afterId ? '?after_id=' + afterId : ''}`),

  sendAdminChatMessage: (userId: number | string, message: string) =>
    request<ChatMessage>('/admin/chat/send', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, message }),
    }),

  // ==========================================
  // Lab 08: Admin Reports & Charts APIs
  // ==========================================
  getAdminReportSummary: (params?: { mock?: boolean; real?: boolean }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<ReportSummaryData>(`/admin/reports${query}`);
  },

  getAdminReportCharts: (params?: { mock?: boolean; real?: boolean }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<ReportChartsData>(`/admin/reports/charts${query}`);
  },

  // ==========================================
  // Lab 08: Admin User Management APIs
  // ==========================================
  getAdminUsers: (params?: { search?: string; role?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<AdminUserItem[]>(`/admin/users${query}`);
  },

  getAdminUser: (id: number | string) =>
    request<any>(`/admin/users/${id}`),

  createAdminUser: (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
    request<{ message: string; user: AdminUserItem }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAdminUser: (id: number | string, data: { name: string; email: string; password?: string; role: string; phone?: string }) =>
    request<{ message: string; user: AdminUserItem }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAdminUser: (id: number | string) =>
    request<{ message?: string; error?: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    }),

  // ==========================================
  // Admin Voucher Management (media_1790099989435.png)
  // ==========================================
  getAdminVouchers: (params?: { q?: string; status?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<{
      vouchers: AdminVoucherItem[];
      stats: {
        total_vouchers: number;
        active_vouchers: number;
        total_used: number;
      };
    }>(`/admin/vouchers${query}`);
  },

  createAdminVoucher: (data: Partial<AdminVoucherItem>) =>
    request<{ message: string; voucher: AdminVoucherItem }>('/admin/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAdminVoucher: (id: number | string, data: Partial<AdminVoucherItem>) =>
    request<{ message: string; voucher: AdminVoucherItem }>(`/admin/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleAdminVoucherStatus: (id: number | string) =>
    request<{ message: string; voucher: AdminVoucherItem }>(`/admin/vouchers/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  deleteAdminVoucher: (id: number | string) =>
    request<{ message: string }>(`/admin/vouchers/${id}`, {
      method: 'DELETE',
    }),

  // ==========================================
  // Admin Review Management (media_1790132554619.png)
  // ==========================================
  getAdminReviews: (params?: { q?: string; status?: string; rating?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<{
      reviews: AdminReviewItem[];
      stats: {
        total: number;
        average: number;
        approved_count: number;
        hidden_count: number;
        five_star_count: number;
      };
    }>(`/admin/reviews${query}`);
  },

  toggleAdminReviewStatus: (id: number | string) =>
    request<{ message: string; status: 'approved' | 'hidden' }>(`/admin/reviews/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  replyAdminReview: (id: number | string, reply: string) =>
    request<{ message: string; admin_reply: string; replied_at: string }>(`/admin/reviews/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    }),

  deleteAdminReview: (id: number | string) =>
    request<{ message: string }>(`/admin/reviews/${id}`, {
      method: 'DELETE',
    }),

  // ==========================================
  // Lab 09: Admin Finance & Transactions Management
  // ==========================================
  getAdminFinanceSummary: (params?: FinanceFilterParams) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as any).toString() : '';
    return request<FinanceSummaryData>(`/admin/finance/summary${query}`);
  },

  getAdminFinanceTransactions: (params?: FinanceFilterParams) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as any).toString() : '';
    return request<FinanceTransactionsData>(`/admin/finance/transactions${query}`);
  },

  updateAdminFinanceStatus: (
    orderId: number | string,
    data: {
      payment_status: string;
      current_payment_status: string;
      current_order_status: string;
      current_payment_id: number;
    }
  ) =>
    request<{ success: boolean; message: string }>(`/admin/finance/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ==========================================
  // Sổ cái Quản lý Kho (Immutable Inventory Ledger)
  // ==========================================
  getInventoryMovements: (params?: { page?: number; per_page?: number; type?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as any).toString() : '';
    return request<{
      data: Array<{
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
        product?: Product;
        order?: { id: number; order_code: string; customer_name: string };
      }>;
      meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
      stats: {
        total_movements: number;
        total_purchased_qty: number;
        total_restocked_qty: number;
        total_manual_adjusted: number;
      };
    }>(`/admin/inventory/movements${query}`);
  },

  // ==========================================
  // Admin Dedicated Authentication
  // ==========================================
  adminLogin: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let errMsg = 'Tài khoản hoặc mật khẩu Quản trị không chính xác.';
      try {
        const errData = await res.json();
        if (errData.message) errMsg = errData.message;
      } catch (_) {}
      throw new Error(errMsg);
    }
    const resData: AuthResponse = await res.json();
    if (!resData.user || resData.user.role !== 'admin') {
      throw new Error('Tài khoản này không có quyền Quản trị viên (Admin).');
    }
    localStorage.setItem('camera_admin_token', resData.token);
    localStorage.setItem('camera_admin_user', JSON.stringify(resData.user));
    return resData;
  },

  getAdminProfile: async (): Promise<User> => {
    const adminToken = localStorage.getItem('camera_admin_token');
    if (!adminToken) {
      throw new Error('Chưa đăng nhập Quản trị viên');
    }
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    if (!res.ok) {
      localStorage.removeItem('camera_admin_token');
      localStorage.removeItem('camera_admin_user');
      throw new Error('Phiên đăng nhập Admin đã hết hạn');
    }
    const json = await res.json();
    const userData = (json.data || json) as User;
    if (userData.role !== 'admin') {
      localStorage.removeItem('camera_admin_token');
      localStorage.removeItem('camera_admin_user');
      throw new Error('Tài khoản không có quyền Admin');
    }
    localStorage.setItem('camera_admin_user', JSON.stringify(userData));
    return userData;
  },

  adminLogout: () => {
    localStorage.removeItem('camera_admin_token');
    localStorage.removeItem('camera_admin_user');
  },
};

