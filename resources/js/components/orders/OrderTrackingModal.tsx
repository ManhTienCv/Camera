import React from 'react';
import { createPortal } from 'react-dom';
import { Phone, MapPin, X } from 'lucide-react';
import type { EnhancedOrder } from './types';

export interface OrderTrackingModalProps {
  order: EnhancedOrder | null;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const trackingCode = order.trackingCode.startsWith('#')
    ? order.trackingCode
    : `#${order.trackingCode}`;

  const recipientName = order.recipientName || 'Khách hàng';

  // Driver details tailored for GHN Express
  const driver = {
    name: 'Nguyễn Văn Tuấn',
    initial: 'N',
    role: 'Shipper phụ trách giao đơn',
    phone: '0912.345.678',
    plate: '29B1-889.21',
  };

  const isDelivered = order.status === 'delivered';

  const steps = isDelivered
    ? [
        {
          active: true,
          title: 'Kiện hàng đã giao thành công',
          time: '15:20 - Hôm nay',
          desc: `Khách hàng [${recipientName}] đã nhận thành công bưu phẩm nguyên vẹn từ Shipper [${driver.name}].`,
          location: order.shippingAddress || 'Địa chỉ nhận hàng của khách',
        },
        {
          active: false,
          title: 'Shipper đang trên đường giao đến bạn',
          time: '14:30 - Hôm nay',
          desc: `Shipper [${driver.name} - ${driver.phone}] đang giao hàng trong khu vực Hoàn Kiếm.`,
          location: 'Bưu cục phát hàng GHN Express',
        },
        {
          active: false,
          title: 'Kiện hàng đến Kho Trung Chuyển Phân Loại Hà Nội',
          time: '08:15 - Hôm nay',
          desc: 'Đã quét mã Barcode phân loại thành công. Đang xuất kho giao trạm phát.',
          location: 'Kho trung chuyển Tổng Hà Nội',
        },
        {
          active: false,
          title: 'Shipper đã lấy kiện hàng tại Kho Camera Hub',
          time: '18:00 - Hôm qua',
          desc: 'Đã nhận kiện hàng từ Cửa hàng Máy Ảnh Camera Hub, chuẩn bị vận chuyển liên tỉnh.',
          location: 'Kho hàng Camera Hub, Quận 7, TP.HCM',
        },
        {
          active: false,
          title: 'Tạo đơn hàng & Tiếp nhận yêu cầu vận chuyển',
          time: '14:00 - Hôm qua',
          desc: 'Hệ thống quản lý đã phát lệnh xuất kho.',
          location: 'Hệ thống quản lý đơn hàng Camera Hub',
        },
      ]
    : [
        {
          active: true,
          title: 'Shipper đang trên đường giao đến bạn',
          time: '14:30 - Hôm nay',
          desc: `Shipper [${driver.name} - ${driver.phone}] đang giao hàng trong khu vực Hoàn Kiếm.`,
          location: 'Bưu cục Hoàn Kiếm, Hà Nội',
        },
        {
          active: false,
          title: 'Kiện hàng đến Kho Trung Chuyển Phân Loại Hà Nội',
          time: '08:15 - Hôm nay',
          desc: 'Đã quét mã Barcode phân loại thành công. Đang xuất kho giao trạm phát.',
          location: 'Kho trung chuyển Tổng Hà Nội',
        },
        {
          active: false,
          title: 'Shipper đã lấy kiện hàng tại Kho Camera Hub',
          time: '18:00 - Hôm qua',
          desc: 'Đã nhận kiện hàng từ Cửa hàng Máy Ảnh Camera Hub, chuẩn bị vận chuyển liên tỉnh.',
          location: 'Kho hàng Camera Hub, Quận 7, TP.HCM',
        },
        {
          active: false,
          title: 'Tạo đơn hàng & Tiếp nhận yêu cầu vận chuyển',
          time: '14:00 - Hôm qua',
          desc: 'Hệ thống quản lý đã phát lệnh xuất kho.',
          location: 'Hệ thống quản lý đơn hàng Camera Hub',
        },
      ];

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-ink-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-cream-200 dark:border-ink-800 space-y-5 animate-scale-up cursor-default my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 shadow-2xs">
              GHN Express
            </span>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-ink-400 dark:text-ink-500 font-mono tracking-tight">
                {trackingCode}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-cream-100 dark:hover:bg-ink-800 flex items-center justify-center text-ink-400 hover:text-ink-700 dark:hover:text-cream-200 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-cream-50 tracking-tight">
              Theo Dõi Hành Trình Đơn Hàng
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              Đơn hàng <strong className="text-ink-800 dark:text-cream-200">{order.order_code}</strong> • Người nhận:{' '}
              <strong className="text-ink-800 dark:text-cream-200">{recipientName}</strong>
            </p>
          </div>
        </div>

        {/* Driver Card (Theme Dark Slate + Orange Brand Accent) */}
        <div className="bg-[#0F172A] rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3.5 border border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-bold text-base text-white shadow-sm shrink-0">
                {driver.initial}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm sm:text-base text-white truncate">{driver.name}</h4>
                <p className="text-[11px] text-slate-400 truncate">{driver.role}</p>
              </div>
            </div>

            <a
              href={`tel:${driver.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Phone size={13} className="fill-white" />
              <span>Gọi Tài Xế</span>
            </a>
          </div>

          <div className="border-t border-slate-800/90 pt-2.5 flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="text-slate-400 text-[11px]">SĐT: </span>
              <strong className="text-white font-mono font-bold">{driver.phone}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Biển số: </span>
              <strong className="text-white font-mono font-bold">{driver.plate}</strong>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs sm:text-sm text-ink-900 dark:text-cream-100">
            Chi tiết tiến trình bưu phẩm:
          </h4>

          <div className="space-y-4 pl-1">
            {steps.map((st, idx) => {
              const isLast = idx === steps.length - 1;
              return (
                <div key={idx} className="relative flex items-start gap-3.5 group">
                  {/* Vertical connecting line */}
                  {!isLast && (
                    <span className="absolute left-[11px] top-4 -bottom-4 w-[2px] bg-cream-200 dark:bg-ink-800" />
                  )}

                  {/* Dot status icon */}
                  {st.active ? (
                    <div className="w-6 h-6 rounded-full border-2 border-orange-500 bg-white dark:bg-ink-900 flex items-center justify-center shrink-0 z-10 shadow-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 flex items-center justify-center shrink-0 z-10">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-ink-700" />
                    </div>
                  )}

                  {/* Step content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h5
                        className={`text-xs font-bold leading-tight ${
                          st.active
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-ink-900 dark:text-cream-100'
                        }`}
                      >
                        {st.title}
                      </h5>
                      <span className="text-[11px] font-mono text-ink-400 dark:text-ink-500 shrink-0">
                        {st.time}
                      </span>
                    </div>

                    <p className="text-xs text-ink-600 dark:text-cream-300 leading-relaxed mt-1">
                      {st.desc}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-ink-400 dark:text-ink-500 mt-1">
                      <MapPin size={12} className="shrink-0 text-ink-400 dark:text-ink-500" />
                      <span className="truncate">{st.location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-cream-100 hover:bg-cream-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-xs font-bold text-ink-800 dark:text-cream-100 rounded-2xl border border-cream-200 dark:border-ink-700 transition-colors cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
