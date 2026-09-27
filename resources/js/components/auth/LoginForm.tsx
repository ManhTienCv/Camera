import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface LoginFormProps {
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  onError: (msg: string) => void;
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  loginEmail,
  setLoginEmail,
  onError,
  onForgotPassword,
  onSwitchToRegister,
}) => {
  const { login, loginWithGoogle } = useAuth();
  const [loginPassword, setLoginPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');
    setSubmitting(true);

    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      onError(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full p-5 sm:p-7 flex flex-col justify-center space-y-3.5">
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
              onClick={onForgotPassword}
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
          onClick={onSwitchToRegister}
          className="font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 hover:underline cursor-pointer"
        >
          Tạo tài khoản mới
        </button>
      </div>
    </div>
  );
};
