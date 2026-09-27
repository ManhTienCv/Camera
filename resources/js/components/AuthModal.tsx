import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleOnboardingModal } from './auth/GoogleOnboardingModal';
import { ForgotPasswordModal } from './auth/ForgotPasswordModal';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    onboardingData,
  } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error banner after 4s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Lock body scroll when modal is open and reset states on close
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsForgotPassword(false);
      setError(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthModalOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSwitchTab = (tab: 'login' | 'register') => {
    setError(null);
    setIsForgotPassword(false);
    openAuthModal(tab);
  };

  const handleOpenForgotPassword = () => {
    setError(null);
    setIsForgotPassword(true);
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-[720px] bg-white dark:bg-ink-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-cream-200 dark:border-ink-800 overflow-hidden animate-scale-up grid grid-cols-1 md:grid-cols-12 min-h-[460px] sm:min-h-[480px] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BRAND IMAGE BANNER (42% Width) */}
        {/* ========================================================================= */}
        <div className="hidden md:flex md:col-span-5 relative flex-col justify-between p-6 overflow-hidden bg-ink-900 select-none">
          <img
            src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1200"
            alt="CameraHub Photography"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-85 scale-105 transition-transform duration-700 hover:scale-100"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-black/30 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[11px] font-bold text-white border border-white/20 shadow-xs">
              <Camera size={14} className="text-accent-400" />
              <span>CameraHub</span>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
                {onboardingData
                  ? 'Thiết lập tên hiển thị tài khoản'
                  : isForgotPassword
                  ? 'Bảo mật tài khoản của bạn'
                  : authModalTab === 'login'
                  ? 'Trọn vẹn đam mê trên từng khung hình'
                  : 'Trở thành hội viên chính thức ngay hôm nay'}
              </h3>
              <p className="text-[11px] text-cream-100/80 leading-relaxed font-normal">
                {onboardingData
                  ? 'Hệ thống tự động đồng bộ đơn hàng, vận chuyển GHN Express và thanh toán trực tuyến bảo mật.'
                  : isForgotPassword
                  ? 'Khôi phục quyền truy cập vào tài khoản với mã xác thực OTP gửi trực tiếp tới email cá nhân của bạn.'
                  : 'Khám phá hệ sinh thái máy ảnh, ống kính và phụ kiện nhiếp ảnh chính hãng với chính sách bảo hành và ưu đãi độc quyền dành riêng cho bạn.'}
              </p>
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center gap-3 text-[10px] font-semibold text-cream-200">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-accent-400" />
                Bảo mật 100%
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Zap size={13} className="text-accent-400" />
                Hỗ trợ 24/7
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: DYNAMIC FORM CONTAINER (58% Width) */}
        {/* ========================================================================= */}
        <div className="md:col-span-7 relative flex flex-col justify-center overflow-hidden bg-white dark:bg-ink-900">
          <button
            onClick={closeAuthModal}
            className="absolute top-3.5 right-3.5 z-20 p-1.5 rounded-full text-ink-400 hover:text-ink-900 dark:hover:text-cream-100 hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>

          {/* Error Banner */}
          {error && (
            <div className="absolute top-11 left-5 right-5 z-20 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fade-in shadow-2xs">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* VIEW 0: ONBOARDING FOR GOOGLE ACCOUNT */}
          {onboardingData ? (
            <GoogleOnboardingModal onError={(msg) => setError(msg)} />
          ) : isForgotPassword ? (
            /* VIEW 1: FORGOT PASSWORD FLOW */
            <ForgotPasswordModal
              initialEmail={loginEmail.trim()}
              onError={(msg) => setError(msg)}
              onBackToLogin={() => setIsForgotPassword(false)}
            />
          ) : (
            /* VIEW 2: SLIDING TRACK FOR LOGIN & REGISTER */
            <div
              className="w-[200%] flex will-change-transform"
              style={{
                transform: authModalTab === 'login' ? 'translateX(0%)' : 'translateX(-50%)',
                transition: 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* SLIDE 1: LOGIN */}
              <div className="w-1/2">
                <LoginForm
                  loginEmail={loginEmail}
                  setLoginEmail={setLoginEmail}
                  onError={(msg) => setError(msg)}
                  onForgotPassword={handleOpenForgotPassword}
                  onSwitchToRegister={() => handleSwitchTab('register')}
                />
              </div>

              {/* SLIDE 2: REGISTER */}
              <div className="w-1/2">
                <RegisterForm
                  onError={(msg) => setError(msg)}
                  onSwitchToLogin={() => handleSwitchTab('login')}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
