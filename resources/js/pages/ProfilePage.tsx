import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  LogOut,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { Page, Address, Order } from '../types';
import { AddressModal } from '../components/AddressModal';
import { ProfileInfoTab } from '../components/profile/ProfileInfoTab';
import { ProfileAddressesTab } from '../components/profile/ProfileAddressesTab';
import { ProfileOrdersTab } from '../components/profile/ProfileOrdersTab';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import { ChangeEmailModal } from '../components/profile/ChangeEmailModal';

interface ProfilePageProps {
  initialTab?: 'profile' | 'addresses' | 'orders';
  onNavigate: (page: Page) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ initialTab = 'profile', onNavigate }) => {
  const { user, openAuthModal, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>(initialTab);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Modals State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);

  // Synchronize initialTab if changed externally
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchOrders();
    }
  }, [user]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await api.getAddresses();
      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await api.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Address Actions
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await api.deleteAddress(id);
      toast.success('Đã xóa địa chỉ thành công!');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa địa chỉ.');
    }
  };

  const handleSetDefaultAddress = async (addr: Address) => {
    try {
      await api.updateAddress(addr.id, { isDefault: true });
      toast.success('Đã đặt làm địa chỉ mặc định!');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đặt làm địa chỉ mặc định.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-accent-50 text-accent-600 flex items-center justify-center mx-auto mb-4 border border-accent-100 shadow-2xs">
          <UserIcon size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold text-ink-900 mb-2">Tài Khoản Khách Hàng</h2>
        <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
          Vui lòng đăng nhập để xem thông tin hồ sơ cá nhân và quản lý sổ địa chỉ nhận hàng.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="btn-accent px-6 py-3 rounded-2xl font-bold text-sm shadow-md cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const userInitial = user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'C';
  const customerCode = user.customerCode || `CAM-ACC-${String(user.id).padStart(5, '0')}`;
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in text-ink-800 dark:text-cream-100">
      {/* 1. TOP COVER & PROFILE HERO CARD */}
      <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-sm overflow-hidden transition-colors">
        {/* Cover Banner */}
        <div className="h-40 sm:h-52 w-full bg-gradient-to-r from-ink-950 via-[#1f2421] to-ink-900 relative overflow-hidden flex items-end justify-end p-6">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e85d1b_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/80 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CameraHub Pro Member</span>
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 sm:px-10 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Squircle Avatar Overlapping Banner */}
              <div className="-mt-14 sm:-mt-16 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-accent-600 text-white flex items-center justify-center font-display font-bold text-3xl sm:text-4xl shadow-xl border-4 border-white dark:border-ink-900 ring-1 ring-cream-200/60 dark:ring-ink-800 relative z-10 shrink-0">
                {userInitial}
              </div>

              {/* Name & Badges */}
              <div className="space-y-2 pb-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink-900 dark:text-cream-50 leading-tight">
                    {user.fullName || 'Khách Hàng CameraHub'}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                    <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                    Đã Xác Thực
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-600 dark:text-cream-200">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 font-medium">
                    <Mail size={13} className="text-ink-400 dark:text-ink-500" />
                    <span>{user.email}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 font-medium">
                    <Phone size={13} className="text-ink-400 dark:text-ink-500" />
                    <span>{user.phone || 'Chưa cập nhật SĐT'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 font-medium">
                    <Calendar size={13} className="text-ink-400 dark:text-ink-500" />
                    <span>
                      Tham gia từ {user.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <div className="sm:pb-2">
              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-cream-300 dark:border-ink-700 text-ink-700 dark:text-cream-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-98"
              >
                <LogOut size={14} />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STAT / METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Đơn Hàng */}
        <div
          onClick={() => setActiveTab('orders')}
          className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-5 flex items-center gap-4 hover:border-accent-400 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Đơn Mua Hàng</p>
            <h4 className="text-lg font-display font-bold text-ink-900 dark:text-cream-50 group-hover:text-accent-600 transition-colors">
              {loadingOrders ? '...' : `${orders.length} Đơn Hàng`}
            </h4>
            <p className="text-xs text-accent-600 dark:text-accent-400 font-bold flex items-center gap-0.5 mt-0.5">
              <span>Xem lịch sử đơn hàng</span>
              <ChevronRight size={13} />
            </p>
          </div>
        </div>

        {/* Card 2: Sổ Địa Chỉ Giao */}
        <div
          onClick={() => setActiveTab('addresses')}
          className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-5 flex items-center gap-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-13 h-13 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <MapPin size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Số Địa Chỉ Giao</p>
            <h4 className="text-lg font-display font-bold text-ink-900 dark:text-cream-50 group-hover:text-blue-600 transition-colors">
              {loadingAddresses ? '...' : `${addresses.length} Địa Chỉ`}
            </h4>
            <p className="text-xs text-ink-500 dark:text-ink-400 truncate mt-0.5">
              {defaultAddress
                ? `Mặc định: ${defaultAddress.label} (${defaultAddress.city})`
                : 'Chưa có địa chỉ mặc định'}
            </p>
          </div>
        </div>

        {/* Card 3: Bảo Mật Tài Khoản */}
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-5 flex items-center gap-4 shadow-2xs">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shadow-2xs shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Bảo Mật Tài Khoản</p>
            <h4 className="text-lg font-display font-bold text-emerald-600 dark:text-emerald-400">An Toàn 100%</h4>
            <p className="text-xs text-ink-500 dark:text-ink-400 truncate mt-0.5">Xác thực OTP & Sanctum Bearer</p>
          </div>
        </div>
      </div>

      {/* 3. THREE NAVIGATION TABS */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-1.5 bg-cream-100/70 dark:bg-ink-900/90 border border-cream-200 dark:border-ink-800 rounded-3xl shadow-2xs transition-colors">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-accent-600 text-white shadow-md'
              : 'text-ink-700 dark:text-cream-200 hover:text-ink-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-ink-800'
          }`}
        >
          <UserIcon size={16} />
          <span>Thông Tin Cá Nhân & Bảo Mật</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'addresses'
              ? 'bg-accent-600 text-white shadow-md'
              : 'text-ink-700 dark:text-cream-200 hover:text-ink-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-ink-800'
          }`}
        >
          <MapPin size={16} />
          <span>Sổ Địa Chỉ Giao Hàng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'addresses'
                ? 'bg-white/20 text-white'
                : 'bg-cream-200 dark:bg-ink-800 text-ink-700 dark:text-cream-300'
            }`}
          >
            {addresses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-accent-600 text-white shadow-md'
              : 'text-ink-700 dark:text-cream-200 hover:text-ink-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-ink-800'
          }`}
        >
          <Package size={16} />
          <span>Lịch Sử Đơn Hàng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'orders'
                ? 'bg-white/20 text-white'
                : 'bg-cream-200 dark:bg-ink-800 text-ink-700 dark:text-cream-300'
            }`}
          >
            {orders.length}
          </span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      {activeTab === 'profile' && (
        <ProfileInfoTab
          user={user}
          customerCode={customerCode}
          onOpenChangeEmail={() => setIsChangeEmailModalOpen(true)}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        />
      )}

      {activeTab === 'addresses' && (
        <ProfileAddressesTab
          addresses={addresses}
          loadingAddresses={loadingAddresses}
          onOpenAddAddress={handleOpenAddAddress}
          onOpenEditAddress={handleOpenEditAddress}
          onDeleteAddress={handleDeleteAddress}
          onSetDefaultAddress={handleSetDefaultAddress}
        />
      )}

      {activeTab === 'orders' && (
        <ProfileOrdersTab
          orders={orders}
          loadingOrders={loadingOrders}
          onNavigate={onNavigate}
        />
      )}

      {/* 5. MODALS */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        user={user}
      />

      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        onClose={() => setIsChangeEmailModalOpen(false)}
        currentEmail={user.email}
      />

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={async (data) => {
          if (editingAddress) {
            await api.updateAddress(editingAddress.id, data);
          } else {
            await api.createAddress(data);
          }
          fetchAddresses();
        }}
        initialAddress={editingAddress}
      />
    </div>
  );
};
