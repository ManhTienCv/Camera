import React from 'react';
import { Home, ShoppingBag, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Page } from '../types';
import { GlidingIndicator } from './ui/GlidingIndicator';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  page: Page;
  badge?: string;
  isExternal?: boolean;
}

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  className = '',
}) => {
  const { user } = useAuth();

  // Xác định ID của item đang active dựa trên currentPage và URL pathname
  const getActiveItemId = (): string => {
    if (currentPage.name === 'home') return 'home';
    if (currentPage.name === 'catalog') return 'catalog';
    if (currentPage.name === 'compare') return 'compare';
    if (currentPage.name === 'warranty') return 'warranty';
    if (currentPage.name === 'admin') return 'admin';
    return '';
  };

  const activeId = getActiveItemId();

  // Danh mục điều hướng chính - Tinh gọn chuẩn mực
  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      page: { name: 'home' },
    },
    {
      id: 'catalog',
      label: 'Sản phẩm',
      icon: ShoppingBag,
      page: { name: 'catalog' },
    },
  ];

  // Nếu người dùng có quyền admin, bổ sung menu Quản trị
  if (user?.role === 'admin') {
    navItems.push({
      id: 'admin',
      label: 'Quản trị',
      icon: Shield,
      page: { name: 'admin', tab: 'dashboard' },
      badge: 'Admin',
    });
  }


  return (
    <nav
      className={`relative inline-flex items-center p-1.5 rounded-full bg-cream-100/80 dark:bg-ink-900/80 backdrop-blur-md border border-cream-200/80 dark:border-ink-800/80 shadow-2xs ${className}`}
      role="navigation"
      aria-label="Thanh điều hướng chính"
    >
      {navItems.map((item) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.page)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 ${
              isActive
                ? 'text-white'
                : 'text-ink-600 dark:text-cream-300 hover:text-ink-900 dark:hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* GLIDING ACTIVE PILL INDICATOR */}
            {isActive && (
              <GlidingIndicator
                layoutId="navbar-active-pill"
                className="inset-0 bg-accent-500 rounded-full shadow-xs"
              />
            )}

            {/* Icon */}
            <Icon
              size={17}
              className={`relative z-10 transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-ink-400 dark:text-cream-400'
              }`}
            />

            {/* Label */}
            <span className="relative z-10 tracking-tight">{item.label}</span>

            {/* Badge if available */}
            {item.badge && (
              <span
                className={`relative z-10 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border-accent-200 dark:border-accent-800'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
