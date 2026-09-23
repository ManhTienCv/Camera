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
  Users,
  MessageSquare,
  Ticket,
} from 'lucide-react';
import type { Page, User } from '../../types';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'vouchers' | 'reports' | 'users' | 'chat' | 'reviews' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onNavigate: (page: Page) => void;
  adminUser?: User | null;
  collapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  orderCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onNavigate,
  adminUser,
  collapsed: externalCollapsed,
  onToggleCollapse,
  orderCount = 0,
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

  const navItemsSection1 = [
    { id: 'dashboard' as AdminTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'products' as AdminTab, label: 'Sản phẩm', icon: Package },
    { id: 'categories' as AdminTab, label: 'Danh mục', icon: FolderTree },
    { id: 'orders' as AdminTab, label: 'Đơn hàng', icon: ShoppingCart, badge: orderCount > 0 ? orderCount : undefined },
    { id: 'vouchers' as AdminTab, label: 'Mã Giảm Giá', icon: Ticket },
  ];

  const navItemsSection2 = [
    { id: 'reports' as AdminTab, label: 'Báo cáo doanh thu', icon: BarChart3 },
    { id: 'users' as AdminTab, label: 'Người dùng', icon: Users },
    { id: 'chat' as AdminTab, label: 'Live Chat hỗ trợ', icon: MessageSquare },
  ];

  const navItemsSection3 = [
    { id: 'reviews' as AdminTab, label: 'Đánh giá & Phản hồi', icon: Star },
    { id: 'settings' as AdminTab, label: 'Cài đặt', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white text-ink-800 flex flex-col flex-shrink-0 border-r border-cream-200 h-screen sticky top-0 select-none transition-all duration-300 ease-in-out z-30 ${isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
    >
      {/* Top Header */}
      <div
        className={`flex items-center flex-shrink-0 h-16 border-b border-cream-200/80 transition-all ${isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
          }`}
      >
        {isCollapsed ? (
          <div className="relative group flex items-center justify-center">
            <button
              onClick={toggleCollapse}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-ink-700 hover:text-accent-600 hover:bg-cream-100 transition-all active:scale-95 cursor-pointer"
              aria-label="Mở thanh bên"
            >
              <PanelLeftOpen size={20} />
            </button>

            <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900 text-white text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
              Mở thanh bên
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden animate-fade-in">
              <div className="w-9 h-9 bg-accent-500 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
                C
              </div>
              <div className="truncate">
                <h1 className="font-display font-bold text-ink-900 text-sm leading-tight">CameraHub</h1>

              </div>
            </div>

            <div className="relative group">
              <button
                onClick={toggleCollapse}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-400 hover:text-ink-900 hover:bg-cream-100 transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Thu gọn thanh bên"
              >
                <PanelLeftClose size={18} />
              </button>

              <div className="absolute left-full ml-2 px-2.5 py-1 bg-ink-900 text-white text-[11px] font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-md z-50 transform -translate-y-1/2 top-1/2">
                Thu gọn thanh bên
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav List */}
      <div className={`flex-1 overflow-y-auto space-y-5 ${isCollapsed ? 'px-2 py-4' : 'px-3 py-4'}`}>
        {/* Section 1: Quản lý chung */}
        <div>
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-ink-400 tracking-wider uppercase px-3 mb-2 animate-fade-in">
              QUẢN LÝ CHUNG
            </p>
          )}

          <nav className="space-y-1">
            {navItemsSection1.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group flex items-center">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${isCollapsed
                      ? 'w-10 h-10 mx-auto justify-center'
                      : 'w-full gap-3 px-3.5 py-2.5'
                      } ${isActive
                        ? 'bg-accent-500 text-white font-bold shadow-xs'
                        : 'text-ink-700 hover:bg-cream-100 hover:text-ink-900'
                      }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors ${isActive
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

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900 text-white text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Báo cáo & CSKH */}
        <div>
          {!isCollapsed ? (
            <p className="text-[10px] font-bold text-ink-400 tracking-wider uppercase px-3 mb-2 animate-fade-in">
              BÁO CÁO & CSKH
            </p>
          ) : (
            <div className="w-8 h-[1px] bg-cream-200 mx-auto my-2" />
          )}

          <nav className="space-y-1">
            {navItemsSection2.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group flex items-center">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${isCollapsed
                      ? 'w-10 h-10 mx-auto justify-center'
                      : 'w-full gap-3 px-3.5 py-2.5'
                      } ${isActive
                        ? 'bg-accent-500 text-white font-bold shadow-xs'
                        : 'text-ink-700 hover:bg-cream-100 hover:text-ink-900'
                      }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900 text-white text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Section 3: Hệ thống */}
        <div>
          {!isCollapsed ? (
            <p className="text-[10px] font-bold text-ink-400 tracking-wider uppercase px-3 mb-2 animate-fade-in">
              HỆ THỐNG
            </p>
          ) : (
            <div className="w-8 h-[1px] bg-cream-200 mx-auto my-2" />
          )}

          <nav className="space-y-1">
            {navItemsSection3.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group flex items-center">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${isCollapsed
                      ? 'w-10 h-10 mx-auto justify-center'
                      : 'w-full gap-3 px-3.5 py-2.5'
                      } ${isActive
                        ? 'bg-accent-500 text-white font-bold shadow-xs'
                        : 'text-ink-700 hover:bg-cream-100 hover:text-ink-900'
                      }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900 text-white text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User profile at bottom */}
      <div
        className={`p-3 border-t border-cream-200 flex flex-shrink-0 bg-cream-50/70 transition-all ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between px-3.5'
          }`}
      >
        <div className="relative group flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer">
            {adminUser?.fullName?.charAt(0) || 'A'}
          </div>
          {!isCollapsed && (
            <div className="truncate animate-fade-in">
              <p className="text-xs font-bold text-ink-900 truncate">{adminUser?.fullName || 'Admin'}</p>
              <p className="text-[10px] text-ink-400 truncate">{adminUser?.email || 'admin@camerahub.vn'}</p>
            </div>
          )}

          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900 text-white text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
              {adminUser?.fullName || 'Admin'} ({adminUser?.email || 'admin@camerahub.vn'})
            </div>
          )}
        </div>

        <div className="relative group">
          <button
            onClick={() => onNavigate({ name: 'home' })}
            className={`text-ink-400 hover:text-ink-900 rounded-xl hover:bg-cream-200/60 transition-colors flex items-center justify-center cursor-pointer ${isCollapsed ? 'w-8 h-8' : 'p-1.5'
              }`}
            aria-label="Quay về trang cửa hàng"
          >
            <LogOut size={16} />
          </button>

          <div className="absolute left-full ml-2 px-2.5 py-1 bg-ink-900 text-white text-[11px] font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-md z-50 transform -translate-y-1/2 top-1/2">
            Về trang chủ
          </div>
        </div>
      </div>
    </aside>
  );
};
