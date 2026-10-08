import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Check,
  Loader2,
  MapPin,
  Sparkles,
  Navigation,
  Truck,
  ShieldCheck,
  Zap,
  Building,
  Home,
  Clock,
  QrCode,
  Copy,
  AlertTriangle,
  Flame,
  ArrowLeft,
  Tag,
  X,
} from 'lucide-react';
import type { Page, Address } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { MapLocationPicker, type SelectedLocationData } from '../components/MapLocationPicker';
import {
  AVAILABLE_CARRIERS,
  calculateShippingFee,
  FREE_SHIPPING_THRESHOLD,
  type ShippingCarrier,
} from '../services/shipping.service';
import { vietqrService, VIETQR_CONFIG } from '../services/vietqr.service';
import { getStoreSettings } from '../lib/settings';
import { useToast } from '../context/ToastContext';
import {
  PaymentMethodSelector,
  CheckoutVoucherModal,
  CheckoutLeaveModal,
  CheckoutExpiredModal,
} from '../components/checkout';

interface Props {
  onNavigate: (page: Page) => void;
}

const CHECKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes session

export function CheckoutPage({ onNavigate }: Props) {
  const { items, subtotal, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Voucher State
  const [availableVouchers, setAvailableVouchers] = useState<Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    discount_type: 'fixed' | 'percent';
    discount_value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
  }>>([]);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    name: string;
    discount_type: 'fixed' | 'percent';
    discount_value: number;
    discount_amount: number;
    final_amount: number;
  } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const vList = await api.getAvailableVouchers();
        setAvailableVouchers(vList || []);
      } catch (e) {
        console.warn('Could not load vouchers:', e);
      }
    })();
  }, []);

  // 15-minute Session Countdown Timer
  const [timeLeft, setTimeLeft] = useState<number>(CHECKOUT_DURATION_SECONDS);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    // Check if an active deadline exists in sessionStorage
    const storedDeadline = sessionStorage.getItem('camerahub_checkout_deadline');
    let targetDeadline = storedDeadline ? parseInt(storedDeadline, 10) : 0;

    // If no deadline or expired, initialize a fresh 15-minute deadline
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

  // Form State
  const [form, setForm] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: 'Hà Nội',
    payment: 'vietqr', // Default to VietQR
    carrierId: 'ghn',
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = (timeLeft / CHECKOUT_DURATION_SECONDS) * 100;

  const handleCopy = async (field: string, text: string) => {
    const success = await vietqrService.copyText(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Sync basic user info into form upon login
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Load Saved Addresses
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const addrs = await api.getAddresses();
          setSavedAddresses(addrs || []);
          const def = addrs.find((a) => a.isDefault);
          if (def) {
            setSelectedAddressId(def.id);
            setForm((prev) => ({
              ...prev,
              name: def.recipientName || prev.name,
              phone: def.phone || prev.phone,
              address: def.address || prev.address,
              city: def.city || prev.city,
            }));
          }
        } catch (e) {
          console.error('Error fetching addresses:', e);
        }
      })();
    }
  }, [user]);

  // Map Confirm Callback
  const handleMapConfirm = (data: SelectedLocationData) => {
    setSelectedAddressId(null);
    setForm((prev) => ({
      ...prev,
      city: data.city || prev.city,
      address: data.detailAddress
        ? `${data.detailAddress}, ${data.administrativeArea}`
        : data.fullAddress,
    }));
  };

  const handleSelectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setForm((prev) => ({
      ...prev,
      name: addr.recipientName || prev.name,
      phone: addr.phone || prev.phone,
      address: addr.address || prev.address,
      city: addr.city || prev.city,
    }));
  };

  // Voucher Handlers
  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = (codeToApply || voucherCodeInput).trim().toUpperCase();
    if (!code) {
      toast.warning('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setVoucherLoading(true);
      const res = await api.applyVoucher(code, subtotal);
      if (res.valid && res.voucher) {
        setAppliedVoucher(res.voucher);
        setVoucherCodeInput(res.voucher.code);
        toast.success(`Đã áp dụng mã "${res.voucher.code}": -${formatCurrency(res.voucher.discount_amount)}`);
      } else {
        toast.error(res.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể áp dụng mã giảm giá');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    toast.info('Đã hủy áp dụng mã giảm giá');
  };

  // Calculate Shipping with Service
  const shippingCalculation = calculateShippingFee({
    carrierId: form.carrierId,
    subtotal,
    province: form.city,
  });

  const shippingFee = shippingCalculation.fee;
  const voucherDiscount = appliedVoucher ? appliedVoucher.discount_amount : 0;
  const total = Math.max(0, subtotal - voucherDiscount + shippingFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);

    try {
      const orderItems = items.map((i) => ({
        product_id: i.product_id,
        name: i.product?.name || 'Sản phẩm Camera',
        price: i.product?.price || 0,
        quantity: i.quantity,
        image_url: i.product?.image_url || '',
      }));

      const order = await api.createOrder({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        shipping_address: form.address,
        city: form.city,
        payment_method: form.payment,
        voucher_code: appliedVoucher ? appliedVoucher.code : undefined,
        items: orderItems,
      });

      await clearCart();

      if (form.payment === 'momo') {
        toast.info('Đang chuyển hướng sang cổng thanh toán MoMo Sandbox...');
        try {
          const momoRes = await api.createMomoPayment(order.id);
          if (momoRes.success && momoRes.payUrl) {
            window.location.href = momoRes.payUrl;
            return;
          }
        } catch (momoErr: any) {
          console.warn('MoMo payment init warning:', momoErr);
          toast.warning('Đang mở trang chi tiết đơn hàng...');
        }
      }

      sessionStorage.removeItem('camerahub_checkout_deadline');
      onNavigate({ name: 'order-success', orderId: order.id });
    } catch (err) {
      console.error('Failed to create order:', err);
      toast.error('Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-cream-100 dark:bg-ink-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-accent-600 border border-cream-200 dark:border-ink-700 shadow-xs">
          <ShieldCheck size={36} />
        </div>
        <h1 className="font-display font-bold text-2xl text-ink-900 dark:text-cream-100 mb-2">
          Yêu cầu đăng nhập tài khoản
        </h1>
        <p className="text-ink-500 dark:text-cream-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Vui lòng đăng nhập tài khoản để xác thực danh tính, sử định địa chỉ giao hàng và hoàn tất đặt hàng an toàn.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('camerahub_checkout_deadline');
              onNavigate({ name: 'cart' });
            }}
            className="btn-secondary px-6 py-3 text-sm font-bold cursor-pointer"
          >
            Quay lại giỏ hàng
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="btn-accent px-8 py-3 text-sm font-bold shadow-md hover:shadow-lg cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <h1 className="font-display font-bold text-2xl text-ink-900 dark:text-cream-100 mb-3">
          Không có sản phẩm để thanh toán
        </h1>
        <p className="text-ink-400 dark:text-cream-400 mb-8">Giỏ hàng của bạn đang trống.</p>
        <button onClick={() => onNavigate({ name: 'catalog' })} className="btn-primary">
          Khám phá sản phẩm
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-ink-400 dark:text-cream-400">
          <button
            onClick={() => {
              sessionStorage.removeItem('camerahub_checkout_deadline');
              onNavigate({ name: 'home' });
            }}
            className="hover:text-ink-700 dark:hover:text-cream-200 cursor-pointer"
          >
            Trang chủ
          </button>
          <ChevronRight size={14} />
          <button onClick={() => setIsLeaveModalOpen(true)} className="hover:text-ink-700 dark:hover:text-cream-200 cursor-pointer">
            Giỏ hàng
          </button>
          <ChevronRight size={14} />
          <span className="text-ink-700 dark:text-cream-200 font-semibold">Thanh toán</span>
        </div>

        {/* Back to Cart Trigger (Matches Image 1) */}
        <button
          type="button"
          onClick={() => setIsLeaveModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cream-100 dark:bg-ink-800 hover:bg-cream-200 dark:hover:bg-ink-700 text-ink-700 dark:text-cream-200 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 border border-cream-200 dark:border-ink-700"
        >
          <ArrowLeft size={13} />
          <span>Quay về Giỏ hàng</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-cream-100">Thanh toán đơn hàng</h1>
          <p className="text-xs text-ink-500 dark:text-cream-400 mt-1">Hoàn tất thông tin giao hàng và chọn hình thức thanh toán an toàn</p>
        </div>

        {/* 15-min Countdown Timer Header Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-ink-900 px-4 py-2.5 rounded-2xl border border-cream-200 dark:border-ink-800 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <Flame size={18} className="text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">Thời gian giữ hàng</div>
            <div className="font-display font-bold text-base text-accent-600 dark:text-accent-400 flex items-center gap-1.5">
              <Clock size={14} className="text-accent-500" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgency Progress Bar */}
      <div className="mb-8 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <span className="font-semibold flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
            Giỏ hàng của bạn đang được giữ chỗ trong 15 phút
          </span>
          <span className="font-bold font-mono">{formattedTime}</span>
        </div>
        <div className="w-full bg-amber-200/70 dark:bg-amber-900/60 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Information & Carriers */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Saved Addresses Selection (if available) */}
          {savedAddresses.length > 0 && (
            <div className="card p-6 space-y-3">
              <h2 className="font-display font-semibold text-lg text-ink-800 flex items-center gap-2">
                <MapPin size={18} className="text-accent-500" />
                <span>Sổ địa chỉ đã lưu của bạn</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id
                      ? 'border-accent-500 bg-accent-50/40 dark:bg-accent-500/10 shadow-2xs'
                      : 'border-cream-200 dark:border-ink-700 hover:border-cream-300 dark:hover:border-ink-600 bg-white dark:bg-ink-800'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-cream-100 dark:bg-ink-700 text-ink-800 dark:text-cream-200 rounded-md text-[11px] font-bold">
                        {addr.label || 'Nhà riêng'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 px-2 py-0.5 rounded-full">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-ink-900 truncate">{addr.recipientName} - {addr.phone}</p>
                    <p className="text-xs text-ink-500 truncate mt-0.5">{addr.address}, {addr.city}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Shipping info with Interactive Map trigger */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-ink-800">
                Thông tin giao hàng
              </h2>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent-50 text-accent-700 border border-accent-200 rounded-full text-xs font-bold hover:bg-accent-100 transition-colors cursor-pointer shadow-2xs"
              >
                <Navigation size={13} className="text-accent-500" />
                <span>Chọn trên Bản Đồ</span>
              </button>
            </div>

            {/* Smart Map Banner Card (Matches Image 1) */}
            <div className="p-4 bg-accent-50/60 border border-accent-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">

                <div>
                  <h4 className="text-sm text-ink-900 dark:text-cream-50">
                    Chọn vị trí trực tiếp qua Bản đồ OpenStreetMap / Google Maps
                  </h4>

                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <MapPin size={13} />
                <span>Mở Bản Đồ</span>
              </button>
            </div>

            {/* Form Inputs */}
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Họ và tên người nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Nguyễn Văn Phục"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Email thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="0909123456"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Tỉnh / Thành phố <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Hà Nội hoặc TP. Hồ Chí Minh"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, phường/xã) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Số 10 Đường Cầu Giấy, Phường Dịch Vọng..."
                />
              </div>
            </div>
          </div>

          {/* 3. Shipping Carrier Selection (Chính thức GHN Express) */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-ink-800 flex items-center gap-2">
                <Truck size={18} className="text-accent-500" />
                <span>Phương thức vận chuyển</span>
              </h2>
              {subtotal >= (getStoreSettings().freeShippingThreshold || FREE_SHIPPING_THRESHOLD) ? (
                <span className="px-3 py-1 bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300 rounded-full text-xs font-bold border border-accent-200 dark:border-accent-800">
                  Miễn phí vận chuyển đơn &gt; {formatCurrency(getStoreSettings().freeShippingThreshold || FREE_SHIPPING_THRESHOLD)}
                </span>
              ) : (
                <span className="text-xs text-ink-400">
                  Đơn từ {formatCurrency(getStoreSettings().freeShippingThreshold || FREE_SHIPPING_THRESHOLD)} được Freeship
                </span>
              )}
            </div>

            <div className="space-y-3">
              {AVAILABLE_CARRIERS.map((carrier) => {
                const calc = calculateShippingFee({
                  carrierId: carrier.id,
                  subtotal,
                  province: form.city,
                });

                return (
                  <div
                    key={carrier.id}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-accent-500 bg-accent-50/30 dark:bg-accent-500/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <Truck size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-ink-900 dark:text-cream-50">{carrier.name}</p>
                          <span className="px-2.5 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded-full border border-orange-200 dark:border-orange-800">
                            {carrier.estimatedTime}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Giao nhanh toàn quốc</span>
                          <span>•</span>
                          <span>Đóng hộp chống sốc chuyên dụng máy ảnh</span>
                          <span>•</span>
                          <span>Bảo hiểm 100% bưu kiện</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-cream-200 dark:border-ink-700">
                      <div className="text-[11px] text-ink-400 mb-0.5">Cước vận chuyển:</div>
                      {calc.isFree ? (
                        <div>
                          <span className="text-xs text-ink-400 line-through mr-1.5">
                            {formatCurrency(calc.originalFee)}
                          </span>
                          <span className="font-bold text-base text-accent-600 dark:text-accent-400">Miễn phí</span>
                        </div>
                      ) : (
                        <span className="font-bold text-base text-ink-900 dark:text-cream-50">
                          {formatCurrency(calc.fee)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Payment Method */}
          <PaymentMethodSelector
            selectedMethod={form.payment}
            onSelectMethod={(methodId) => setForm({ ...form, payment: methodId })}
          />
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-5">
            <h2 className="font-display font-semibold text-lg text-ink-800">
              Đơn hàng của bạn
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-cream-100 shrink-0 border border-cream-200">
                    <img
                      src={item.product?.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-ink-900 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-[11px] text-ink-400">Số lượng: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-ink-900 shrink-0">
                    {formatCurrency((item.product?.price || 0) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Voucher / Coupon Section (Matches Image 2 & 3) */}
            <div className="border-t border-cream-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                  <Tag size={14} className="text-accent-500" />
                  <span>Mã Giảm Giá / Voucher</span>
                </label>
                {availableVouchers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="text-xs font-bold text-accent-600 hover:text-accent-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Chọn mã ({availableVouchers.length})</span>
                  </button>
                )}
              </div>

              {appliedVoucher ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-300 rounded-2xl shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      %
                    </div>
                    <div>
                      <div className="font-mono font-bold text-xs text-emerald-900 tracking-wide uppercase">
                        {appliedVoucher.code}
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-600">
                        Đã giảm {formatCurrency(appliedVoucher.discount_amount)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="p-1.5 text-emerald-700 hover:text-rose-600 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                    title="Hủy áp dụng mã"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                      placeholder="NHẬP MÃ..."
                      className="w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border border-cream-300 dark:border-ink-700 rounded-xl focus:border-accent-500 focus:outline-hidden bg-white dark:bg-ink-800 dark:text-cream-100 placeholder:text-ink-400 dark:placeholder:text-ink-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyVoucher()}
                    disabled={voucherLoading || !voucherCodeInput.trim()}
                    className="px-4 py-2 bg-ink-800 dark:bg-accent-600 hover:bg-accent-500 dark:hover:bg-accent-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-2xs active:scale-95"
                  >
                    {voucherLoading ? 'Đang áp dụng...' : 'Áp dụng'}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-cream-100 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-500 font-medium">Tiền hàng:</span>
                <span className="font-bold text-ink-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-500 font-medium">Phí ship ({shippingCalculation.carrier.name}):</span>
                {shippingCalculation.isFree ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Miễn phí (Freeship)
                  </span>
                ) : (
                  <span className="font-bold text-ink-900">
                    {formatCurrency(shippingCalculation.fee)}
                  </span>
                )}
              </div>
              {appliedVoucher && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="font-medium flex items-center gap-1">
                    <span className="font-bold">%</span>
                    <span>Voucher ({appliedVoucher.code}):</span>
                  </span>
                  <span className="font-bold">-{formatCurrency(appliedVoucher.discount_amount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-cream-100 pt-4">
              <div className="flex justify-between items-end mb-1">
                <span className="font-bold text-sm text-ink-800">Tổng thanh toán:</span>
                <span className="font-display font-bold text-2xl text-accent-600">
                  {formatCurrency(total)}
                </span>
              </div>
              <p className="text-[11px] text-ink-400 text-right">Đã bao gồm VAT & phí bảo hiểm thiết bị</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-accent py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Đang tạo đơn hàng...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Check size={18} />
                  <span>Xác nhận đặt hàng</span>
                </div>
              )}
            </button>

            {/* Trust badge */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-ink-500 font-medium border-t border-cream-100">
              <ShieldCheck size={15} className="text-accent-500" />
              <span>Bảo hành chính hãng & đồng kiểm khi nhận hàng</span>
            </div>
          </div>
        </div>
      </form>

      {/* Interactive Map Picker Modal */}
      <MapLocationPicker
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={handleMapConfirm}
      />

      {/* Leave Confirmation Modal */}
      <CheckoutLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirmLeave={() => {
          setIsLeaveModalOpen(false);
          sessionStorage.removeItem('camerahub_checkout_deadline');
          onNavigate({ name: 'cart' });
        }}
      />

      {/* Voucher Selection Modal */}
      <CheckoutVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        availableVouchers={availableVouchers}
        appliedVoucher={appliedVoucher}
        subtotal={subtotal}
        onApplyVoucher={handleApplyVoucher}
      />

      {/* 15-Minute Session Expired Modal */}
      <CheckoutExpiredModal
        isExpired={isExpired}
        onReturnToCart={() => {
          sessionStorage.removeItem('camerahub_checkout_deadline');
          onNavigate({ name: 'cart' });
        }}
      />
    </div>
  );
}
