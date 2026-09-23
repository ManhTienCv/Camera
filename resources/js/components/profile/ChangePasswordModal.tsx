import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { User } from '../../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const userHasPass = user.hasPassword !== false;

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
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setPasswordError(err.message || 'Lỗi khi thay đổi mật khẩu.');
    } finally {
      setSavingPassword(false);
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  onClick={handleClose}
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
  );
};
