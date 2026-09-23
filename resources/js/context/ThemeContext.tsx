import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  clientTheme: Theme;
  adminTheme: Theme;
  activeTheme: Theme;
  isDark: boolean;
  setClientTheme: (theme: Theme) => void;
  toggleClientTheme: () => void;
  setAdminTheme: (theme: Theme) => void;
  toggleAdminTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Khách hàng: Mặc định luôn là 'light' (ưu tiên nền sáng trước theo yêu cầu)
  const [clientTheme, setClientThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('camerahub_client_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Quản trị viên: Mặc định là 'light', có thể chuyển trực tiếp tại Header
  const [adminTheme, setAdminThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('camerahub_admin_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [isAdminPage, setIsAdminPage] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin');
  });

  // Lắng nghe thay đổi URL để áp dụng đúng theme của phân hệ
  useEffect(() => {
    const checkRoute = () => {
      setIsAdminPage(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('camerahub_route_change', checkRoute);
    const interval = setInterval(checkRoute, 250);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('camerahub_route_change', checkRoute);
      clearInterval(interval);
    };
  }, []);

  const activeTheme = isAdminPage ? adminTheme : clientTheme;
  const isDark = activeTheme === 'dark';

  // Đồng bộ class .dark vào document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const setClientTheme = useCallback((theme: Theme) => {
    setClientThemeState(theme);
    try {
      localStorage.setItem('camerahub_client_theme', theme);
    } catch (_) {}
  }, []);

  const toggleClientTheme = useCallback(() => {
    setClientThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('camerahub_client_theme', next);
      } catch (_) {}
      return next;
    });
  }, []);

  const setAdminTheme = useCallback((theme: Theme) => {
    setAdminThemeState(theme);
    try {
      localStorage.setItem('camerahub_admin_theme', theme);
    } catch (_) {}
  }, []);

  const toggleAdminTheme = useCallback(() => {
    setAdminThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('camerahub_admin_theme', next);
      } catch (_) {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        clientTheme,
        adminTheme,
        activeTheme,
        isDark,
        setClientTheme,
        toggleClientTheme,
        setAdminTheme,
        toggleAdminTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
