import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  ShieldCheck,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  KeyRound,
  RotateCcw,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Phone,
  Calendar,
  LogOut,
  Package,
  ShoppingBag,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ExternalLink,
  Shield,
  Truck,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import type { Page, Address, Order } from '../types';
import { AddressModal } from '../components/AddressModal';

interface ProfilePageProps {
  initialTab?: 'profile' | 'addresses' | 'orders';
  onNavigate: (page: Page) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ initialTab = 'profile', onNavigate }) => {
  const { user, openAuthModal, refreshUser, logout } = useAuth();
  const toast = useToast();
  const { clientTheme, setClientTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>(initialTab);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password Modal State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Change Email with OTP State
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'input' | 'otp'>('input');
  const [emailOtpValues, setEmailOtpValues] = useState(['', '', '', '', '', '']);
  const [emailOtpTimer, setEmailOtpTimer] = useState(60);
  const [emailOtpCanResend, setEmailOtpCanResend] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailOtpSubmitting, setEmailOtpSubmitting] = useState(false);
  const emailOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Synchronize initialTab if changed externally
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Auto dismiss profile message
  useEffect(() => {
    if (profileMsg) {
      const timer = setTimeout(() => {
        setProfileMsg(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [profileMsg]);

  useEffect(() => {
    if (emailOtpError) {
      const timer = setTimeout(() => {
        setEmailOtpError(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [emailOtpError]);

  // Change email timer effect
  useEffect(() => {
    let interval: any;
    if (isChangeEmailModalOpen && emailOtpStep === 'otp' && emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer((prev) => {
          if (prev <= 1) {
            setEmailOtpCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isChangeEmailModalOpen, emailOtpStep, emailOtpTimer]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin hồ sơ thành công!' });
      toast.success('Đã lưu thông tin hồ sơ thành công!');
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Lỗi khi cập nhật thông tin.' });
      toast.error(err.message || 'Lỗi khi cập nhật thông tin.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password Handlers
  const handleOpenChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setIsChangePasswordModalOpen(true);
  };

  const handleSubmitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const userHasPass = user?.hasPassword !== false;

    if (userHasPass && !currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({
        currentPassword: userHasPass ? currentPassword : undefined,
        newPassword,
      });
      await refreshUser();
      toast.success('Đã thay đổi mật khẩu đăng nhập thành công!');
      setIsChangePasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Lỗi khi thay đổi mật khẩu.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Change Email Handlers
  const handleOpenChangeEmail = () => {
    setNewEmail('');
    setEmailOtpStep('input');
    setEmailOtpValues(['', '', '', '', '', '']);
    setEmailOtpError(null);
    setEmailOtpSubmitting(false);
    setIsChangeEmailModalOpen(true);
  };

  const handleSendChangeEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailOtpError(null);
    if (!newEmail.trim()) {
      setEmailOtpError('Vui lòng nhập địa chỉ email mới.');
      return;
    }
    if (newEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      setEmailOtpError('Địa chỉ email mới phải khác email hiện tại.');
      return;
    }

    setEmailOtpSubmitting(true);
    try {
      await api.sendChangeEmailOtp({ newEmail: newEmail.trim() });
      setEmailOtpStep('otp');
      setEmailOtpTimer(60);
      setEmailOtpCanResend(false);
      setEmailOtpValues(['', '', '', '', '', '']);
      setTimeout(() => {
        emailOtpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setEmailOtpError(err.message || 'Lỗi khi gửi mã xác thực OTP.');
    } finally {
      setEmailOtpSubmitting(false);
    }
  };

  const handleResendChangeEmailOtp = async () => {
    if (!emailOtpCanResend || emailOtpSubmitting) return;
    setEmailOtpError(null);
    setEmailOtpSubmitting(true);
    try {
      await api.sendChangeEmailOtp({ newEmail: newEmail.trim() });
      setEmailOtpTimer(60);
      setEmailOtpCanResend(false);
      setEmailOtpValues(['', '', '', '', '', '']);
      emailOtpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setEmailOtpError(err.message || 'Lỗi khi gửi lại mã OTP.');
    } finally {
      setEmailOtpSubmitting(false);
    }
  };

  const handleEmailOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...emailOtpValues];
    newOtp[index] = cleanValue;
    setEmailOtpValues(newOtp);

    if (cleanValue && index < 5) {
      emailOtpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleEmailOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !emailOtpValues[index] && index > 0) {
      emailOtpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleEmailOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setEmailOtpValues(newOtp);
    const nextFocus = Math.min(pasted.length, 5);
    emailOtpInputsRef.current[nextFocus]?.focus();
  };

  const handleVerifyChangeEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailOtpError(null);
    const otpCode = emailOtpValues.join('');
    if (otpCode.length !== 6) {
      setEmailOtpError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setEmailOtpSubmitting(true);
    try {
      await api.verifyChangeEmailOtp({ newEmail: newEmail.trim(), otp: otpCode });
      await refreshUser();
      setIsChangeEmailModalOpen(false);
      setProfileMsg({ type: 'success', text: 'Đổi địa chỉ email thành công và đã được cập nhật!' });
      toast.success('Đổi địa chỉ email thành công!');
    } catch (err: any) {
      setEmailOtpError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setEmailOtpSubmitting(false);
    }
  };

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
      {/* 1. TOP COVER & PROFILE HERO CARD (Matching media_1790167543926.png) */}
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
                    <Mail size={13} className="text-ink-400 dark:text-ink-400" />
                    <span>{user.email}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 font-medium">
                    <Phone size={13} className="text-ink-400 dark:text-ink-400" />
                    <span>{user.phone || 'Chưa cập nhật SĐT'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 font-medium">
                    <Calendar size={13} className="text-ink-400 dark:text-ink-400" />
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

      {/* 2. STAT / METRIC CARDS (Matching media_1790167543926.png) */}
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

      {/* 3. THREE NAVIGATION TABS (Matching media_1790167543926.png) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-1.5 bg-cream-100/70 dark:bg-ink-900/90 border border-cream-200 dark:border-ink-800 rounded-3xl shadow-2xs transition-colors">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'profile'
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
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'addresses'
            ? 'bg-accent-600 text-white shadow-md'
            : 'text-ink-700 dark:text-cream-200 hover:text-ink-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-ink-800'
            }`}
        >
          <MapPin size={16} />
          <span>Sổ Địa Chỉ Giao Hàng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-cream-200 dark:bg-ink-800 text-ink-700 dark:text-cream-300'
              }`}
          >
            {addresses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'orders'
            ? 'bg-accent-600 text-white shadow-md'
            : 'text-ink-700 dark:text-cream-200 hover:text-ink-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-ink-800'
            }`}
        >
          <Package size={16} />
          <span>Lịch Sử Đơn Hàng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-cream-200 dark:bg-ink-800 text-ink-700 dark:text-cream-300'
              }`}
          >
            {orders.length}
          </span>
        </button>
      </div>

      {/* 4. TAB 1: THÔNG TIN CÁ NHÂN & BẢO MẬT (2 COLUMNS) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Left Column: Form Cập Nhật Thông Tin Cá Nhân (7/12) */}
          <div className="lg:col-span-7 bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-ink-900 dark:text-cream-50 mb-1">
                <UserIcon size={20} className="text-accent-600" />
                <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
                  Cập Nhật Thông Tin Cá Nhân
                </h3>
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Thông tin hiển thị khi đặt hàng và giao nhận đơn hàng thiết bị camera nhanh chóng.
              </p>
            </div>

            {profileMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${profileMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1.5">
                  Họ và tên của bạn <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn Phục"
                    className="w-full pl-10 pr-4 py-3 bg-cream-50/80 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 transition-all text-ink-800 dark:text-cream-100 font-medium placeholder:text-ink-400 dark:placeholder:text-ink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1.5">
                  Số điện thoại nhận SMS / Zalo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0909123456"
                    className="w-full pl-10 pr-4 py-3 bg-cream-50/80 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 transition-all text-ink-800 dark:text-cream-100 font-medium placeholder:text-ink-400 dark:placeholder:text-ink-500"
                  />
                </div>
              </div>

              {/* Mã Tài Khoản Khách Hàng */}
              <div className="p-4 bg-cream-50/80 dark:bg-ink-800/80 rounded-2xl border border-cream-200 dark:border-ink-700 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                    Mã tài khoản khách hàng
                  </p>
                  <p className="font-mono font-bold text-sm text-ink-900 dark:text-cream-50 mt-0.5">{customerCode}</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                  Đang hoạt động
                </span>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full btn-accent py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang lưu thay đổi...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Lưu Thay Đổi Thông Tin</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Email, Password & Theme Settings Cards (5/12) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Email & Mật Khẩu Card */}
            <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-6 sm:p-7 shadow-xs space-y-5 transition-colors">
              <div>
                <div className="flex items-center gap-2 text-ink-900 dark:text-cream-50 mb-1">
                  <Shield size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50">
                    Email & Mật Khẩu Đăng Nhập
                  </h3>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Quản lý thông tin xác thực bảo mật và bảo vệ tài khoản của bạn.
                </p>
              </div>

              {/* Email Section */}
              <div className="p-4 bg-cream-50/70 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-700 dark:text-cream-200 flex items-center gap-1.5">
                    <Mail size={14} className="text-ink-400 dark:text-ink-500" />
                    Địa chỉ Email:
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    Đã xác thực
                  </span>
                </div>
                <p className="font-medium text-sm text-ink-900 dark:text-cream-50 truncate">{user.email}</p>
                <button
                  type="button"
                  onClick={handleOpenChangeEmail}
                  className="w-full py-2.5 px-3 rounded-xl border border-cream-300 dark:border-ink-700 bg-white dark:bg-ink-800 hover:bg-cream-50 dark:hover:bg-ink-700 text-ink-800 dark:text-cream-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <KeyRound size={13} className="text-accent-600 dark:text-accent-400" />
                  <span>Đổi Địa Chỉ Email (OTP)</span>
                </button>
              </div>

              {/* Password Section */}
              <div className="p-4 bg-cream-50/70 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-700 dark:text-cream-200 flex items-center gap-1.5">
                    <Lock size={14} className="text-ink-400 dark:text-ink-500" />
                    Mật khẩu tài khoản:
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${user.hasPassword !== false
                      ? 'text-ink-700 dark:text-cream-300 bg-cream-200/80 dark:bg-ink-700'
                      : 'text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300'
                      }`}
                  >
                    {user.hasPassword !== false ? 'Đã thiết lập' : 'Chưa thiết lập'}
                  </span>
                </div>
                <p className="font-mono text-sm tracking-widest text-ink-600 dark:text-cream-300">••••••••••••</p>
                <button
                  type="button"
                  onClick={handleOpenChangePassword}
                  className="w-full py-2.5 px-3 rounded-xl bg-ink-900 dark:bg-ink-700 hover:bg-ink-800 dark:hover:bg-ink-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                >
                  <Lock size={13} className="text-accent-400" />
                  <span>Đổi Mật Khẩu Đăng Nhập</span>
                </button>
              </div>
            </div>

            {/* Cài đặt Giao diện & Chế độ xem Card (Mặc định sáng, cấu hình lưu tự động theo yêu cầu) */}
            <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-6 sm:p-7 shadow-xs space-y-5 transition-colors">
              <div>
                <div className="flex items-center gap-2 text-ink-900 dark:text-cream-50 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 flex items-center justify-center">
                    {clientTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50">
                    Giao Diện & Chế Độ Xem
                  </h3>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Tùy chỉnh phong cách giao diện Sáng / Tối theo sở thích cá nhân của bạn.
                </p>
              </div>

              {/* Options Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Light Mode (Mặc định) */}
                <button
                  type="button"
                  onClick={() => {
                    if (clientTheme !== 'light') {
                      setClientTheme('light');
                      toast.success('Đã chuyển sang Chế độ Sáng (Mặc định)!');
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    clientTheme === 'light'
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20 shadow-xs'
                      : 'bg-cream-50/60 dark:bg-ink-800/40 border-cream-200 dark:border-ink-700 hover:border-amber-300 dark:hover:border-ink-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Sun size={16} />
                    </div>
                    {clientTheme === 'light' ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                        <Check size={12} /> Đang dùng
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-ink-400 dark:text-ink-500 bg-cream-200/60 dark:bg-ink-700 px-2 py-0.5 rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-ink-900 dark:text-cream-50">Chế độ Sáng</p>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 leading-snug">
                      Nền sáng thanh lịch, rõ nét ban ngày (Mặc định).
                    </p>
                  </div>
                </button>

                {/* 2. Dark Mode */}
                <button
                  type="button"
                  onClick={() => {
                    if (clientTheme !== 'dark') {
                      setClientTheme('dark');
                      toast.success('Đã chuyển sang Chế độ Tối (Dark Mode)!');
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    clientTheme === 'dark'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/25 shadow-xs'
                      : 'bg-cream-50/60 dark:bg-ink-800/40 border-cream-200 dark:border-ink-700 hover:border-indigo-400 dark:hover:border-ink-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Moon size={16} />
                    </div>
                    {clientTheme === 'dark' ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-700">
                        <Check size={12} /> Đang dùng
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-ink-400 dark:text-ink-500 bg-cream-200/60 dark:bg-ink-700 px-2 py-0.5 rounded-full">
                        Chế độ tối
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-ink-900 dark:text-cream-50">Chế độ Tối</p>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 leading-snug">
                      Dịu mắt ban đêm, bảo vệ thị lực và tiết kiệm pin.
                    </p>
                  </div>
                </button>
              </div>

              {/* Preference Note */}
              <div className="p-3 bg-cream-50 dark:bg-ink-800/50 rounded-2xl border border-cream-200 dark:border-ink-700/60 flex items-start gap-2 text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Hệ thống ưu tiên nền sáng làm mặc định. Lựa chọn của bạn sẽ được lưu tự động trên thiết bị này và giữ nguyên khi đăng nhập lại.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: SỔ ĐỊA CHỈ NHẬN HÀNG (Matching media_1790167554457.png) */}
      {activeTab === 'addresses' && (
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cream-100 dark:border-ink-800">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
                  Sổ Địa Chỉ Giao Hàng & Ghim Bản Đồ
                </h3>
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                Lưu nhiều địa chỉ để tự động điền nhanh khi mua hàng & giao hỏa tốc GHN
              </p>
            </div>

            <button
              onClick={handleOpenAddAddress}
              className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Thêm Địa Chỉ Mới</span>
            </button>
          </div>

          {loadingAddresses ? (
            <div className="p-12 text-center text-ink-400 dark:text-ink-500">Đang tải danh sách địa chỉ...</div>
          ) : addresses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-cream-100 dark:bg-ink-800 text-cream-400 dark:text-ink-500 flex items-center justify-center mx-auto">
                <MapPin size={32} />
              </div>
              <p className="font-bold text-ink-800 dark:text-cream-100">Chưa có địa chỉ nhận hàng nào</p>
              <p className="text-xs text-ink-400 dark:text-ink-500 max-w-sm mx-auto">
                Hãy thêm địa chỉ giao hàng để đặt mua máy ảnh và phụ kiện dễ dàng hơn
              </p>
              <button
                onClick={handleOpenAddAddress}
                className="btn-accent px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                + Thêm địa chỉ đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-5 rounded-2xl border transition-all shadow-2xs ${addr.isDefault
                    ? 'border-accent-500 ring-2 ring-accent-500/10 bg-white dark:bg-ink-800'
                    : 'border-cream-200 dark:border-ink-700 hover:border-cream-300 dark:hover:border-ink-600 bg-cream-50/50 dark:bg-ink-800/40'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-sm text-ink-900 dark:text-cream-50">{addr.label}</h4>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 px-2 py-0.5 rounded-full">
                            Mặc định
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-ink-800 dark:text-cream-100">
                        {addr.recipientName} • <span className="font-normal text-ink-500 dark:text-ink-400">{addr.phone}</span>
                      </p>

                      <p className="text-xs text-ink-600 dark:text-cream-300 mt-1 line-clamp-2">
                        {addr.address}, {addr.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        onClick={() => handleOpenEditAddress(addr)}
                        className="p-2 rounded-xl bg-white dark:bg-ink-800 hover:bg-cream-100 dark:hover:bg-ink-700 border border-cream-200 dark:border-ink-700 text-ink-600 dark:text-cream-200 hover:text-ink-900 dark:hover:text-cream-50 transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 rounded-xl bg-white dark:bg-ink-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-cream-200 dark:border-ink-700 text-ink-600 dark:text-cream-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {!addr.isDefault && (
                    <div className="mt-3 pt-3 border-t border-cream-100 dark:border-ink-700 flex justify-end">
                      <button
                        onClick={() => handleSetDefaultAddress(addr)}
                        className="text-xs font-bold text-accent-600 dark:text-accent-400 hover:text-accent-700 cursor-pointer"
                      >
                        Thiết lập làm mặc định
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 3: LỊCH SỬ ĐƠN HÀNG (Matching media_1790167562797.png) */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cream-100 dark:border-ink-800">
            <div>
              <div className="flex items-center gap-2">
                <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
                  Lịch Sử Đơn Hàng & Mua Sắm
                </h3>
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                Theo dõi tình trạng đơn đặt hàng thiết bị máy ảnh và phụ kiện của bạn
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-cream-100 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 text-ink-700 dark:text-cream-200 font-bold text-xs">
              {orders.length} Đơn Hàng Đã Ghi Nhận
            </span>
          </div>

          {loadingOrders ? (
            <div className="p-12 text-center text-ink-400 dark:text-ink-500">Đang tải lịch sử đơn hàng...</div>
          ) : orders.length === 0 ? (
            /* Empty State Matching media_1790167562797.png */
            <div className="py-16 px-4 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-cream-100/80 dark:bg-ink-800 text-cream-400 dark:text-ink-500 flex items-center justify-center mx-auto border border-cream-200/60 dark:border-ink-700 shadow-2xs">
                <Package size={40} className="stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50">
                  Bạn chưa có đơn hàng nào
                </h4>
                <p className="text-xs text-ink-500 dark:text-ink-400 max-w-md mx-auto">
                  Khám phá các sản phẩm máy ảnh, ống kính và phụ kiện chuyên nghiệp ngay hôm nay!
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate({ name: 'catalog' })}
                className="btn-accent px-6 py-3 rounded-2xl font-bold text-xs shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <ShoppingBag size={15} />
                <span>Mua Sắm Ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusColor =
                  order.status === 'delivered'
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                    : order.status === 'shipping'
                      ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
                      : order.status === 'cancelled'
                        ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
                        : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';

                const statusText =
                  order.status === 'delivered'
                    ? 'Đã giao thành công'
                    : order.status === 'shipping'
                    ? 'Đang vận chuyển'
                    : order.status === 'cancelled'
                    ? 'Đã hủy đơn'
                    : 'Chờ xác nhận & đóng gói';

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl border border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-900 hover:border-cream-300 dark:hover:border-ink-700 transition-all shadow-2xs space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cream-100 dark:border-ink-800">
                      <div>
                        <span className="font-mono font-bold text-sm text-ink-900 dark:text-cream-50">
                          #{order.order_code || order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-ink-400 dark:text-ink-500 ml-3">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}
                        >
                          {statusText}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate({ name: 'orders' })}
                          className="text-xs font-bold text-accent-600 dark:text-accent-400 hover:text-accent-700 flex items-center gap-1 cursor-pointer ml-2"
                        >
                          <span>Xem chi tiết</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover border border-cream-200 dark:border-ink-700 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-cream-100 dark:bg-ink-800 flex items-center justify-center shrink-0">
                              <Package size={20} className="text-ink-400 dark:text-ink-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-ink-900 dark:text-cream-50 truncate">{item.name}</p>
                            <p className="text-[11px] text-ink-500 dark:text-ink-400">Số lượng: {item.quantity}</p>
                          </div>
                          <span className="font-bold text-xs text-ink-900 dark:text-cream-50">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="pt-3 border-t border-cream-100 dark:border-ink-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-ink-500 dark:text-ink-400">
                        Phương thức:{' '}
                        <strong className="text-ink-700 dark:text-cream-200">
                          {order.payment_method === 'bank_transfer'
                            ? 'Chuyển khoản SePay'
                            : order.payment_method === 'momo'
                              ? 'Ví MoMo'
                              : 'Thanh toán COD'}
                        </strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-ink-500 dark:text-ink-400">Tổng thanh toán:</span>
                        <strong className="font-display font-bold text-base text-accent-600 dark:text-accent-400">
                          {formatCurrency(order.total_amount)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. MODAL THAY ĐỔI MẬT KHẨU ĐĂNG NHẬP (Matching media_1790167554457.png) */}
      <AnimatePresence>
        {isChangePasswordModalOpen && (
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsChangePasswordModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-ink-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-cream-200 dark:border-ink-800 space-y-6 relative text-ink-900 dark:text-cream-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-cream-100 dark:hover:bg-ink-800 flex items-center justify-center text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-cream-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-800 flex items-center justify-center mb-2 shadow-2xs">
                  <Lock size={22} />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
                  Thay Đổi Mật Khẩu Đăng Nhập
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                  Bảo vệ tài khoản CameraHub của bạn với mật khẩu an toàn hơn.
                </p>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {user.hasPassword === false && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>
                    Tài khoản của bạn được tạo qua Google OAuth. Bạn có thể thiết lập mật khẩu mới trực tiếp mà không cần nhập mật khẩu cũ.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmitChangePassword} className="space-y-4">
                {user.hasPassword !== false && (
                  <div>
                    <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1.5">
                      Mật khẩu hiện tại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full pl-4 pr-11 py-3 bg-cream-50/80 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 transition-all text-ink-800 dark:text-cream-100 font-medium placeholder:text-ink-400 dark:placeholder:text-ink-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-cream-100 cursor-pointer p-1"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1.5">
                    Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full pl-4 pr-11 py-3 bg-cream-50/80 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 transition-all text-ink-800 dark:text-cream-100 font-medium placeholder:text-ink-400 dark:placeholder:text-ink-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-cream-100 cursor-pointer p-1"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1.5">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-4 pr-11 py-3 bg-cream-50/80 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 transition-all text-ink-800 dark:text-cream-100 font-medium placeholder:text-ink-400 dark:placeholder:text-ink-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-cream-100 cursor-pointer p-1"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl border border-cream-300 dark:border-ink-700 text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex-1 btn-accent py-3 rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>Cập Nhật Mật Khẩu</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. MODAL ĐỔI ĐỊA CHỈ EMAIL QUA XÁC THỰC OTP */}
      <AnimatePresence>
        {isChangeEmailModalOpen && (
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsChangeEmailModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-ink-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-cream-200 dark:border-ink-800 space-y-6 relative text-ink-900 dark:text-cream-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsChangeEmailModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-cream-100 dark:hover:bg-ink-800 flex items-center justify-center text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-cream-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {emailOtpStep === 'input' ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-800 flex items-center justify-center mx-auto shadow-2xs">
                      <Mail size={24} />
                    </div>
                    <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
                      Thay Đổi Địa Chỉ Email
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                      Hệ thống sẽ gửi mã xác thực OTP 6 số đến email mới để bảo đảm an toàn cho tài khoản của bạn.
                    </p>
                  </div>

                  {emailOtpError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{emailOtpError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendChangeEmailOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1.5">
                        Địa chỉ Email mới <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="email_moi@gmail.com"
                        className="w-full px-4 py-3 bg-cream-50/80 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 transition-all text-ink-800 dark:text-cream-100 font-medium placeholder:text-ink-400 dark:placeholder:text-ink-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={emailOtpSubmitting}
                      className="w-full btn-accent py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {emailOtpSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Đang gửi mã OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Gửi mã xác thực OTP</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-800 flex items-center justify-center mx-auto shadow-2xs">
                      <KeyRound size={24} />
                    </div>
                    <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">Xác Thực Mã OTP</h3>
                    <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                      Vui lòng nhập mã gồm 6 chữ số vừa được gửi tới:
                      <br />
                      <strong className="text-accent-600 dark:text-accent-400 font-semibold">{newEmail}</strong>
                    </p>
                  </div>

                  {emailOtpError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{emailOtpError}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyChangeEmailOtp} className="space-y-4">
                    <div className="flex justify-center gap-2" onPaste={handleEmailOtpPaste}>
                      {emailOtpValues.map((val, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            emailOtpInputsRef.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleEmailOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleEmailOtpKeyDown(idx, e)}
                          className="w-10 h-12 sm:w-11 sm:h-13 text-center font-mono font-bold text-xl bg-cream-50/70 dark:bg-ink-800/70 border-2 border-cream-200 dark:border-ink-700 rounded-xl focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 text-ink-900 dark:text-cream-50 transition-all shadow-2xs"
                        />
                      ))}
                    </div>

                    <div className="text-center text-xs">
                      {emailOtpCanResend ? (
                        <button
                          type="button"
                          onClick={handleResendChangeEmailOtp}
                          disabled={emailOtpSubmitting}
                          className="inline-flex items-center gap-1 font-bold text-accent-600 dark:text-accent-400 hover:text-accent-700 hover:underline cursor-pointer"
                        >
                          <RotateCcw size={13} />
                          <span>Gửi lại mã OTP</span>
                        </button>
                      ) : (
                        <span className="text-ink-400 dark:text-ink-500">
                          Gửi lại mã sau: <strong className="text-ink-700 dark:text-cream-200 font-mono">{emailOtpTimer}s</strong>
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={emailOtpSubmitting || emailOtpValues.join('').length !== 6}
                      className="w-full btn-accent py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {emailOtpSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Đang xác thực...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Xác nhận & Cập nhật Email</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailOtpStep('input')}
                      className="w-full py-1 text-xs font-bold text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-cream-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={13} />
                      <span>Nhập lại địa chỉ email khác</span>
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. MODAL THÊM / SỬA ĐỊA CHỈ NHẬN HÀNG */}
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
