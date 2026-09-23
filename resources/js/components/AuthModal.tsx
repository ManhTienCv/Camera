import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Zap,
  Camera,
  AlertCircle,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    login,
    registerWithOtp,
    setAuthenticatedUser,
    loginWithGoogle,
    demoGoogleLogin,
    onboardingData,
    completeOnboarding,
    cancelOnboarding,
  } = useAuth();
  const toast = useToast();

  // Onboarding form state (Hoàn tất thông tin tài khoản cho mail chưa đăng ký)
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (onboardingData) {
      setOnboardingName(onboardingData.user.fullName || '');
      setOnboardingPhone(onboardingData.user.phone || '');
    }
  }, [onboardingData]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Register OTP state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot Password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp_reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpValues, setForgotOtpValues] = useState(['', '', '', '', '', '']);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotTimer, setForgotTimer] = useState(60);
  const [forgotCanResend, setForgotCanResend] = useState(false);
  const forgotOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Tự động tắt thông báo lỗi sau 4 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setRegStep('form');
      setOtpValues(['', '', '', '', '', '']);
      setIsForgotPassword(false);
      setForgotStep('email');
      setForgotOtpValues(['', '', '', '', '', '']);
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

  // Resend register OTP countdown timer
  useEffect(() => {
    let interval: any;
    if (regStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [regStep, resendTimer]);

  // Resend forgot password OTP countdown timer
  useEffect(() => {
    let interval: any;
    if (isForgotPassword && forgotStep === 'otp_reset' && forgotTimer > 0) {
      interval = setInterval(() => {
        setForgotTimer((prev) => {
          if (prev <= 1) {
            setForgotCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isForgotPassword, forgotStep, forgotTimer]);

  if (!isAuthModalOpen) return null;

  // ==========================================
  // LOGIN SUBMIT
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // REGISTER OTP SUBMIT
  // ==========================================
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      await api.sendRegisterOtp({ email: regEmail, fullName: regFullName });
      setRegStep('otp');
      setResendTimer(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.sendRegisterOtp({ email: regEmail, fullName: regFullName });
      toast.success('Mã OTP mới đã được gửi tới email của bạn.');
      setResendTimer(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithOtp(regEmail, regPassword, regFullName, regPhone, otpCode);
    } catch (err: any) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // FORGOT PASSWORD OTP HANDLERS
  // ==========================================
  const handleOpenForgotPassword = () => {
    setIsForgotPassword(true);
    setForgotStep('email');
    setForgotEmail(loginEmail.trim() || '');
    setError(null);
  };

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await api.sendForgotPasswordOtp({ email: forgotEmail.trim() });
      toast.success(res.message || 'Mã OTP đã được gửi tới email của bạn!');
      setForgotStep('otp_reset');
      setForgotTimer(60);
      setForgotCanResend(false);
      setForgotOtpValues(['', '', '', '', '', '']);
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setTimeout(() => {
        forgotOtpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy tài khoản với email này.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (!forgotCanResend || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.sendForgotPasswordOtp({ email: forgotEmail.trim() });
      toast.success('Mã OTP mới đã được gửi tới email của bạn.');
      setForgotTimer(60);
      setForgotCanResend(false);
      setForgotOtpValues(['', '', '', '', '', '']);
      forgotOtpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = forgotOtpValues.join('');
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await api.resetPasswordWithOtp({
        email: forgotEmail.trim(),
        otp: otpCode,
        newPassword: forgotNewPassword,
      });

      toast.success('Đặt lại mật khẩu thành công! Đã tự động đăng nhập.');
      if (res.token && res.user) {
        setAuthenticatedUser(res.token, res.user);
      }
      closeAuthModal();
      setIsForgotPassword(false);
    } catch (err: any) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // OTP INPUT HELPERS
  // ==========================================
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpValues];
    next[index] = digit;
    setOtpValues(next);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...otpValues];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpValues(next);

    const nextFocusIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextFocusIndex]?.focus();
  };

  // Forgot OTP Input Helpers
  const handleForgotOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...forgotOtpValues];
    next[index] = digit;
    setForgotOtpValues(next);

    if (digit && index < 5) {
      forgotOtpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !forgotOtpValues[index] && index > 0) {
      forgotOtpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleForgotOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...forgotOtpValues];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setForgotOtpValues(next);

    const nextFocusIndex = Math.min(pasted.length, 5);
    forgotOtpInputsRef.current[nextFocusIndex]?.focus();
  };

  const handleSwitchTab = (tab: 'login' | 'register') => {
    setError(null);
    setIsForgotPassword(false);
    setRegStep('form');
    setOtpValues(['', '', '', '', '', '']);
    openAuthModal(tab);
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

          {/* ===================================================================== */}
          {/* VIEW 0: ONBOARDING CHO EMAIL/GOOGLE CHƯA ĐĂNG KÝ (MATCHES MOCKUP)      */}
          {/* ===================================================================== */}
          {onboardingData ? (
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

              {/* User email info card (Matches Image) */}
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
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!onboardingName.trim()) {
                    setError('Vui lòng nhập tên hiển thị của bạn.');
                    return;
                  }
                  setOnboardingLoading(true);
                  try {
                    await completeOnboarding(onboardingName, onboardingPhone);
                    toast.success('Thiết lập tài khoản thành công!');
                  } catch (err: any) {
                    setError(err.message || 'Lỗi khi hoàn tất thông tin.');
                  } finally {
                    setOnboardingLoading(false);
                  }
                }}
                className="space-y-3 max-w-[310px] sm:max-w-[330px] mx-auto w-full"
              >
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
          ) : isForgotPassword ? (
            <div className="p-5 sm:p-7 flex flex-col justify-center space-y-4 animate-fade-in">
              {forgotStep === 'email' ? (
                <>
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-400 flex items-center justify-center mx-auto mb-1 border border-accent-100 dark:border-accent-800 shadow-2xs">
                      <KeyRound size={20} />
                    </div>
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-cream-50">Quên mật khẩu?</h3>
                    <p className="text-xs text-ink-500 dark:text-ink-400 max-w-xs mx-auto">
                      Nhập địa chỉ email đăng ký để nhận mã xác thực OTP đặt lại mật khẩu qua Gmail.
                    </p>
                  </div>

                  <form onSubmit={handleSendForgotOtp} className="space-y-3 max-w-[310px] sm:max-w-[330px] mx-auto w-full">
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1">Email tài khoản</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="ten@email.com"
                          className="w-full pl-9 pr-3.5 py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-accent py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Gửi mã xác thực OTP</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-ink-900 dark:hover:text-cream-200 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={13} />
                      <span>Quay lại Đăng nhập</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1 border border-emerald-100 dark:border-emerald-800 shadow-2xs">
                      <CheckCircle2 size={20} />
                    </div>
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-cream-50">Đặt lại mật khẩu</h3>
                    <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                      Mã OTP 6 số đã được gửi qua email tới:
                      <br />
                      <strong className="text-accent-600 dark:text-accent-400 font-semibold">{forgotEmail}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3 max-w-[310px] sm:max-w-[330px] mx-auto w-full">
                    {/* OTP 6 Digits */}
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1 text-center">
                        Nhập mã xác thực OTP (6 chữ số)
                      </label>
                      <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handleForgotOtpPaste}>
                        {forgotOtpValues.map((val, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              forgotOtpInputsRef.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={val}
                            onChange={(e) => handleForgotOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleForgotOtpKeyDown(idx, e)}
                            className="w-8 h-10 sm:w-9 sm:h-11 text-center font-mono font-bold text-base sm:text-lg bg-cream-50/70 dark:bg-ink-800/80 border-2 border-cream-200 dark:border-ink-700 rounded-xl focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/20 text-ink-900 dark:text-cream-100 transition-all shadow-2xs"
                          />
                        ))}
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                        <input
                          type="password"
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                        <input
                          type="password"
                          required
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                        />
                      </div>
                    </div>

                    {/* Resend OTP */}
                    <div className="text-center text-xs">
                      {forgotCanResend ? (
                        <button
                          type="button"
                          onClick={handleResendForgotOtp}
                          disabled={submitting}
                          className="inline-flex items-center gap-1.5 font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 hover:underline cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Gửi lại mã OTP</span>
                        </button>
                      ) : (
                        <span className="text-ink-400 dark:text-ink-400">
                          Gửi lại mã sau: <strong className="text-ink-700 dark:text-cream-200 font-mono">{forgotTimer}s</strong>
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || forgotOtpValues.join('').length !== 6}
                      className="w-full btn-accent py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Xác nhận & Đăng nhập ngay</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep('email')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-ink-900 dark:hover:text-cream-200 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={13} />
                      <span>Đổi địa chỉ email khác</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ===================================================================== */
            /* VIEW B: STANDARD SLIDING TRACK (LOGIN & REGISTER) */
            /* ===================================================================== */
            <div
              className="w-[200%] flex will-change-transform"
              style={{
                transform: authModalTab === 'login' ? 'translateX(0%)' : 'translateX(-50%)',
                transition: 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* ------------------------------------------------------------- */}
              {/* SLIDE 1: FORM ĐĂNG NHẬP */}
              {/* ------------------------------------------------------------- */}
              <div className="w-1/2 p-5 sm:p-7 flex flex-col justify-center space-y-3.5">
                <div className="text-center space-y-1">
                  <h3 className="font-display font-bold text-2xl text-ink-900 dark:text-cream-50">Đăng nhập</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Chào mừng bạn quay trở lại với CameraHub</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3 max-w-[310px] sm:max-w-[330px] mx-auto w-full">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="ten@email.com"
                        className="w-full pl-9 pr-3.5 py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-ink-700 dark:text-cream-200">Mật khẩu</label>
                      <button
                        type="button"
                        onClick={handleOpenForgotPassword}
                        className="text-[11px] font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 hover:underline cursor-pointer transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-accent py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Đăng nhập</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative py-0.5 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-cream-200 dark:border-ink-700" />
                    </div>
                    <span className="relative px-3 bg-white dark:bg-ink-900 text-[10px] font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                      HOẶC
                    </span>
                  </div>

                  {/* Google Login Button */}
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="w-full py-2 px-3 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:bg-cream-50 dark:hover:bg-ink-700/60 text-xs font-bold text-ink-900 dark:text-cream-100 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Tiếp tục với Google</span>
                  </button>
                </form>

                {/* Bottom Switch Link */}
                <div className="text-center text-xs text-ink-500 dark:text-ink-400 pt-0.5">
                  <span>Bạn chưa có tài khoản? </span>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('register')}
                    className="font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 hover:underline cursor-pointer"
                  >
                    Tạo tài khoản mới
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SLIDE 2: FORM ĐĂNG KÝ HOẶC XÁC THỰC OTP */}
              {/* ------------------------------------------------------------- */}
              <div className="w-1/2 p-4 sm:p-6 flex flex-col justify-center space-y-2.5">
                {regStep === 'form' ? (
                  <>
                    <div className="text-center space-y-0.5">
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-cream-50">Tạo tài khoản</h3>
                      <p className="text-[11px] text-ink-500 dark:text-ink-400">Đăng ký nhanh bằng Google hoặc điền thông tin</p>
                    </div>

                    <div className="max-w-[310px] sm:max-w-[330px] mx-auto w-full space-y-2">
                      {/* Google Quick Register Button */}
                      <button
                        type="button"
                        onClick={loginWithGoogle}
                        className="w-full py-2 px-3 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:bg-cream-50 dark:hover:bg-ink-700/60 text-xs font-bold text-ink-900 dark:text-cream-100 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Đăng ký nhanh với Google</span>
                      </button>

                      <div className="relative py-0.5 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-cream-200 dark:border-ink-700" />
                        </div>
                        <span className="relative px-2.5 bg-white dark:bg-ink-900 text-[10px] font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                          HOẶC ĐIỀN THÔNG TIN
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleRequestOtp} className="space-y-2 max-w-[310px] sm:max-w-[330px] mx-auto w-full">
                      {/* Full Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-200 mb-0.5">Họ và tên</label>
                        <div className="relative">
                          <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                          <input
                            type="text"
                            required
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                          />
                        </div>
                      </div>

                      {/* Email & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-200 mb-0.5">Email</label>
                          <div className="relative">
                            <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                            <input
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="ten@email.com"
                              className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-200 mb-0.5">Số điện thoại</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                            <input
                              type="tel"
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="0912345678"
                              className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Password & Confirm Password */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-200 mb-0.5">Mật khẩu</label>
                          <div className="relative">
                            <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                            <input
                              type="password"
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink-700 dark:text-cream-200 mb-0.5">Xác nhận MK</label>
                          <div className="relative">
                            <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                            <input
                              type="password"
                              required
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full btn-accent py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Nhận mã OTP qua Email</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Switch to Login */}
                    <div className="text-center text-xs text-ink-500 dark:text-ink-400 pt-0.5">
                      <span>Đã có tài khoản? </span>
                      <button
                        type="button"
                        onClick={() => handleSwitchTab('login')}
                        className="font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 hover:underline cursor-pointer"
                      >
                        Đăng nhập ngay
                      </button>
                    </div>
                  </>
                ) : (
                  /* Form OTP Verify */
                  <div className="space-y-4 max-w-[310px] sm:max-w-[330px] mx-auto w-full text-center">
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-400 flex items-center justify-center mx-auto border border-accent-100 dark:border-accent-800 shadow-2xs">
                        <KeyRound size={20} />
                      </div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-cream-50">Xác thực mã OTP</h3>
                      <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                        Mã xác thực gồm 6 chữ số đã được gửi tới email:
                        <br />
                        <strong className="text-accent-600 dark:text-accent-400 font-semibold">{regEmail}</strong>
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                      <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                        {otpValues.map((val, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputsRef.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={val}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-8 h-10 sm:w-9 sm:h-11 text-center font-mono font-bold text-base sm:text-lg bg-cream-50/70 dark:bg-ink-800/80 border-2 border-cream-200 dark:border-ink-700 rounded-xl focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/20 text-ink-900 dark:text-cream-100 transition-all shadow-2xs"
                          />
                        ))}
                      </div>

                      <div className="text-center text-xs">
                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 hover:underline cursor-pointer"
                          >
                            <RotateCcw size={12} />
                            <span>Gửi lại mã OTP qua email</span>
                          </button>
                        ) : (
                          <span className="text-ink-400 dark:text-ink-400">
                            Gửi lại mã sau: <strong className="text-ink-700 dark:text-cream-200 font-mono">{resendTimer}s</strong>
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || otpValues.join('').length !== 6}
                        className="w-full btn-accent py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Xác thực & Tạo tài khoản</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegStep('form')}
                        className="w-full py-1 text-xs font-bold text-ink-500 hover:text-ink-800 dark:hover:text-cream-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft size={13} />
                        <span>Thay đổi thông tin đăng ký</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
