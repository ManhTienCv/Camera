import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Shield,
  Sun,
  Moon,
  Check,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import type { User } from '../../types';

interface ProfileInfoTabProps {
  user: User;
  customerCode: string;
  onOpenChangeEmail: () => void;
  onOpenChangePassword: () => void;
}

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  user,
  customerCode,
  onOpenChangeEmail,
  onOpenChangePassword,
}) => {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const { clientTheme, setClientTheme } = useTheme();

  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFullName(user.fullName || '');
    setPhone(user.phone || '');
  }, [user]);

  // Auto dismiss profile message
  useEffect(() => {
    if (profileMsg) {
      const timer = setTimeout(() => {
        setProfileMsg(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [profileMsg]);

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

  return (
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
              onClick={onOpenChangeEmail}
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
              onClick={onOpenChangePassword}
              className="w-full py-2.5 px-3 rounded-xl bg-ink-900 dark:bg-ink-700 hover:bg-ink-800 dark:hover:bg-ink-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <Lock size={13} className="text-accent-400" />
              <span>Đổi Mật Khẩu Đăng Nhập</span>
            </button>
          </div>
        </div>

        {/* Cài đặt Giao diện & Chế độ xem Card */}
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
              Tùy chỉnh giao diện
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
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${clientTheme === 'light'
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
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${clientTheme === 'dark'
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

              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
