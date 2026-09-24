import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ExternalLink,
  Moon,
  Sun,
  Bell,
  Calendar,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Package,
  AlertTriangle,
  Star,
  Info,
  ArrowRight,
  X,
} from 'lucide-react';
import type { Page, User, Order, Product } from '../../types';
import type { AdminTab } from './AdminSidebar';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../lib/utils';
import { GlidingIndicator } from '../ui/GlidingIndicator';

export interface AdminNotification {
  id: string;
  type: 'order' | 'stock' | 'review' | 'system';
  title: string;
  message: string;
  time: string;
  timestamp: number;
  isRead: boolean;
  targetTab?: AdminTab;
}

interface AdminHeaderProps {
  onNavigate: (page: Page) => void;
  adminUser?: User | null;
  onLogout?: () => void;
  setActiveTab?: (tab: AdminTab) => void;
  orders?: Order[];
  products?: Product[];
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onNavigate,
  setActiveTab,
  orders = [],
  products = [],
}) => {
  const { adminTheme, toggleAdminTheme } = useTheme();
  const isDark = adminTheme === 'dark';

  // Live real-time clock updating every second
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

  // --- Notification Center State & Logic ---
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const notifRef = useRef<HTMLDivElement>(null);

  // Stored read & dismissed notification IDs in localStorage
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('camera_admin_notifs_read');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('camera_admin_notifs_dismissed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveReadIds = (ids: string[]) => {
    setReadNotifIds(ids);
    try {
      localStorage.setItem('camera_admin_notifs_read', JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to save read notification IDs', e);
    }
  };

  const saveDismissedIds = (ids: string[]) => {
    setDismissedNotifIds(ids);
    try {
      localStorage.setItem('camera_admin_notifs_dismissed', JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to save dismissed notification IDs', e);
    }
  };

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    if (!isNotifOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotifOpen]);

  const getRelativeTime = (timestamp: number) => {
    const diffMs = Math.max(0, Date.now() - timestamp);
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  // Generate dynamic notification list from real orders & products + rich fallback defaults
  const allNotifications = useMemo<AdminNotification[]>(() => {
    const list: AdminNotification[] = [];

    // 1. Pending/Processing orders from real data
    if (orders && orders.length > 0) {
      const activeOrders = orders.filter(
        (o) => o.status === 'pending' || o.status === 'processing'
      );
      activeOrders.slice(0, 4).forEach((o) => {
        const orderIdCode = o.order_code || (o.id ? o.id.slice(-6).toUpperCase() : 'NEW');
        const ts = o.created_at ? new Date(o.created_at).getTime() : Date.now() - 10 * 60 * 1000;
        list.push({
          id: `order-${o.id}`,
          type: 'order',
          title: `Đơn hàng #${orderIdCode} cần xử lý`,
          message: `${o.customer_name} đã đặt đơn hàng trị giá ${formatCurrency(o.total_amount)}`,
          time: getRelativeTime(ts),
          timestamp: ts,
          isRead: readNotifIds.includes(`order-${o.id}`),
          targetTab: 'orders',
        });
      });
    }

    // 2. Low stock warnings from real products
    if (products && products.length > 0) {
      const lowStock = products.filter((p) => (p.stock ?? 0) <= 5);
      lowStock.slice(0, 3).forEach((p, idx) => {
        const ts = Date.now() - (idx + 1) * 35 * 60 * 1000;
        list.push({
          id: `stock-${p.id}`,
          type: 'stock',
          title: `Cảnh báo tồn kho thấp`,
          message: `${p.name} hiện chỉ còn ${p.stock} chiếc trong kho!`,
          time: getRelativeTime(ts),
          timestamp: ts,
          isRead: readNotifIds.includes(`stock-${p.id}`),
          targetTab: 'products',
        });
      });
    }

    // 3. Realistic default alerts to ensure the admin experience is rich & functional out-of-the-box
    const defaultAlerts: AdminNotification[] = [
      {
        id: 'def-order-1',
        type: 'order',
        title: 'Đơn hàng mới #CH-9085',
        message: 'Khách hàng Trần Đình Phong vừa đặt máy Sony FX3 Cinema Line (89.900.000₫)',
        time: '10 phút trước',
        timestamp: Date.now() - 10 * 60 * 1000,
        isRead: readNotifIds.includes('def-order-1'),
        targetTab: 'orders',
      },
      {
        id: 'def-stock-1',
        type: 'stock',
        title: 'Cảnh báo sắp hết hàng',
        message: 'Canon EOS R5 Mark II hiện chỉ còn 2 máy tại kho chính. Hãy chuẩn bị nhập hàng!',
        time: '35 phút trước',
        timestamp: Date.now() - 35 * 60 * 1000,
        isRead: readNotifIds.includes('def-stock-1'),
        targetTab: 'products',
      },
      {
        id: 'def-review-1',
        type: 'review',
        title: 'Đánh giá 5 sao mới',
        message: 'Khách hàng Hoàng Long vừa đánh giá 5 sao cho sản phẩm Fujifilm X-T5.',
        time: '2 giờ trước',
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        isRead: readNotifIds.includes('def-review-1'),
        targetTab: 'reviews',
      },
      {
        id: 'def-sys-1',
        type: 'system',
        title: 'Hệ thống vận hành tối ưu',
        message: 'Bản sao lưu dữ liệu máy chủ và chứng thực thanh toán đã hoàn thành lúc 04:00 AM.',
        time: 'Hôm nay',
        timestamp: Date.now() - 6 * 60 * 60 * 1000,
        isRead: readNotifIds.includes('def-sys-1'),
        targetTab: 'dashboard',
      },
    ];

    // Combine & avoid duplicated IDs
    defaultAlerts.forEach((item) => {
      if (!list.some((existing) => existing.id === item.id)) {
        list.push(item);
      }
    });

    // Filter out dismissed notifications & sort by timestamp descending
    return list
      .filter((item) => !dismissedNotifIds.includes(item.id))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, products, readNotifIds, dismissedNotifIds]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.isRead).length;
  }, [allNotifications]);

  const displayedNotifications = useMemo(() => {
    if (notifFilter === 'unread') {
      return allNotifications.filter((n) => !n.isRead);
    }
    return allNotifications;
  }, [allNotifications, notifFilter]);

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = Array.from(new Set([...readNotifIds, ...allNotifications.map((n) => n.id)]));
    saveReadIds(allIds);
  };

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!readNotifIds.includes(id)) {
      saveReadIds([...readNotifIds, id]);
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveDismissedIds([...dismissedNotifIds, id]);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIds = allNotifications.map((n) => n.id);
    saveDismissedIds(Array.from(new Set([...dismissedNotifIds, ...currentIds])));
  };

  const handleNotificationClick = (item: AdminNotification) => {
    handleMarkAsRead(item.id);
    if (item.targetTab && setActiveTab) {
      setActiveTab(item.targetTab);
    }
    setIsNotifOpen(false);
  };

  const renderTypeIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'order':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Package size={15} />
          </div>
        );
      case 'stock':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case 'review':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Star size={15} />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0">
            <Info size={15} />
          </div>
        );
    }
  };

  return (
    <header className="bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border-b border-cream-200 dark:border-ink-800 px-5 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs flex-shrink-0 transition-colors duration-200">
      {/* Left: Clean Brand Badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-accent-50 dark:bg-accent-950/50 border border-accent-200/80 dark:border-accent-800/80 text-accent-600 dark:text-accent-400 flex items-center justify-center shadow-2xs">
          <ShieldCheck size={18} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-display font-bold text-ink-900 dark:text-cream-50 leading-none">
            CameraHub Admin
          </span>
        </div>
      </div>

      {/* Right Controls: Moon Toggle, Live Clock Pill, Bell, Store Link */}
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

        {/* 2. Badge Đồng Hồ Thời Gian Thực */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 text-xs font-semibold shadow-2xs select-none">
          <Calendar size={14} className="text-ink-400 dark:text-ink-400 shrink-0" />
          <span className="tracking-wide tabular-nums">{formatDateTime(currentTime)}</span>
        </div>

        {/* 3. Nút Chuông Thông Báo với Dropdown Popover Tương Tác */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className={`relative w-9 h-9 rounded-full border transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center ${
              isNotifOpen
                ? 'border-accent-400 dark:border-accent-500 bg-cream-50 dark:bg-ink-750 text-accent-600 dark:text-accent-400'
                : 'border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 hover:text-accent-600 dark:hover:text-accent-400 hover:border-accent-300 dark:hover:border-accent-600'
            }`}
            title="Thông báo hệ thống"
            aria-label="Thông báo hệ thống"
            aria-expanded={isNotifOpen}
            aria-haspopup="true"
          >
            <Bell size={17} />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-ink-900 shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="sr-only">Không có thông báo mới</span>
            )}
          </button>

          {/* Notification Dropdown Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-[380px] max-w-[400px] bg-white dark:bg-ink-900 rounded-2xl border border-cream-200 dark:border-ink-800 shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Popover Header */}
              <div className="p-3.5 px-4 border-b border-cream-200 dark:border-ink-800 flex items-center justify-between bg-cream-50/60 dark:bg-ink-950/50">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-accent-600 dark:text-accent-400" />
                  <h3 className="text-sm font-bold text-ink-900 dark:text-cream-100">
                    Thông báo
                  </h3>
                  {unreadCount > 0 ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-950/80 text-accent-700 dark:text-accent-300 border border-accent-200/60 dark:border-accent-800/80">
                      {unreadCount} mới
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-ink-400 dark:text-cream-400">
                      Đã đọc hết
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      title="Đánh dấu tất cả đã đọc"
                    >
                      <CheckCheck size={14} />
                      <span className="hidden sm:inline">Đã đọc tất cả</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 rounded-lg text-ink-400 dark:text-cream-400 hover:text-ink-700 dark:hover:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors"
                    aria-label="Đóng thông báo"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b border-cream-200 dark:border-ink-800 px-4 pt-2.5 gap-5 text-xs bg-white dark:bg-ink-900" role="tablist" aria-label="Bộ lọc thông báo">
                <button
                  type="button"
                  role="tab"
                  aria-selected={notifFilter === 'all'}
                  onClick={() => setNotifFilter('all')}
                  className={`pb-2 -mb-px font-bold text-xs transition-colors duration-150 relative cursor-pointer select-none outline-none ${
                    notifFilter === 'all'
                      ? 'text-accent-600 dark:text-accent-400'
                      : 'text-ink-500 dark:text-cream-400 hover:text-ink-800 dark:hover:text-cream-200'
                  }`}
                >
                  <span className="relative z-10">Tất cả ({allNotifications.length})</span>
                  {notifFilter === 'all' && (
                    <GlidingIndicator
                      layoutId="admin-notif-tab-indicator"
                      className="left-0 right-0 bottom-0 h-0.5 bg-accent-600 dark:bg-accent-400 rounded-full"
                    />
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={notifFilter === 'unread'}
                  onClick={() => setNotifFilter('unread')}
                  className={`pb-2 -mb-px font-bold text-xs transition-colors duration-150 relative cursor-pointer select-none outline-none ${
                    notifFilter === 'unread'
                      ? 'text-accent-600 dark:text-accent-400'
                      : 'text-ink-500 dark:text-cream-400 hover:text-ink-800 dark:hover:text-cream-200'
                  }`}
                >
                  <span className="relative z-10">Chưa đọc ({unreadCount})</span>
                  {notifFilter === 'unread' && (
                    <GlidingIndicator
                      layoutId="admin-notif-tab-indicator"
                      className="left-0 right-0 bottom-0 h-0.5 bg-accent-600 dark:bg-accent-400 rounded-full"
                    />
                  )}
                </button>
              </div>

              {/* Notifications Scrollable List */}
              <div className="overflow-y-auto max-h-[350px] divide-y divide-cream-100 dark:divide-ink-800/50">
                {displayedNotifications.length > 0 ? (
                  displayedNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group p-3.5 px-4 flex items-start gap-3 transition-colors cursor-pointer relative select-none ${
                        notif.isRead
                          ? 'bg-white dark:bg-ink-900 hover:bg-cream-50/70 dark:hover:bg-ink-800/40 opacity-80 hover:opacity-100'
                          : 'bg-accent-50/30 dark:bg-accent-950/20 hover:bg-accent-50/60 dark:hover:bg-accent-950/40'
                      }`}
                    >
                      {/* Icon */}
                      {renderTypeIcon(notif.type)}

                      {/* Text content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <p
                            className={`text-xs truncate ${
                              notif.isRead
                                ? 'font-semibold text-ink-800 dark:text-cream-200'
                                : 'font-bold text-ink-950 dark:text-cream-50'
                            }`}
                          >
                            {notif.title}
                          </p>
                          <span className="text-[11px] text-ink-400 dark:text-cream-400 shrink-0 tabular-nums">
                            {notif.time}
                          </span>
                        </div>

                        <p className="text-xs text-ink-600 dark:text-cream-300 line-clamp-2 leading-relaxed mb-1.5">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between">
                          {notif.targetTab ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-600 dark:text-accent-400 hover:underline">
                              <span>Xem chi tiết</span>
                              <ArrowRight size={10} />
                            </span>
                          ) : (
                            <span />
                          )}

                          {/* Quick dismiss on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleDismiss(notif.id, e)}
                              className="p-1 rounded text-ink-400 dark:text-cream-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              title="Xóa thông báo này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-cream-100 dark:bg-ink-800 flex items-center justify-center text-ink-400 dark:text-cream-400 mb-3">
                      <Bell size={20} className="opacity-40" />
                    </div>
                    <p className="text-sm font-semibold text-ink-800 dark:text-cream-200">
                      {notifFilter === 'unread'
                        ? 'Không có thông báo chưa đọc'
                        : 'Không có thông báo nào'}
                    </p>
                    <p className="text-xs text-ink-400 dark:text-cream-400 mt-1 max-w-[220px]">
                      {notifFilter === 'unread'
                        ? 'Bạn đã xem hết tất cả thông báo hệ thống rồi nhé!'
                        : 'Khi có đơn hàng mới hoặc cảnh báo tồn kho, thông báo sẽ hiển thị tại đây.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Popover Footer */}
              <div className="p-2.5 px-4 border-t border-cream-200 dark:border-ink-800 bg-cream-50/50 dark:bg-ink-950/40 flex items-center justify-between text-xs">
                {setActiveTab && (
                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      setIsNotifOpen(false);
                    }}
                    className="text-ink-600 dark:text-cream-300 hover:text-accent-600 dark:hover:text-accent-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Xem danh sách đơn hàng</span>
                    <ArrowRight size={13} />
                  </button>
                )}
                {allNotifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-ink-400 dark:text-cream-400 hover:text-rose-500 dark:hover:text-rose-400 font-medium transition-colors ml-auto text-[11px] cursor-pointer"
                    title="Xóa tất cả thông báo"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

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

