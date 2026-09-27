import type { Cart, Order, Product } from '../../types';
import { request } from './client';

export const ordersApi = {
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
};
