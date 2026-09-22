import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<{ token: string; user: User }>;
  register: (email: string, pass: string, fullName: string, phone?: string) => Promise<void>;
  registerWithOtp: (email: string, pass: string, fullName: string, phone: string | undefined, otp: string) => Promise<void>;
  setAuthenticatedUser: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginWithGoogle: () => void;
  demoGoogleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously restore user from localStorage for instant 0ms auth on page reload
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('camera_auth_user');
      const token = localStorage.getItem('camera_auth_token');
      if (token && savedUser) {
        return JSON.parse(savedUser);
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
      setUser(data);
      localStorage.setItem('camera_auth_user', JSON.stringify(data));
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
    // Check for Google OAuth callback parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get('google_token');
    const authError = urlParams.get('auth_error');

    if (googleToken) {
      localStorage.setItem('camera_auth_token', googleToken);
      // Clean query parameter from URL without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
      refreshUser();
      return;
    }

    if (authError) {
      window.history.replaceState({}, document.title, window.location.pathname);
      console.warn('Google Auth Error:', authError);
    }

    refreshUser();
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
    closeAuthModal();
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
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

  const loginWithGoogle = () => {
    window.location.href = '/api/v1/auth/google/redirect';
  };

  const demoGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google/demo';
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
        openAuthModal,
        closeAuthModal,
        login,
        register,
        registerWithOtp,
        setAuthenticatedUser,
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
