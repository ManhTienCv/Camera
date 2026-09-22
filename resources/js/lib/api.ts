import type { Category, Product, Cart, Order, User, Address, AuthResponse, ChatMessage, ChatUserItem, ReportSummaryData, ReportChartsData, AdminUserItem } from '../types';

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

function getAuthToken(): string | null {
  return localStorage.getItem('camera_auth_token');
}

// In-memory cache for GET requests to eliminate page switch flashing
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  const isRealtime = url.includes('/chat') || url.includes('/admin/reports') || url.includes('/admin/users');
  if (isGet && !isRealtime && apiCache.has(url)) {
    const cached = apiCache.get(url)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const token = getAuthToken();
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
    let errMsg = `API error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.message) errMsg = errData.message;
    } catch (_) {}
    throw new Error(errMsg);
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

  searchProducts: (q: string) =>
    request<Product[]>(`/products/search?q=${encodeURIComponent(q)}`),

  getProductBySlug: (slug: string) =>
    request<Product>(`/products/${slug}`),

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

  cancelOrder: (id: string, reason?: string) =>
    request<{ message: string; order: Order }>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

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

  // ==========================================
  // Lab 07: Live Chat APIs (User & Admin)
  // ==========================================
  getUserChatMessages: () =>
    request<ChatMessage[]>('/user/chat/messages'),

  sendUserChatMessage: (message: string) =>
    request<ChatMessage>('/user/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getAdminChatUsers: () =>
    request<ChatUserItem[]>('/admin/chat/users'),

  getAdminChatMessages: (userId: number | string) =>
    request<ChatMessage[]>(`/admin/chat/messages/${userId}`),

  sendAdminChatMessage: (userId: number | string, message: string) =>
    request<ChatMessage>('/admin/chat/send', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, message }),
    }),

  // ==========================================
  // Lab 08: Admin Reports & Charts APIs
  // ==========================================
  getAdminReportSummary: () =>
    request<ReportSummaryData>('/admin/reports'),

  getAdminReportCharts: () =>
    request<ReportChartsData>('/admin/reports/charts'),

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
};

