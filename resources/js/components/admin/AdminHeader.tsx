import React from 'react';
import { ExternalLink, LogOut, ShieldCheck } from 'lucide-react';
import type { Page } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AdminHeaderProps {
  onNavigate: (page: Page) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-cream-200 px-6 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-accent-50 border border-accent-200/80 text-accent-600 flex items-center justify-center shadow-2xs">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h2 className="text-base font-display font-bold text-ink-900 leading-tight">CameraHub Control Panel</h2>
          <p className="text-[11px] text-ink-400 font-medium">Hệ thống quản lý bán hàng & thiết bị nhiếp ảnh</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Admin User Info Pill */}
        {user && (
          <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 bg-cream-50 border border-cream-200 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-accent-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user.fullName?.charAt(0) || 'A'
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-ink-900 leading-none">{user.fullName}</p>
              <p className="text-[10px] text-accent-700 font-semibold mt-0.5">Quản Trị Viên (Admin)</p>
            </div>
          </div>
        )}

        <button
          onClick={() => onNavigate({ name: 'home' })}
          className="flex items-center gap-1.5 text-xs font-bold text-ink-700 hover:text-accent-600 border border-cream-300 hover:border-accent-400 px-3.5 py-2 rounded-2xl bg-white hover:bg-cream-50 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <ExternalLink size={14} />
          <span>Về Cửa Hàng</span>
        </button>

        {user && (
          <button
            onClick={() => {
              logout();
              onNavigate({ name: 'home' });
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 hover:bg-rose-50 px-3.5 py-2 rounded-2xl transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Đăng xuất khỏi trang quản trị"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        )}
      </div>
    </header>
  );
};
