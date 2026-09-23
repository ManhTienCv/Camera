import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  onboardingData: { token: string; user: User } | null;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<{ token: string; user: User }>;
  register: (email: string, pass: string, fullName: string, phone?: string) => Promise<void>;
  registerWithOtp: (email: string, pass: string, fullName: string, phone: string | undefined, otp: string) => Promise<void>;
  setAuthenticatedUser: (token: string, user: User) => void;
  completeOnboarding: (fullName: string, phone: string) => Promise<void>;
  cancelOnboarding: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginWithGoogle: () => void;
  demoGoogleLogin: (isNew?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously restore user from localStorage for instant 0ms auth on page reload
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('camera_auth_user');
      const token = localStorage.getItem('camera_auth_token');
      if (token && savedUser) {
        const parsed = JSON.parse(savedUser);
        // Tách biệt phiên đăng nhập: Nếu user trong client session là Admin,
        // di chuyển sang admin storage và giải phóng phiên client!
        if (parsed.role === 'admin') {
          if (!localStorage.getItem('camera_admin_token')) {
            localStorage.setItem('camera_admin_token', token);
            localStorage.setItem('camera_admin_user', savedUser);
          }
          localStorage.removeItem('camera_auth_token');
          localStorage.removeItem('camera_auth_user');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return !localStorage.getItem('camera_auth_user');
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [onboardingData, setOnboardingData] = useState<{ token: string; user: User } | null>(null);

  const refreshUser = async () => {
    const token = localStorage.getItem('camera_auth_token');
    if (!token) {
      setUser(null);
      localStorage.removeItem('camera_auth_user');
      setLoading(false);
      return;
    }

    try {
      const data = await api.getProfile();
      // Nếu API trả về tài khoản Admin, tách biệt khỏi client
      if (data.role === 'admin') {
        if (!localStorage.getItem('camera_admin_token')) {
          localStorage.setItem('camera_admin_token', token);
          localStorage.setItem('camera_admin_user', JSON.stringify(data));
        }
        localStorage.removeItem('camera_auth_token');
        localStorage.removeItem('camera_auth_user');
        setUser(null);
      } else {
        setUser(data);
        localStorage.setItem('camera_auth_user', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Auth token expired or invalid:', err);
      localStorage.removeItem('camera_auth_token');
      localStorage.removeItem('camera_auth_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check for Google OAuth callback parameters in URL (Fallback for non-popup)
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get('google_token');
    const authError = urlParams.get('auth_error');
    const isNew = urlParams.get('is_new') === '1';

    if (googleToken) {
      localStorage.setItem('camera_auth_token', googleToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      if (isNew) {
        // Fetch profile and trigger onboarding
        api.getProfile().then((userData) => {
          setOnboardingData({ token: googleToken, user: userData });
          setIsAuthModalOpen(true);
        }).catch(() => refreshUser());
      } else {
        refreshUser();
      }
      return;
    }

    if (authError) {
      window.history.replaceState({}, document.title, window.location.pathname);
      console.warn('Google Auth Error:', authError);
    }

    // 2. Listen for messages from centered OAuth popup window (500x650)
    const handleAuthMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token, user: incomingUser, isNewUser } = e.data;
        if (token && incomingUser) {
          if (isNewUser) {
            localStorage.setItem('camera_auth_token', token);
            setOnboardingData({ token, user: incomingUser });
            setIsAuthModalOpen(true);
          } else {
            setAuthenticatedUser(token, incomingUser);
          }
        }
      } else if (e.data.type === 'GOOGLE_AUTH_ERROR') {
        console.warn('Google Auth Popup Error:', e.data.message);
      }
    };

    const handleUserSessionExpired = () => {
      setUser(null);
      localStorage.removeItem('camera_auth_token');
      localStorage.removeItem('camera_auth_user');
    };

    window.addEventListener('message', handleAuthMessage);
    window.addEventListener('camera_user_session_expired', handleUserSessionExpired);
    refreshUser();

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      window.removeEventListener('camera_user_session_expired', handleUserSessionExpired);
    };
  }, []);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const setAuthenticatedUser = (token: string, userData: User) => {
    localStorage.setItem('camera_auth_token', token);
    localStorage.setItem('camera_auth_user', JSON.stringify(userData));
    setUser(userData);
    setOnboardingData(null);
    closeAuthModal();
  };

  const completeOnboarding = async (fullName: string, phone: string) => {
    if (!onboardingData) return;
    try {
      const res = await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      setAuthenticatedUser(onboardingData.token, res.user);
    } catch {
      setAuthenticatedUser(onboardingData.token, {
        ...onboardingData.user,
        fullName: fullName.trim() || onboardingData.user.fullName,
        phone: phone.trim() || onboardingData.user.phone,
      });
    }
  };

  const cancelOnboarding = () => {
    setOnboardingData(null);
    localStorage.removeItem('camera_auth_token');
    closeAuthModal();
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (res.user && res.user.role === 'admin') {
      localStorage.setItem('camera_admin_token', res.token);
      localStorage.setItem('camera_admin_user', JSON.stringify(res.user));
      closeAuthModal();
      throw new Error('Tài khoản này là Quản trị viên (Admin). Vui lòng đăng nhập tại Kênh Quản Trị (/admin).');
    }
    setAuthenticatedUser(res.token, res.user);
    return res;
  };

  const register = async (email: string, pass: string, fullName: string, phone?: string) => {
    const res = await api.register({ email, password: pass, fullName, phone });
    setAuthenticatedUser(res.token, res.user);
  };

  const registerWithOtp = async (
    email: string,
    pass: string,
    fullName: string,
    phone: string | undefined,
    otp: string
  ) => {
    const res = await api.registerWithOtp({
      email,
      password: pass,
      fullName,
      phone,
      otp,
    });
    setAuthenticatedUser(res.token, res.user);
  };

  // Helper to open centered 500x650 popup window
  const openOAuthPopup = (url: string) => {
    const width = 500;
    const height = 650;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
      url,
      'GoogleLogin',
      `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0,location=1`
    );
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Fallback if popup blocker intercepted
      window.location.href = url;
    }
  };

  const loginWithGoogle = () => {
    openOAuthPopup('/api/v1/auth/google/redirect');
  };

  const demoGoogleLogin = (isNew: boolean = false) => {
    openOAuthPopup(`/api/v1/auth/google/demo${isNew ? '?new=1' : ''}`);
  };

  const logout = () => {
    localStorage.removeItem('camera_auth_token');
    localStorage.removeItem('camera_auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        authModalTab,
        onboardingData,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        registerWithOtp,
        setAuthenticatedUser,
        completeOnboarding,
        cancelOnboarding,
        logout,
        refreshUser,
        loginWithGoogle,
        demoGoogleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
