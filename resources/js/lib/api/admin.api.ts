import type {
  Category,
  Brand,
  Product,
  Order,
  ReportSummaryData,
  ReportChartsData,
  AdminUserItem,
  AdminVoucherItem,
  AdminReviewItem,
  FinanceFilterParams,
  FinanceSummaryData,
  FinanceTransactionsData,
} from '../../types';
import { request, buildQueryString } from './client';

export const adminApi = {
  // Products Management
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

  // Categories Management
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

  // Brands Management
  getAdminBrands: () => request<Brand[]>('/brands'),
  createAdminBrand: (data: { name: string; description?: string; logo_url?: string }) =>
    request<{ message: string; brand: Brand }>('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminBrand: (id: string | number, data: { name?: string; description?: string; logo_url?: string }) =>
    request<{ message: string; brand: Brand }>(`/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAdminBrand: (id: string | number) =>
    request<{ message: string }>(`/admin/brands/${id}`, {
      method: 'DELETE',
    }),

  // Orders Management
  getAdminOrders: async (params?: { tab?: string; search?: string; payment_method?: string; refresh?: boolean }) => {
    const query = buildQueryString(params);
    const res = await request<any>(`/admin/orders${query}`);
    if (res && Array.isArray(res.orders)) {
      return res.orders as Order[];
    }
    return (Array.isArray(res) ? res : []) as Order[];
  },

  getAdminOrdersFull: (params?: { tab?: string; search?: string; payment_method?: string; refresh?: boolean }) => {
    const query = buildQueryString(params);
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
  // Lab 08: Admin Reports & Charts APIs
  // ==========================================
  getAdminReportSummary: (params?: { refresh?: boolean }) => {
    const query = params?.refresh ? '?refresh=1' : '';
    return request<ReportSummaryData>(`/admin/reports${query}`);
  },

  getAdminReportCharts: (params?: { refresh?: boolean }) => {
    const query = params?.refresh ? '?refresh=1' : '';
    return request<ReportChartsData>(`/admin/reports/charts${query}`);
  },

  // ==========================================
  // Lab 08: Admin User Management APIs
  // ==========================================
  getAdminUsers: (params?: { search?: string; role?: string; refresh?: boolean }) => {
    const query = buildQueryString(params);
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
  // Admin Voucher Management
  // ==========================================
  getAdminVouchers: (params?: { q?: string; status?: string; refresh?: boolean }) => {
    const query = buildQueryString(params);
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
  // Admin Review Management
  // ==========================================
  getAdminReviews: (params?: { q?: string; status?: string; rating?: string; refresh?: boolean }) => {
    const query = buildQueryString(params);
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
    const query = buildQueryString(params);
    return request<FinanceSummaryData>(`/admin/finance/summary${query}`);
  },

  getAdminFinanceTransactions: (params?: FinanceFilterParams) => {
    const query = buildQueryString(params);
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
  getInventoryMovements: (params?: { page?: number; per_page?: number; type?: string; search?: string; refresh?: boolean }) => {
    const query = buildQueryString(params);
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
};
