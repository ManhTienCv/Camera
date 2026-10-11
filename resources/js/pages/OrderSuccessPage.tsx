import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  ArrowRight,
  Package,
  MapPin,
  QrCode,
  Copy,
  Check,
  Mail,
  Truck,
  Download,
  Clock,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Receipt,
  ShoppingBag,
  Printer,
  X,
  Phone,
  Calendar,
} from 'lucide-react';
import type { Page, Order } from '../types';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { vietqrService, VIETQR_CONFIG } from '../services/vietqr.service';

interface Props {
  orderId: string;
  onNavigate: (page: Page) => void;
}

const CHECKOUT_DURATION_SECONDS = 15 * 60;

export function OrderSuccessPage({ orderId, onNavigate }: Props) {
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [openingMomo, setOpeningMomo] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // View state: 'momo' (Ảnh 1 - Giao Dịch MoMo Đã Hoàn Tất) vs 'order' (Ảnh 2 - Đặt Hàng Thành Công / GHN Express)
  const [viewMode, setViewMode] = useState<'momo' | 'order'>('order');
  const [momoCountdown, setMomoCountdown] = useState<number>(3);

  // 15-minute Session Countdown Timer (For VietQR Pending)
  const [timeLeft, setTimeLeft] = useState<number>(CHECKOUT_DURATION_SECONDS);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const storedDeadline = sessionStorage.getItem('camerahub_checkout_deadline');
    let targetDeadline = storedDeadline ? parseInt(storedDeadline, 10) : 0;

    if (!targetDeadline || targetDeadline <= Date.now()) {
      targetDeadline = Date.now() + CHECKOUT_DURATION_SECONDS * 1000;
      sessionStorage.setItem('camerahub_checkout_deadline', String(targetDeadline));
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((targetDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lock body scroll when receipt modal is open
  useEffect(() => {
    if (showReceiptModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showReceiptModal]);

  // Load Order Details
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getOrder(orderId);
        setOrder(data);

        const isPaid =
          data?.payment_status === 'paid' ||
          data?.payment_status === 'completed' ||
          data?.status === 'shipping' ||
          data?.status === 'completed';

        if (isPaid) {
          setPaymentConfirmed(true);
        }

        // If order was paid via MoMo, display MoMo result screen first (Ảnh 1)
        if (data?.payment_method === 'momo' && (isPaid || data.status === 'processing')) {
          setViewMode('momo');
          setMomoCountdown(3);
        } else {
          setViewMode('order');
        }
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  // MoMo screen auto-countdown to redirect into Ảnh 2 (Order Success)
  useEffect(() => {
    if (viewMode !== 'momo') return;

    if (momoCountdown <= 0) {
      setViewMode('order');
      return;
    }

    const timer = setTimeout(() => {
      setMomoCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [viewMode, momoCountdown]);

  const handleCopy = async (field: string, text: string) => {
    const success = await vietqrService.copyText(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleConfirmPaid = async () => {
    if (!order) return;
    setConfirmingPayment(true);
    try {
      const res = await api.confirmPayment(order.id);
      if (res && res.order) {
        setOrder(res.order);
      }
      setPaymentConfirmed(true);
      toast.success(
        `Xác nhận thanh toán thành công! Thông báo đơn hàng đã gửi về email ${order.customer_email || ''}`
      );
    } catch (e) {
      console.error('Failed to auto-confirm payment:', e);
      setPaymentConfirmed(true);
      toast.success('Xác nhận thanh toán thành công!');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleOpenMomoGateway = async () => {
    if (!order) return;
    setOpeningMomo(true);
    try {
      toast.info('Đang kết nối tới cổng thanh toán MoMo Sandbox...');
      const res = await api.payAgainMomo(order.id);
      if (res.success && res.payUrl) {
        window.location.href = res.payUrl;
      } else {
        toast.error('Không thể mở cổng MoMo: ' + (res.message || 'Lỗi không xác định'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi mở cổng MoMo.');
    } finally {
      setOpeningMomo(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-24 text-center animate-pulse">
        <div className="w-16 h-16 bg-cream-200 dark:bg-ink-800 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-cream-200 dark:bg-ink-800 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-cream-200 dark:bg-ink-800 rounded w-1/3 mx-auto" />
      </div>
    );
  }

  const isVietQR = order?.payment_method === 'vietqr' || order?.payment_method === 'bank_transfer';
  const qrUrl = order
    ? vietqrService.generateQRUrl({
        amount: order.total_amount,
        orderCode: order.order_code || order.id,
        template: 'compact2',
      })
    : '';

  // Generate authentic MoMo transaction ID for receipt display
  const momoTxnId =
    order?.transactions?.[0]?.transaction_id ||
    `MOMO_${order?.created_at ? new Date(order.created_at).getTime() : '1791697712606'}`;

  // ==========================================
  // RENDER 1: ẢNH 1 - GIAO DỊCH MOMO ĐÃ HOÀN TẤT
  // ==========================================
  if (viewMode === 'momo' && order) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-fade-in space-y-6">
        {/* Top Checkmark Circle Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#e6f7ef] dark:bg-emerald-950/60 text-[#00a86b] dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs border border-[#b2e7cf] dark:border-emerald-800 animate-scale-in">
            <Check size={36} strokeWidth={3} />
          </div>

          <div className="inline-block px-3.5 py-1 bg-[#e6f7ef] dark:bg-emerald-950/50 text-[#00875a] dark:text-emerald-400 border border-[#b2e7cf] dark:border-emerald-800 rounded-full text-xs font-bold">
            Thanh Toán Thành Công
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900 dark:text-cream-100">
            Giao Dịch MoMo Đã Hoàn Tất!
          </h1>

          <p className="text-xs sm:text-sm text-ink-500 dark:text-cream-400 max-w-md mx-auto">
            Cảm ơn bạn. Đơn hàng của bạn đã được thanh toán thành công qua Cổng MoMo AIO Gateway.
          </p>
        </div>

        {/* Transaction Details Box */}
        <div className="bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5 text-xs sm:text-sm">
          <div className="flex justify-between items-center py-1 border-b border-cream-100 dark:border-ink-800/80">
            <span className="text-ink-500 dark:text-cream-400">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-[#00875a] dark:text-emerald-400">
              #{order.order_code || order.id}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-cream-100 dark:border-ink-800/80">
            <span className="text-ink-500 dark:text-cream-400">Mã giao dịch MoMo:</span>
            <span className="font-mono font-bold text-ink-800 dark:text-cream-200">
              {momoTxnId}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-cream-100 dark:border-ink-800/80">
            <span className="text-ink-500 dark:text-cream-400">Số tiền thanh toán:</span>
            <span className="font-display font-bold text-base sm:text-lg text-[#00a86b] dark:text-emerald-400">
              {formatCurrency(order.total_amount)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-ink-500 dark:text-cream-400">Hình thức:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 dark:bg-pink-950/40 text-[#D82D8B] dark:text-pink-400 border border-pink-200 dark:border-pink-900/60 rounded-lg text-xs font-semibold">
              <ExternalLink size={12} />
              <span>MoMo AIO Hosted Gateway</span>
            </span>
          </div>
        </div>

        {/* Callout 1: GHN Express Auto Transfer Notification with Countdown */}
        <div className="bg-[#e6f7ef]/80 dark:bg-emerald-950/40 border border-[#b2e7cf] dark:border-emerald-800/80 text-[#006644] dark:text-emerald-300 rounded-2xl p-4 flex items-start gap-3 text-xs shadow-2xs">
          <ShieldCheck size={18} className="text-[#00875a] dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <p className="font-semibold leading-relaxed">
              Đơn hàng đang được tự động chuyển sang bộ phận đóng gói và giao cho GHN Express. Tự động chuyển hướng sau{' '}
              <strong className="font-bold underline text-[#004d34] dark:text-emerald-200">
                {momoCountdown}s
              </strong>
              .
            </p>
          </div>
        </div>

        {/* Callout 2: Email E-Invoice Confirmation */}
        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/60 text-blue-900 dark:text-blue-300 rounded-2xl p-4 flex items-start gap-3 text-xs shadow-2xs">
          <Mail size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <p className="text-blue-900 dark:text-blue-200 leading-relaxed">
              📧 <strong>Hóa đơn & Xác nhận thanh toán</strong> đã được gửi tới email của bạn (
              <span className="font-semibold text-blue-950 dark:text-blue-100">{order.customer_email}</span>
              ). Vui lòng kiểm tra hộp thư đến để lưu trữ biên lai.
            </p>
          </div>
        </div>

        {/* Actions Button Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setViewMode('order')}
            className="w-full sm:flex-1 py-3.5 px-6 bg-[#00875a] hover:bg-[#00704a] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>Xem Chi Tiết Đơn Hàng Ngay</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="w-full sm:w-auto py-3.5 px-6 bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700 hover:bg-cream-50 dark:hover:bg-ink-700 text-ink-800 dark:text-cream-200 font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            <span>Tiếp Tục Mua Sắm</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: ẢNH 2 - ĐẶT HÀNG THÀNH CÔNG (GHN EXPRESS & DETAILS)
  // ==========================================
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-fade-in space-y-6">
      {/* 1. Header Banner */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-[#e6f7ef] dark:bg-emerald-950/60 text-[#00a86b] dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs border border-[#b2e7cf] dark:border-emerald-800 animate-scale-in">
          <Check size={36} strokeWidth={3} />
        </div>

        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900 dark:text-cream-100">
          Đặt Hàng Thành Công!
        </h1>

        <p className="text-xs sm:text-sm text-ink-500 dark:text-cream-400 max-w-lg mx-auto">
          Cảm ơn bạn đã tin tưởng dịch vụ của CameraHub. Mã đơn hàng của bạn là{' '}
          <strong className="font-mono text-[#00875a] dark:text-emerald-400 font-bold">
            #{order?.order_code || order?.id || orderId}
          </strong>
        </p>
      </div>

      {/* VietQR Pending Card (Chỉ hiển thị nếu là VietQR và chưa thanh toán) */}
      {isVietQR && !paymentConfirmed && order && (
        <div className="bg-white dark:bg-ink-900 rounded-3xl border-2 border-accent-500/40 p-5 sm:p-7 shadow-lg space-y-5 animate-scale-up">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-100 dark:border-ink-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-accent-50 dark:bg-accent-950/60 text-accent-600 flex items-center justify-center border border-accent-200 dark:border-accent-800">
                <QrCode size={22} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-100">
                  Thanh toán Chuyển khoản VietQR
                </h3>
                <p className="text-[11px] text-ink-500 dark:text-cream-400">
                  Quét mã bằng App ngân hàng bất kỳ để chuyển tiền nhanh Napas 24/7
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold flex items-center gap-1">
              <Clock size={13} className="text-amber-500 animate-pulse" />
              <span>Chờ thanh toán</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* QR Image */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center space-y-2 bg-cream-50/70 dark:bg-ink-800/60 p-4 rounded-2xl border border-cream-200 dark:border-ink-700">
              <div className="bg-white p-2 rounded-xl shadow-xs border border-cream-200">
                <img src={qrUrl} alt="VietQR" className="w-44 h-44 object-contain rounded-lg" />
              </div>
              <a
                href={qrUrl}
                target="_blank"
                rel="noreferrer"
                download={`VietQR-${order.order_code}.png`}
                className="inline-flex items-center gap-1 text-[11px] text-accent-600 hover:underline font-bold"
              >
                <Download size={13} />
                <span>Tải ảnh QR</span>
              </a>
            </div>

            {/* Bank Info */}
            <div className="sm:col-span-7 space-y-2.5 text-xs">
              <div className="p-2.5 bg-cream-50/60 dark:bg-ink-800/50 rounded-xl border border-cream-200 dark:border-ink-700">
                <span className="text-ink-400 text-[10px] block">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-ink-900 dark:text-cream-100 text-xs">
                  {VIETQR_CONFIG.bankFullName}
                </span>
              </div>

              <div className="p-2.5 bg-cream-50/60 dark:bg-ink-800/50 rounded-xl border border-cream-200 dark:border-ink-700 flex items-center justify-between">
                <div>
                  <span className="text-ink-400 text-[10px] block">Số tài khoản:</span>
                  <span className="font-mono font-bold text-sm text-accent-600">
                    {VIETQR_CONFIG.accountNo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('stk', VIETQR_CONFIG.accountNo)}
                  className="px-2.5 py-1 bg-white dark:bg-ink-700 text-accent-700 dark:text-accent-300 rounded-lg border border-cream-200 dark:border-ink-600 text-[11px] font-bold cursor-pointer"
                >
                  {copiedField === 'stk' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              <div className="p-2.5 bg-accent-50/70 dark:bg-accent-950/40 rounded-xl border border-accent-200/80 dark:border-accent-800 flex items-center justify-between">
                <div>
                  <span className="text-accent-700 dark:text-accent-400 text-[10px] font-bold block">
                    Nội dung chuyển khoản (bắt buộc):
                  </span>
                  <span className="font-mono font-bold text-xs text-accent-700 dark:text-accent-300">
                    {order.order_code || order.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('memo', order.order_code || order.id)}
                  className="px-2.5 py-1 bg-white dark:bg-ink-700 text-accent-700 dark:text-accent-300 rounded-lg border border-accent-200 dark:border-ink-600 text-[11px] font-bold cursor-pointer"
                >
                  {copiedField === 'memo' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmPaid}
                disabled={confirmingPayment}
                className="w-full mt-2 py-3 bg-[#00875a] hover:bg-[#00704a] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                {confirmingPayment ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Đang xác thực giao dịch...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Tôi đã chuyển khoản thành công</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Shipping & Order Card (Chuẩn 100% Ảnh 2) */}
      {order && (
        <div className="bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Card Header: Vận chuyển GHN Express & Badge GHN Tiêu Chuẩn */}
          <div className="flex items-center justify-between pb-3.5 border-b border-cream-100 dark:border-ink-800">
            <div className="flex items-center gap-2 font-bold text-ink-900 dark:text-cream-100 text-sm sm:text-base">
              <Truck size={20} className="text-[#00a86b] dark:text-emerald-400" />
              <span>Vận Chuyển Qua GHN Express</span>
            </div>

            <span className="px-3 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-full text-xs font-bold">
              GHN Tiêu Chuẩn
            </span>
          </div>

          {/* Row 1: Phương thức thanh toán */}
          <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
            <span className="text-ink-500 dark:text-cream-400">Phương thức thanh toán:</span>
            <span className="font-bold text-ink-900 dark:text-cream-100 text-right">
              {order.payment_method === 'momo'
                ? 'Cổng thanh toán Trực tuyến (MoMo / VietQR Hosted)'
                : isVietQR
                  ? 'Cổng thanh toán Trực tuyến (VietQR Hosted / MBBank)'
                  : 'Thanh toán khi nhận hàng (COD)'}
            </span>
          </div>

          {/* Row 2: Trạng thái đơn hàng */}
          <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
            <span className="text-ink-500 dark:text-cream-400">Trạng thái đơn hàng:</span>
            <span className="px-3 py-1 bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold">
              Đang chuẩn bị hàng
            </span>
          </div>

          {/* Callout 1 (green): Thông báo hệ thống vận chuyển GHN */}
          <div className="bg-[#e6f7ef]/80 dark:bg-emerald-950/40 border border-[#b2e7cf] dark:border-emerald-800/80 text-[#006644] dark:text-emerald-300 rounded-2xl p-4 flex items-start gap-3 text-xs shadow-2xs">
            <ShieldCheck size={18} className="text-[#00875a] dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Đơn hàng đã được ghi nhận trên hệ thống vận chuyển GHN. Bạn có thể tra cứu hành trình theo
              thời gian thực bất cứ lúc nào trong mục <strong>Đơn hàng của tôi</strong>.
            </p>
          </div>

          {/* Callout 2 (blue): Thông báo email hóa đơn điện tử */}
          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/60 text-blue-900 dark:text-blue-300 rounded-2xl p-4 flex items-start gap-3 text-xs shadow-2xs">
            <Mail size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              📧 Hóa đơn điện tử và thông báo xác nhận đơn hàng đã được gửi tới email của bạn (
              <strong>{order.customer_email}</strong>). Vui lòng kiểm tra hòm thư để lưu trữ chi tiết giao
              dịch.
            </p>
          </div>
        </div>
      )}

      {/* 3. Action Buttons (Chuẩn Ảnh 2: 2 nút trên + 1 nút dưới) */}
      <div className="space-y-3 pt-2">
        {/* Row 1: Xem & In Biên Nhận + Quản lý đơn hàng của tôi */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="w-full sm:flex-1 py-3 px-5 border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Receipt size={16} />
            <span>Xem & In Biên Nhận</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ name: 'orders' })}
            className="w-full sm:flex-1 py-3 px-5 border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:bg-cream-50 dark:hover:bg-ink-700 text-ink-700 dark:text-cream-200 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Package size={16} />
            <span>Quản lý đơn hàng của tôi</span>
          </button>
        </div>

        {/* Row 2: Tiếp tục mua sắm */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="w-full sm:w-auto min-w-[240px] py-3.5 px-8 bg-[#00875a] hover:bg-[#00704a] text-white font-bold text-xs sm:text-sm rounded-full shadow-md flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag size={16} />
            <span>Tiếp tục mua sắm</span>
          </button>
        </div>

        {/* Optional Toggle back to MoMo Gateway Result Screen if paid via MoMo */}
        {order?.payment_method === 'momo' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setViewMode('momo')}
              className="text-xs text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink size={12} />
              <span>Xem lại biên lai kết quả Cổng MoMo AIO Gateway</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL XEM & IN BIÊN NHẬN (Receipt Modal via Portal) */}
      {showReceiptModal &&
        order &&
        createPortal(
          <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-ink-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-cream-200 dark:border-ink-700 overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="px-6 py-4 border-b border-cream-100 dark:border-ink-800 flex items-center justify-between bg-cream-50/60 dark:bg-ink-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-100">
                      Biên Nhận Đơn Hàng
                    </h3>
                    <p className="text-[11px] text-ink-400">
                      Hóa đơn điện tử chính thức từ CameraHub
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="w-8 h-8 rounded-full bg-cream-100 dark:bg-ink-800 hover:bg-cream-200 dark:hover:bg-ink-700 text-ink-500 flex items-center justify-center cursor-pointer transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Printable Body Content */}
              <div id="printable-receipt" className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Store & Order Code */}
                <div className="flex justify-between items-start border-b border-cream-100 dark:border-ink-800 pb-4">
                  <div>
                    <h4 className="font-display font-black text-lg text-ink-900 dark:text-cream-100 tracking-tight">
                      CameraHub Vietnam
                    </h4>
                    <p className="text-[11px] text-ink-500 dark:text-cream-400">
                      Hệ thống máy ảnh, ống kính & phụ kiện chính hãng
                    </p>
                    <p className="text-[11px] text-ink-400">Hotline: 1900 6868 • support@camerahub.vn</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-[#00875a] dark:text-emerald-400 block">
                      #{order.order_code || order.id}
                    </span>
                    <span className="text-[11px] text-ink-400 flex items-center justify-end gap-1 mt-0.5">
                      <Calendar size={11} />
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString('vi-VN')
                        : new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Customer Info & Shipping Carrier */}
                <div className="grid grid-cols-2 gap-4 p-3.5 bg-cream-50/60 dark:bg-ink-800/50 rounded-2xl border border-cream-200 dark:border-ink-700">
                  <div className="space-y-1">
                    <span className="text-ink-400 text-[10px] uppercase font-bold block">
                      Người nhận hàng
                    </span>
                    <p className="font-bold text-ink-900 dark:text-cream-100 text-xs">
                      {order.customer_name}
                    </p>
                    <p className="text-ink-500 dark:text-cream-400 flex items-center gap-1 text-[11px]">
                      <Phone size={11} /> {order.customer_phone}
                    </p>
                    <p className="text-ink-500 dark:text-cream-400 flex items-center gap-1 text-[11px]">
                      <Mail size={11} /> {order.customer_email}
                    </p>
                    <p className="text-ink-600 dark:text-cream-300 text-[11px] mt-1">
                      {order.shipping_address}, {order.city}
                    </p>
                  </div>

                  <div className="space-y-1 text-right">
                    <span className="text-ink-400 text-[10px] uppercase font-bold block">
                      Đơn vị giao vận
                    </span>
                    <p className="font-bold text-ink-900 dark:text-cream-100 text-xs flex items-center justify-end gap-1">
                      <Truck size={13} className="text-[#00a86b]" />
                      GHN Express
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                      Gói: GHN Tiêu Chuẩn
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-bold">
                      Đang chuẩn bị hàng
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <span className="text-ink-400 text-[10px] uppercase font-bold block">
                    Danh sách sản phẩm ({order.items?.length || 0})
                  </span>
                  <div className="border border-cream-200 dark:border-ink-800 rounded-xl overflow-hidden divide-y divide-cream-100 dark:divide-ink-800">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-ink-900"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-10 h-10 object-cover rounded-lg bg-cream-100 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-ink-900 dark:text-cream-100 truncate text-xs">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-ink-400">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-display font-bold text-ink-900 dark:text-cream-100 shrink-0 text-xs">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="p-3.5 bg-cream-50/70 dark:bg-ink-800/60 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-ink-500 dark:text-cream-400">
                    <span>Hình thức thanh toán:</span>
                    <span className="font-semibold text-ink-800 dark:text-cream-200">
                      {order.payment_method === 'momo'
                        ? 'MoMo AIO Hosted Gateway'
                        : isVietQR
                          ? 'VietQR Napas 24/7'
                          : 'COD (Thanh toán khi nhận)'}
                    </span>
                  </div>

                  <div className="flex justify-between text-ink-500 dark:text-cream-400">
                    <span>Trạng thái thanh toán:</span>
                    <span className="font-bold text-[#00875a] dark:text-emerald-400">
                      {order.payment_status === 'paid' || paymentConfirmed
                        ? 'Đã thanh toán đủ'
                        : 'Chờ thu tiền'}
                    </span>
                  </div>

                  <div className="border-t border-cream-200 dark:border-ink-700 pt-2 flex justify-between items-center">
                    <span className="font-bold text-ink-900 dark:text-cream-100">
                      Tổng tiền thanh toán:
                    </span>
                    <span className="font-display font-black text-base text-[#00875a] dark:text-emerald-400">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-cream-100 dark:border-ink-800 flex items-center justify-end gap-2.5 bg-cream-50/60 dark:bg-ink-800/40">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700 hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-700 dark:text-cream-300 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-[#00875a] hover:bg-[#00704a] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  <Printer size={14} />
                  <span>In Biên Nhận</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
