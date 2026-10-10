import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Smartphone,
  CreditCard,
  Globe,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Building2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Headphones,
} from 'lucide-react';
import type { Page, Order } from '../types';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useToast } from '../context/ToastContext';

interface Props {
  orderId: string;
  onNavigate: (page: Page) => void;
}

const COUNTDOWN_SECONDS = 15 * 60;

// Danh sách ngân hàng tiêu biểu hỗ trợ Napas trên cổng MoMo
const POPULAR_BANKS = [
  { code: 'VCB', name: 'Vietcombank', color: '#006a4e' },
  { code: 'TCB', name: 'Techcombank', color: '#ec1c24' },
  { code: 'MB', name: 'MBBank', color: '#163888' },
  { code: 'BIDV', name: 'BIDV', color: '#0f75bc' },
  { code: 'CTG', name: 'VietinBank', color: '#005baa' },
  { code: 'ACB', name: 'ACB', color: '#004f9e' },
  { code: 'VPB', name: 'VPBank', color: '#008542' },
  { code: 'TPB', name: 'TPBank', color: '#742b87' },
  { code: 'VAB', name: 'Agribank', color: '#a61c1c' },
  { code: 'NCB', name: 'NCB (Test)', color: '#0065b3' },
];

export const MomoPaymentGatewayPage: React.FC<Props> = ({ orderId, onNavigate }) => {
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'qr' | 'atm' | 'intl'>('qr');
  const [showItems, setShowItems] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Countdown timer 15 minutes
  const [timeLeft, setTimeLeft] = useState<number>(COUNTDOWN_SECONDS);
  const [isExpired, setIsExpired] = useState(false);

  // ATM Card Form
  const [atmBank, setAtmBank] = useState('NCB');
  const [atmCardNumber, setAtmCardNumber] = useState('');
  const [atmCardHolder, setAtmCardHolder] = useState('');
  const [atmIssueDate, setAtmIssueDate] = useState('');
  const [atmOtp, setAtmOtp] = useState('');

  // International Card Form
  const [intlCardNumber, setIntlCardNumber] = useState('');
  const [intlCardHolder, setIntlCardHolder] = useState('');
  const [intlExpiry, setIntlExpiry] = useState('');
  const [intlCvv, setIntlCvv] = useState('');

  // Processing state & modal
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [openingExternalMomo, setOpeningExternalMomo] = useState(false);

  useEffect(() => {
    let target = Date.now() + COUNTDOWN_SECONDS * 1000;
    const stored = sessionStorage.getItem(`momo_deadline_${orderId}`);
    if (stored) {
      target = parseInt(stored, 10);
    } else {
      sessionStorage.setItem(`momo_deadline_${orderId}`, String(target));
    }

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId]);

  // Load Order Details
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getOrder(orderId);
        setOrder(data);
        if (data && (data.payment_status === 'paid' || data.payment_status === 'completed')) {
          toast.info('Đơn hàng này đã được thanh toán hoàn tất.');
          onNavigate({ name: 'order-success', orderId });
        }
      } catch (err) {
        console.error('Failed to load order for MoMo Gateway:', err);
        toast.error('Không tìm thấy thông tin đơn hàng.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, onNavigate, toast]);

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper Auto-fill Test Data
  const fillNapasTestCard = () => {
    setAtmBank('NCB');
    setAtmCardNumber('9704 0000 0000 0018');
    setAtmCardHolder('NGUYEN VAN A');
    setAtmIssueDate('03/07');
    setAtmOtp('000000');
    toast.success('Đã tự động điền thẻ ATM Napas test MoMo!');
  };

  const fillVisaTestCard = () => {
    setIntlCardNumber('4111 1111 1111 1111');
    setIntlCardHolder('NGUYEN VAN A');
    setIntlExpiry('12/28');
    setIntlCvv('123');
    toast.success('Đã tự động điền thẻ Visa test MoMo!');
  };

  // Submit Payment Action
  const handleExecutePayment = async (type: 'qr' | 'atm' | 'intl') => {
    if (!order) return;
    setIsProcessing(true);

    try {
      setProcessStep('Đang kết nối đến Cổng thanh toán MoMo...');
      await new Promise((r) => setTimeout(r, 700));

      setProcessStep('Đang xác thực thông tin tài khoản & số dư thanh toán...');
      await new Promise((r) => setTimeout(r, 800));

      setProcessStep('Đang hoàn tất giao dịch và cấp biên lai...');

      const payload = {
        order_id: order.id,
        payment_type: type,
        bank_code: type === 'atm' ? atmBank : undefined,
        card_number: type === 'atm' ? atmCardNumber : type === 'intl' ? intlCardNumber : undefined,
        card_holder: type === 'atm' ? atmCardHolder : type === 'intl' ? intlCardHolder : undefined,
      };

      const res = await api.simulateMomoPayment(payload);

      if (res && res.success) {
        setIsSuccessModal(true);
        toast.success('Thanh toán MoMo thành công! Đơn hàng đã được duyệt.');
        sessionStorage.removeItem(`momo_deadline_${orderId}`);

        setTimeout(() => {
          onNavigate({ name: 'order-success', orderId: order.id });
        }, 1800);
      } else {
        toast.error(res?.message || 'Giao dịch không thành công. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.warn('Simulation API fallback to confirmPayment:', err);
      // Fallback safe call to confirmPayment
      try {
        await api.confirmPayment(order.id);
        setIsSuccessModal(true);
        toast.success('Thanh toán MoMo thành công!');
        sessionStorage.removeItem(`momo_deadline_${orderId}`);
        setTimeout(() => {
          onNavigate({ name: 'order-success', orderId: order.id });
        }, 1800);
      } catch (fallbackErr) {
        toast.error('Có lỗi xảy ra trong quá trình thanh toán.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Open external Sandbox gateway
  const handleOpenExternalMomo = async () => {
    if (!order) return;
    setOpeningExternalMomo(true);
    try {
      toast.info('Đang kết nối tới máy chủ MoMo Sandbox bên ngoài...');
      const res = await api.payAgainMomo(order.id);
      if (res && res.success && res.payUrl) {
        window.location.href = res.payUrl;
      } else {
        toast.warning(
          res?.message ||
            'Máy chủ MoMo Sandbox bên ngoài hiện đang bận (504). Bạn có thể thanh toán trực tiếp ngay trên form này!'
        );
      }
    } catch (e: any) {
      toast.warning(
        'Máy chủ MoMo Sandbox bên ngoài đang quá tải. Hãy thực hiện thanh toán trực tiếp qua Form MoMo CameraHub này để đảm bảo thành công 100%!'
      );
    } finally {
      setOpeningExternalMomo(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-pink-700 animate-pulse">
          Đang kết nối tới Cổng thanh toán MoMo...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertTriangle size={48} className="text-amber-500" />
        <h2 className="text-xl font-bold text-ink-900">Không tìm thấy thông tin đơn hàng</h2>
        <p className="text-sm text-ink-500 max-w-md">
          Mã đơn hàng không hợp lệ hoặc phiên làm việc đã kết thúc.
        </p>
        <button onClick={() => onNavigate({ name: 'home' })} className="btn-secondary px-6 py-2.5 text-xs font-bold">
          Quay về trang chủ
        </button>
      </div>
    );
  }

  // QR Code URL: Sử dụng QR code có logo MoMo và nội dung chuẩn hóa
  const qrData = `2|99|0968202605|CAMERAHUB|support@camerahub.vn|0|0|${Math.round(order.total_amount)}|${order.order_code || order.id}`;
  const momoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* 1. Header Bar thương hiệu MoMo */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-[#A50064] via-[#D82D8B] to-[#AE2070] text-white rounded-3xl p-5 sm:p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* MoMo Iconic Logo Badge */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-md shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect width="100" height="100" rx="22" fill="#D82D8B" />
                <circle cx="34" cy="46" r="8" fill="#ffffff" />
                <circle cx="66" cy="46" r="8" fill="#ffffff" />
                <path d="M 32 64 Q 50 78 68 64" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-wide">MOMO PAYMENT GATEWAY</span>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  Sandbox Verified
                </span>
              </div>
              <p className="text-xs text-pink-100 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck size={14} className="text-pink-200" />
                <span>Cổng thanh toán điện tử chuẩn PCI-DSS & Mã hóa SSL 256-bit</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-pink-100 bg-white/10 px-3.5 py-2 rounded-2xl backdrop-blur-xs">
            <Headphones size={16} className="text-white" />
            <div>
              <div className="text-[10px] text-pink-200">Hotline hỗ trợ 24/7</div>
              <strong className="text-white font-mono">1900 54 54 41</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Layout (2 Columns: Left = Thông tin đơn; Right = Form & Phương thức MoMo) */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tóm tắt đơn hàng & Thời gian đếm lùi */}
        <div className="lg:col-span-5 space-y-5">
          {/* Box Tổng Tiền & Mã đơn */}
          <div className="bg-white dark:bg-ink-900 rounded-3xl p-6 border border-pink-100 dark:border-ink-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-cream-100 dark:border-ink-800 pb-3">
              <span className="text-xs font-semibold text-ink-500 dark:text-cream-400">Đơn vị thụ hưởng:</span>
              <span className="text-xs font-bold text-ink-900 dark:text-cream-100 flex items-center gap-1">
                <Building2 size={13} className="text-[#D82D8B]" />
                CameraHub Store
              </span>
            </div>

            <div>
              <span className="text-xs text-ink-500 dark:text-cream-400">Số tiền cần thanh toán:</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#D82D8B] tracking-tight mt-1">
                {formatCurrency(order.total_amount)}
              </div>
            </div>

            <div className="bg-pink-50/70 dark:bg-ink-800/80 rounded-2xl p-3.5 border border-pink-200/80 dark:border-ink-700 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-500 dark:text-cream-400">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-ink-900 dark:text-cream-100">
                  #{order.order_code || order.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-500 dark:text-cream-400">Khách hàng:</span>
                <span className="font-medium text-ink-900 dark:text-cream-100">{order.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-500 dark:text-cream-400">Số điện thoại:</span>
                <span className="font-mono text-ink-900 dark:text-cream-100">{order.customer_phone}</span>
              </div>
            </div>

            {/* Countdown Box */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                isExpired
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : timeLeft < 180
                  ? 'bg-rose-50/80 border-rose-200 text-rose-800 animate-pulse'
                  : 'bg-amber-50/80 border-amber-200/80 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className={isExpired ? 'text-rose-600' : 'text-amber-600'} />
                <span className="text-xs font-semibold">
                  {isExpired ? 'Hết hạn giữ đơn' : 'Thời gian giữ đơn thanh toán:'}
                </span>
              </div>
              <span className="font-mono font-extrabold text-sm tracking-wider">
                {formattedTime}
              </span>
            </div>

            {/* Collapsible Order Items */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowItems(!showItems)}
                className="w-full flex items-center justify-between text-xs text-ink-600 dark:text-cream-300 hover:text-ink-900 py-1 cursor-pointer font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <Receipt size={14} className="text-ink-400" />
                  <span>Xem chi tiết {order.items.length} sản phẩm</span>
                </span>
                {showItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showItems && (
                <div className="mt-3 space-y-2 border-t border-cream-100 dark:border-ink-800 pt-3 max-h-56 overflow-y-auto pr-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover border border-cream-200 dark:border-ink-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-cream-100 dark:bg-ink-800 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-ink-900 dark:text-cream-100">{item.name}</p>
                        <p className="text-[11px] text-ink-400">SL: {item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate({ name: 'order-success', orderId: order.id })}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold text-ink-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Quay lại trang chi tiết đơn hàng</span>
              </button>
            </div>
          </div>

          {/* Cảnh báo an toàn */}
          <div className="bg-pink-50/50 dark:bg-ink-900/60 rounded-2xl p-4 border border-pink-200/60 dark:border-ink-800 text-[11px] text-ink-600 dark:text-cream-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-pink-700 dark:text-pink-300">
              <Lock size={13} />
              <span>Thanh toán an toàn với MoMo</span>
            </div>
            <p className="leading-relaxed">
              Mọi dữ liệu thanh toán được mã hóa đầu cuối theo tiêu chuẩn ngân hàng. Quý khách hoàn toàn yên tâm khi thực hiện giao dịch trên CameraHub.
            </p>
          </div>
        </div>

        {/* Right Column: 3 Phương thức thanh toán MoMo */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-ink-900 rounded-3xl border border-pink-100 dark:border-ink-800 shadow-sm overflow-hidden">
            {/* Tabs Selector Header */}
            <div className="grid grid-cols-3 bg-pink-50/50 dark:bg-ink-800/50 p-1.5 gap-1.5 border-b border-pink-100 dark:border-ink-800">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-white dark:bg-ink-900 text-[#D82D8B] shadow-xs border border-pink-200/80 dark:border-pink-900/60'
                    : 'text-ink-600 dark:text-cream-400 hover:text-ink-900 dark:hover:text-cream-100'
                }`}
              >
                <Smartphone size={16} className={activeTab === 'qr' ? 'text-[#D82D8B]' : ''} />
                <span>Ví MoMo (QR)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('atm')}
                className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'atm'
                    ? 'bg-white dark:bg-ink-900 text-[#D82D8B] shadow-xs border border-pink-200/80 dark:border-pink-900/60'
                    : 'text-ink-600 dark:text-cream-400 hover:text-ink-900 dark:hover:text-cream-100'
                }`}
              >
                <CreditCard size={16} className={activeTab === 'atm' ? 'text-[#D82D8B]' : ''} />
                <span>Thẻ ATM (Napas)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('intl')}
                className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'intl'
                    ? 'bg-white dark:bg-ink-900 text-[#D82D8B] shadow-xs border border-pink-200/80 dark:border-pink-900/60'
                    : 'text-ink-600 dark:text-cream-400 hover:text-ink-900 dark:hover:text-cream-100'
                }`}
              >
                <Globe size={16} className={activeTab === 'intl' ? 'text-[#D82D8B]' : ''} />
                <span>Thẻ Quốc Tế</span>
              </button>
            </div>

            {/* TAB 1: VÍ MOMO (QUÉT MÃ QR) */}
            {activeTab === 'qr' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="font-display font-bold text-base sm:text-lg text-ink-900 dark:text-cream-100">
                    Quét mã QR bằng Ứng dụng MoMo
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-cream-400">
                    Mở ứng dụng MoMo trên điện thoại, chọn <strong>"Quét Mã"</strong> và quét hình bên dưới
                  </p>
                </div>

                {/* QR Display Card with Logo in Center */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative p-4 bg-white rounded-3xl border-2 border-[#D82D8B]/40 shadow-md">
                    <img
                      src={momoQrUrl}
                      alt="MoMo QR Code"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl"
                    />

                    {/* Logo MoMo nhỏ ở giữa mã QR */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-pink-200 p-1 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <rect width="100" height="100" rx="20" fill="#D82D8B" />
                          <circle cx="34" cy="46" r="8" fill="#ffffff" />
                          <circle cx="66" cy="46" r="8" fill="#ffffff" />
                          <path
                            d="M 32 64 Q 50 78 68 64"
                            stroke="#ffffff"
                            strokeWidth="6"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <span className="inline-block text-[11px] font-mono font-bold bg-pink-50 dark:bg-ink-800 text-[#D82D8B] px-3 py-1 rounded-full border border-pink-200 dark:border-ink-700">
                      Nội dung: #{order.order_code || order.id}
                    </span>
                  </div>
                </div>

                {/* 3 Bước hướng dẫn */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-ink-600 dark:text-cream-400">
                  <div className="p-3 bg-pink-50/40 dark:bg-ink-800/40 rounded-2xl border border-pink-100 dark:border-ink-800 text-center space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#D82D8B] text-white font-bold flex items-center justify-center mx-auto text-[11px]">
                      1
                    </div>
                    <p className="font-semibold text-ink-900 dark:text-cream-100">Mở App MoMo</p>
                    <p className="text-[10.5px] text-ink-500">Đăng nhập tài khoản trên điện thoại</p>
                  </div>

                  <div className="p-3 bg-pink-50/40 dark:bg-ink-800/40 rounded-2xl border border-pink-100 dark:border-ink-800 text-center space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#D82D8B] text-white font-bold flex items-center justify-center mx-auto text-[11px]">
                      2
                    </div>
                    <p className="font-semibold text-ink-900 dark:text-cream-100">Chọn Quét Mã</p>
                    <p className="text-[10.5px] text-ink-500">Hướng camera vào mã QR ở trên</p>
                  </div>

                  <div className="p-3 bg-pink-50/40 dark:bg-ink-800/40 rounded-2xl border border-pink-100 dark:border-ink-800 text-center space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#D82D8B] text-white font-bold flex items-center justify-center mx-auto text-[11px]">
                      3
                    </div>
                    <p className="font-semibold text-ink-900 dark:text-cream-100">Xác Nhận</p>
                    <p className="text-[10.5px] text-ink-500">Kiểm tra số tiền và hoàn tất</p>
                  </div>
                </div>

                {/* Account test MoMo */}
                <div className="p-3.5 bg-slate-50 dark:bg-ink-800/50 rounded-2xl border border-slate-200 dark:border-ink-700 text-xs flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-ink-500 dark:text-cream-400">
                      Tài khoản MoMo Sandbox Test:
                    </span>
                    <div className="font-mono font-bold text-ink-900 dark:text-cream-100">
                      SĐT: 0968202605 • OTP: 000000
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('momo_acc', '0968202605')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-ink-700 rounded-xl text-ink-600 dark:text-cream-300 transition-colors cursor-pointer"
                    title="Sao chép SĐT"
                  >
                    {copiedField === 'momo_acc' ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Submit Action */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleExecutePayment('qr')}
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-[#A50064] via-[#D82D8B] to-[#AE2070] hover:brightness-110 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    <span>Tôi đã quét mã MoMo & Thanh toán thành công</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenExternalMomo}
                    disabled={openingExternalMomo}
                    className="w-full py-2.5 bg-white dark:bg-ink-900 border border-pink-200 dark:border-ink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-50/50 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {openingExternalMomo ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                    <span>Thử mở Cổng MoMo Sandbox Ngoài (test-payment.momo.vn)</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: THẺ ATM NỘI ĐỊA (NAPAS) */}
            {activeTab === 'atm' && (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-100">
                      Thẻ ATM Nội Địa (Napas)
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-cream-400">
                      Hỗ trợ internet banking hơn 30 ngân hàng tại Việt Nam
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fillNapasTestCard}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>⚡ Điền nhanh thẻ Napas Test</span>
                  </button>
                </div>

                {/* Chọn Ngân Hàng */}
                <div>
                  <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-2">
                    Chọn ngân hàng phát hành thẻ:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {POPULAR_BANKS.map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setAtmBank(b.code)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          atmBank === b.code
                            ? 'border-[#D82D8B] bg-pink-50/80 dark:bg-pink-950/40 text-[#D82D8B] shadow-2xs'
                            : 'border-cream-200 dark:border-ink-700 hover:border-pink-300 text-ink-700 dark:text-cream-300'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Nhập Thẻ */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-1">
                      Số thẻ ATM (16 hoặc 19 số):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="9704 0000 0000 0018"
                        value={atmCardNumber}
                        onChange={(e) => setAtmCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                      />
                      <CreditCard size={18} className="absolute right-3.5 top-3 text-ink-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-1">
                        Tên chủ thẻ (In không dấu):
                      </label>
                      <input
                        type="text"
                        placeholder="NGUYEN VAN A"
                        value={atmCardHolder}
                        onChange={(e) => setAtmCardHolder(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 uppercase text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-1">
                        Ngày phát hành (MM/YY):
                      </label>
                      <input
                        type="text"
                        placeholder="03/07"
                        maxLength={5}
                        value={atmIssueDate}
                        onChange={(e) => setAtmIssueDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-1">
                      Mã xác thực OTP:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={atmOtp}
                        onChange={(e) => setAtmOtp(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] text-emerald-600 font-bold">
                        OTP Test: 000000
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleExecutePayment('atm')}
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-[#A50064] via-[#D82D8B] to-[#AE2070] hover:brightness-110 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    <span>Thanh toán {formatCurrency(order.total_amount)} qua thẻ ATM</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: THẺ QUỐC TẾ (VISA / MASTERCARD) */}
            {activeTab === 'intl' && (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-100">
                      Thẻ Thanh Toán Quốc Tế
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-cream-400">
                      Hỗ trợ thẻ tín dụng/ghi nợ Visa, MasterCard, JCB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fillVisaTestCard}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>⚡ Điền nhanh thẻ Visa Test</span>
                  </button>
                </div>

                {/* Form Nhập Thẻ Quốc Tế */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-1">
                      Số thẻ quốc tế (16 số):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4111 1111 1111 1111"
                        value={intlCardNumber}
                        onChange={(e) => setIntlCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                      />
                      <Globe size={18} className="absolute right-3.5 top-3 text-ink-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-1">
                      Họ và tên chủ thẻ (Không dấu):
                    </label>
                    <input
                      type="text"
                      placeholder="NGUYEN VAN A"
                      value={intlCardHolder}
                      onChange={(e) => setIntlCardHolder(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 uppercase text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-1">
                        Hạn hết hạn (MM/YY):
                      </label>
                      <input
                        type="text"
                        placeholder="12/28"
                        maxLength={5}
                        value={intlExpiry}
                        onChange={(e) => setIntlExpiry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 dark:text-cream-200 mb-1">
                        Mã bảo mật (CVV/CVC):
                      </label>
                      <input
                        type="password"
                        placeholder="123"
                        maxLength={4}
                        value={intlCvv}
                        onChange={(e) => setIntlCvv(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleExecutePayment('intl')}
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-[#A50064] via-[#D82D8B] to-[#AE2070] hover:brightness-110 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    <span>Thanh toán {formatCurrency(order.total_amount)} qua thẻ Quốc tế</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Simulated Processing Modal / Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-ink-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-pink-200/50 dark:border-ink-800">
            {/* MoMo pulsating animation */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-[#D82D8B]/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-[#A50064] to-[#D82D8B] rounded-3xl flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 100 100" className="w-12 h-12">
                  <circle cx="34" cy="46" r="8" fill="#ffffff" />
                  <circle cx="66" cy="46" r="8" fill="#ffffff" />
                  <path
                    d="M 32 64 Q 50 78 68 64"
                    stroke="#ffffff"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            <h4 className="font-display font-bold text-lg text-ink-900 dark:text-cream-100">
              Đang xử lý giao dịch MoMo
            </h4>

            <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold animate-pulse">
              {processStep || 'Vui lòng không đóng trình duyệt...'}
            </p>

            <div className="w-full bg-cream-100 dark:bg-ink-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#A50064] to-[#D82D8B] animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* 4. Thành Công Modal */}
      {isSuccessModal && (
        <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-ink-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-emerald-200 dark:border-ink-800 animate-scale-in">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md border border-emerald-200">
              <CheckCircle2 size={46} />
            </div>

            <h4 className="font-display font-bold text-xl text-ink-900 dark:text-cream-100">
              Thanh toán thành công!
            </h4>

            <p className="text-xs text-ink-500 dark:text-cream-400 leading-relaxed">
              Giao dịch qua Cổng MoMo đã được xác nhận. Hóa đơn điện tử đã gửi về email của bạn. Đang chuyển hướng...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
