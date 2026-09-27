import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, ArrowRight, ArrowLeft, KeyRound, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { OtpInputGroup } from './OtpInputGroup';

export interface RegisterFormProps {
  onError: (msg: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onError, onSwitchToLogin }) => {
  const { registerWithOtp, loginWithGoogle } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
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
  }, [step, resendTimer]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      onError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      onError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      await api.sendRegisterOtp({ email, fullName });
      setStep('otp');
      setResendTimer(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err: any) {
      onError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || submitting) return;
    setSubmitting(true);
    try {
      await api.sendRegisterOtp({ email, fullName });
      toast.success('Mã OTP mới đã được gửi tới email của bạn.');
      setResendTimer(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err: any) {
      onError(err.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      onError('Vui lòng nhập đầy đủ 6 chữ số OTP.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithOtp(email, password, fullName, phone, otpCode);
    } catch (err: any) {
      onError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col justify-center space-y-2.5">
      {step === 'form' ? (
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
              onClick={onSwitchToLogin}
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
              <strong className="text-accent-600 dark:text-accent-400 font-semibold">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <OtpInputGroup
              values={otpValues}
              onChange={setOtpValues}
              autoFocus={true}
            />

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
              onClick={() => setStep('form')}
              className="w-full py-1 text-xs font-bold text-ink-500 hover:text-ink-800 dark:hover:text-cream-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Thay đổi thông tin đăng ký</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
