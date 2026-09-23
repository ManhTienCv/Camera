import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  KeyRound,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSuccess?: () => void;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const toast = useToast();

  const [newEmail, setNewEmail] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'input' | 'otp'>('input');
  const [emailOtpValues, setEmailOtpValues] = useState(['', '', '', '', '', '']);
  const [emailOtpTimer, setEmailOtpTimer] = useState(60);
  const [emailOtpCanResend, setEmailOtpCanResend] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailOtpSubmitting, setEmailOtpSubmitting] = useState(false);
  const emailOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Auto dismiss error
  useEffect(() => {
    if (emailOtpError) {
      const timer = setTimeout(() => {
        setEmailOtpError(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [emailOtpError]);

  // Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (isOpen && emailOtpStep === 'otp' && emailOtpTimer > 0) {
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
  }, [isOpen, emailOtpStep, emailOtpTimer]);

  const resetForm = () => {
    setNewEmail('');
    setEmailOtpStep('input');
    setEmailOtpValues(['', '', '', '', '', '']);
    setEmailOtpError(null);
    setEmailOtpSubmitting(false);
    setEmailOtpTimer(60);
    setEmailOtpCanResend(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSendChangeEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailOtpError(null);
    if (!newEmail.trim()) {
      setEmailOtpError('Vui lòng nhập địa chỉ email mới.');
      return;
    }
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
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
      toast.success('Đổi địa chỉ email thành công!');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setEmailOtpError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setEmailOtpSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={handleClose}
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
              onClick={handleClose}
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
  );
};
