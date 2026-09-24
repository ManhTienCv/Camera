import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Settings,
  Star,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  CircleDollarSign,
  Users,
  MessageSquare,
  Ticket,
} from 'lucide-react';
import type { Page, User } from '../../types';
import { GlidingIndicator } from '../ui/GlidingIndicator';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'vouchers' | 'reports' | 'finance' | 'users' | 'chat' | 'reviews' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onNavigate: (page: Page) => void;
  adminUser?: User | null;
  collapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  orderCount?: number;
  onLogout?: () => void;
}

interface AdminNavItem {
  id: AdminTab;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onNavigate: _onNavigate,
  adminUser,
  collapsed: externalCollapsed,
  onToggleCollapse,
  orderCount = 0,
  onLogout,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    return saved === 'true';
  });

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setInternalCollapsed(nextState);
    localStorage.setItem('admin_sidebar_collapsed', String(nextState));
    if (onToggleCollapse) {
      onToggleCollapse(nextState);
    }
  };

  const navItemsSection1: AdminNavItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'products', label: 'Sản phẩm', icon: Package },
    { id: 'categories', label: 'Danh mục', icon: FolderTree },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart, badge: orderCount > 0 ? orderCount : undefined },
    { id: 'vouchers', label: 'Mã Giảm Giá', icon: Ticket },
  ];

  const navItemsSection2: AdminNavItem[] = [
    { id: 'reports', label: 'Báo cáo doanh thu', icon: BarChart3 },
    { id: 'finance', label: 'Thống kê tài chính', icon: CircleDollarSign },
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'chat', label: 'Live Chat hỗ trợ', icon: MessageSquare },
  ];

  const navItemsSection3: AdminNavItem[] = [
    { id: 'reviews', label: 'Đánh giá & Phản hồi', icon: Star },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const renderNavItem = (item: AdminNavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <div key={item.id} className="relative group flex items-center">
        <button
          onClick={() => setActiveTab(item.id)}
          title={isCollapsed ? item.label : undefined}
          className={`relative flex items-center rounded-2xl text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none outline-none ${
            isCollapsed
              ? 'w-10 h-10 mx-auto justify-center'
              : 'w-full gap-3 px-3.5 py-2.5'
          } ${
            isActive
              ? 'text-white font-bold'
              : 'text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          {isActive && (
            <GlidingIndicator
              layoutId="admin-sidebar-active-pill"
              className="inset-0 bg-accent-500 rounded-2xl shadow-xs"
            />
          )}
          <Icon size={18} className="shrink-0 relative z-10" />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0 relative z-10">
              <span className="truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors ${
                    isActive
                      ? 'bg-white text-accent-700'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          )}
        </button>
      </div>
    );
  };

  return (
    <aside
      className={`bg-white dark:bg-ink-900 text-ink-800 dark:text-cream-100 flex flex-col flex-shrink-0 border-r border-cream-200 dark:border-ink-800 h-screen sticky top-0 select-none overflow-x-hidden transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Top Header */}
      <div
        className={`flex items-center flex-shrink-0 h-16 border-b border-cream-200/80 dark:border-ink-800 transition-all ${
          isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
        }`}
      >
        {isCollapsed ? (
          <div className="relative group flex items-center justify-center">
            <button
              onClick={toggleCollapse}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-ink-700 dark:text-cream-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-cream-100 dark:hover:bg-ink-800 transition-all active:scale-95 cursor-pointer"
              aria-label="Mở thanh bên"
              title="Mở thanh bên"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden animate-fade-in">
              <div className="w-9 h-9 bg-accent-500 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
                C
              </div>
              <div className="truncate">
                <h1 className="font-display font-bold text-ink-900 dark:text-cream-50 text-sm leading-tight">
                  CameraHub
                </h1>
                <p className="text-[10px] text-ink-400 dark:text-ink-500 font-medium">Quản trị hệ thống</p>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={toggleCollapse}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-400 hover:text-ink-900 dark:hover:text-cream-100 hover:bg-cream-100 dark:hover:bg-ink-800 transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Thu gọn thanh bên"
                title="Thu gọn thanh bên"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Nav List */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-none space-y-5 ${isCollapsed ? 'px-2 py-4' : 'px-3 py-4'}`}>
        {/* Section 1: Quản lý chung */}
        <div>
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-ink-400 dark:text-ink-500 tracking-wider uppercase px-3 mb-2 animate-fade-in">
              QUẢN LÝ CHUNG
            </p>
          )}

          <nav className="space-y-1" role="tablist" aria-label="Quản lý chung">
            {navItemsSection1.map(renderNavItem)}
          </nav>
        </div>

        {/* Section 2: Báo cáo & CSKH */}
        <div>
          {!isCollapsed ? (
            <p className="text-[10px] font-bold text-ink-400 dark:text-ink-500 tracking-wider uppercase px-3 mb-2 animate-fade-in">
              BÁO CÁO & CSKH
            </p>
          ) : (
            <div className="w-8 h-[1px] bg-cream-200 dark:bg-ink-800 mx-auto my-2" />
          )}
          <nav className="space-y-1" role="tablist" aria-label="Báo cáo và chăm sóc khách hàng">
            {navItemsSection2.map(renderNavItem)}
          </nav>
        </div>

        {/* Section 3: Hệ thống */}
        <div>
          {!isCollapsed ? (
            <p className="text-[10px] font-bold text-ink-400 dark:text-ink-500 tracking-wider uppercase px-3 mb-2 animate-fade-in">
              HỆ THỐNG
            </p>
          ) : (
            <div className="w-8 h-[1px] bg-cream-200 dark:bg-ink-800 mx-auto my-2" />
          )}
          <nav className="space-y-1" role="tablist" aria-label="Cài đặt hệ thống">
            {navItemsSection3.map(renderNavItem)}
          </nav>
        </div>
      </div>

      {/* User profile at bottom (Chuẩn theo Ảnh 2: Avatar A xanh + Chức vụ + Nút Đăng xuất riêng) */}
      {!isCollapsed ? (
        <div className="p-3.5 border-t border-cream-200 dark:border-ink-800 flex flex-col flex-shrink-0 bg-cream-50/70 dark:bg-ink-950/60 gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none">
              {adminUser?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="truncate animate-fade-in flex-1 min-w-0">
              <p className="text-sm font-bold text-ink-900 dark:text-cream-50 truncate leading-tight">
                {adminUser?.fullName || 'Admin'}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                Tổng quản trị hệ thống
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700 hover:border-rose-300 dark:hover:border-rose-600 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 text-ink-800 dark:text-cream-100 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-2xs active:scale-98"
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 border-t border-cream-200 dark:border-ink-800 flex flex-col items-center gap-2.5 flex-shrink-0 bg-cream-50/70 dark:bg-ink-950/60">
          <div
            className="w-9 h-9 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0 cursor-pointer"
            title={`${adminUser?.fullName || 'Admin'} - Tổng quản trị hệ thống`}
          >
            {adminUser?.fullName?.charAt(0) || 'A'}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="w-8 h-8 flex items-center justify-center text-ink-600 dark:text-cream-200 hover:text-rose-600 dark:hover:text-rose-400 border border-cream-200 dark:border-ink-700 hover:border-rose-300 bg-white dark:bg-ink-800 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
