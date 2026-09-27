import type { User, Address, AuthResponse, Order } from '../../types';
import { request, API_BASE, apiCache } from './client';

export const authApi = {
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

  // Admin Dedicated Authentication
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

  clearCache: () => {
    apiCache.clear();
  },
};
