import React, { useState, useEffect } from 'react';
import { KeyRound, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { OtpInputGroup } from './OtpInputGroup';

export interface ForgotPasswordModalProps {
  initialEmail?: string;
  onError: (msg: string) => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  initialEmail = '',
  onError,
  onBackToLogin,
}) => {
  const { setAuthenticatedUser, closeAuthModal } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<'email' | 'otp_reset'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === 'otp_reset' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      onError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.sendForgotPasswordOtp({ email: email.trim() });
      toast.success(res.message || 'Mã OTP đã được gửi tới email của bạn!');
      setStep('otp_reset');
      setTimer(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      onError(err.message || 'Không tìm thấy tài khoản với email này.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (!canResend || submitting) return;
    setSubmitting(true);
    try {
      await api.sendForgotPasswordOtp({ email: email.trim() });
      toast.success('Mã OTP mới đã được gửi tới email của bạn.');
      setTimer(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err: any) {
      onError(err.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      onError('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }
    if (newPassword.length < 6) {
      onError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      onError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.resetPasswordWithOtp({
        email: email.trim(),
        otp: otpCode,
        newPassword: newPassword,
      });

      toast.success('Đặt lại mật khẩu thành công! Đã tự động đăng nhập.');
      if (res.token && res.user) {
        setAuthenticatedUser(res.token, res.user);
      }
      closeAuthModal();
    } catch (err: any) {
      onError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 sm:p-7 flex flex-col justify-center space-y-4 animate-fade-in">
      {step === 'email' ? (
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              onClick={onBackToLogin}
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
              <strong className="text-accent-600 dark:text-accent-400 font-semibold">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-3 max-w-[310px] sm:max-w-[330px] mx-auto w-full">
            {/* OTP 6 Digits */}
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1 text-center">
                Nhập mã xác thực OTP (6 chữ số)
              </label>
              <OtpInputGroup
                values={otpValues}
                onChange={setOtpValues}
                autoFocus={true}
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-cream-50/70 dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-800 focus:ring-2 focus:ring-accent-500/15 transition-all text-ink-900 dark:text-cream-100 font-medium"
                />
              </div>
            </div>

            {/* Resend OTP */}
            <div className="text-center text-xs">
              {canResend ? (
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
                  Gửi lại mã sau: <strong className="text-ink-700 dark:text-cream-200 font-mono">{timer}s</strong>
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
                  <span>Xác nhận & Đăng nhập ngay</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-ink-900 dark:hover:text-cream-200 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Đổi địa chỉ email khác</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
