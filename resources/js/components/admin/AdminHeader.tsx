import React, { useState, useEffect } from 'react';
import { ExternalLink, Moon, Sun, Bell, Calendar, ShieldCheck } from 'lucide-react';
import type { Page, User } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface AdminHeaderProps {
  onNavigate: (page: Page) => void;
  adminUser?: User | null;
  onLogout?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onNavigate }) => {
  const { adminTheme, toggleAdminTheme } = useTheme();
  const isDark = adminTheme === 'dark';

  // Live real-time clock updating every second (Ảnh 1)
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${dayName}, ${day}/${month} - ${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border-b border-cream-200 dark:border-ink-800 px-5 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs flex-shrink-0 transition-colors duration-200">
      {/* Left: Clean Brand Badge (Đã lược bỏ phần text giới thiệu cồng kềnh theo Ảnh 3) */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-accent-50 dark:bg-accent-950/50 border border-accent-200/80 dark:border-accent-800/80 text-accent-600 dark:text-accent-400 flex items-center justify-center shadow-2xs">
          <ShieldCheck size={18} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-display font-bold text-ink-900 dark:text-cream-50 leading-none">
            CameraHub Admin
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream-100 dark:bg-ink-800 text-ink-600 dark:text-cream-300 border border-cream-200 dark:border-ink-700">
            v2.6
          </span>
        </div>
      </div>

      {/* Right Controls: Moon Toggle, Live Clock Pill, Bell, Store Link (Chuẩn theo Ảnh 1) */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* 1. Nút Chuyển Đổi Sáng / Tối (Moon / Sun) */}
        <button
          onClick={toggleAdminTheme}
          className="w-9 h-9 rounded-full border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 hover:text-accent-600 dark:hover:text-accent-400 hover:border-accent-300 dark:hover:border-accent-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
          title={isDark ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>

        {/* 2. Badge Đồng Hồ Thời Gian Thực (Ảnh 1) */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 text-xs font-semibold shadow-2xs select-none">
          <Calendar size={14} className="text-ink-400 dark:text-ink-400 shrink-0" />
          <span className="tracking-wide tabular-nums">{formatDateTime(currentTime)}</span>
        </div>

        {/* 3. Nút Chuông Thông Báo (Ảnh 1) */}
        <button
          className="relative w-9 h-9 rounded-full border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 hover:text-accent-600 dark:hover:text-accent-400 hover:border-accent-300 dark:hover:border-accent-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Thông báo hệ thống"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-500 ring-2 ring-white dark:ring-ink-800" />
        </button>

        {/* 4. Nút Về Cửa Hàng */}
        <button
          onClick={() => onNavigate({ name: 'home' })}
          className="flex items-center gap-1.5 text-xs font-bold text-ink-700 dark:text-cream-200 hover:text-accent-600 dark:hover:text-accent-400 border border-cream-200 dark:border-ink-700 hover:border-accent-400 px-3.5 py-2 rounded-2xl bg-white dark:bg-ink-800 hover:bg-cream-50 dark:hover:bg-ink-700 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Về Cửa Hàng</span>
        </button>
      </div>
    </header>
  );
};
