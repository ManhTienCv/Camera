import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, User, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export interface GoogleOnboardingModalProps {
  onError: (msg: string) => void;
}

export const GoogleOnboardingModal: React.FC<GoogleOnboardingModalProps> = ({ onError }) => {
  const { onboardingData, completeOnboarding, cancelOnboarding, loginWithGoogle } = useAuth();
  const toast = useToast();

  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (onboardingData) {
      setOnboardingName(onboardingData.user.fullName || '');
      setOnboardingPhone(onboardingData.user.phone || '');
    }
  }, [onboardingData]);

  if (!onboardingData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingName.trim()) {
      onError('Vui lòng nhập tên hiển thị của bạn.');
      return;
    }
    setOnboardingLoading(true);
    try {
      await completeOnboarding(onboardingName, onboardingPhone);
      toast.success('Thiết lập tài khoản thành công!');
    } catch (err: any) {
      onError(err.message || 'Lỗi khi hoàn tất thông tin.');
    } finally {
      setOnboardingLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-7 flex flex-col justify-center space-y-3.5 animate-fade-in">
      <div className="text-center space-y-1">
        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <CheckCircle2 size={22} className="text-emerald-500" />
        </div>
        <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
          Hoàn tất thông tin tài khoản
        </h3>
        <p className="text-xs text-ink-500 dark:text-ink-400">
          Thiết lập tên hiển thị của bạn để gia nhập CameraHub
        </p>
      </div>

      {/* User email info card */}
      <div className="p-2.5 bg-cream-50 dark:bg-ink-800 rounded-xl border border-cream-200 dark:border-ink-700 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {onboardingData.user.avatarUrl ? (
            <img
              src={onboardingData.user.avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-cream-300 dark:border-ink-600 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center font-bold text-xs shrink-0">
              {onboardingData.user.fullName?.charAt(0) || 'U'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink-900 dark:text-cream-50 truncate">
              {onboardingData.user.email}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <ShieldCheck size={12} />
              <span>Tài khoản Google hợp lệ</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            cancelOnboarding();
            loginWithGoogle();
          }}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline shrink-0 cursor-pointer"
        >
          Đổi tài khoản
        </button>
      </div>

      {/* Onboarding form */}
      <form onSubmit={handleSubmit} className="space-y-3 max-w-[310px] sm:max-w-[330px] mx-auto w-full">
        <div>
          <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1">
            Tên hiển thị của bạn <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              required
              value={onboardingName}
              onChange={(e) => setOnboardingName(e.target.value)}
              placeholder="Ví dụ: Tiến Mạnh"
              className="w-full pl-9 pr-3.5 py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
            />
          </div>
          <p className="text-[10px] text-ink-400 dark:text-ink-400 mt-1">
            Tên này sẽ hiển thị trên đơn hàng, giỏ hàng và danh tính tài khoản của bạn.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1">
            Số điện thoại liên hệ (Khuyến khích)
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="tel"
              value={onboardingPhone}
              onChange={(e) => setOnboardingPhone(e.target.value)}
              placeholder="Ví dụ: 0923745596"
              className="w-full pl-9 pr-3.5 py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
            />
          </div>
          <p className="text-[10px] text-ink-400 dark:text-ink-400 mt-1">
            Dùng để nhận SMS mã vận đơn và giao nhận hàng GHN Express.
          </p>
        </div>

        <button
          type="submit"
          disabled={onboardingLoading}
          className="w-full btn-accent py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
        >
          {onboardingLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>Hoàn tất & Bắt đầu mua sắm</span>
          )}
        </button>

        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={cancelOnboarding}
            className="text-xs font-bold text-ink-500 hover:text-ink-800 dark:hover:text-cream-200 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            <span>Quay lại Đăng nhập</span>
          </button>
        </div>
      </form>
    </div>
  );
};
