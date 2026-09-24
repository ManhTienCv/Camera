import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Truck,
  Shield,
  Headphones,
  CreditCard,
  Camera,
  Aperture,
  Video,
  Circle,
  Package,
  Flame,
  Ticket,
  Copy,
  Check,
  Clock,
  Sparkles,
  Star,
  ShieldCheck,
  Zap,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react';
import type { Page, Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { useToast } from '../context/ToastContext';

interface Props {
  onNavigate: (page: Page) => void;
  categories: Category[];
}

const iconMap: Record<string, typeof Camera> = {
  Camera,
  Aperture,
  Video,
  Circle,
  Package,
};

const HOT_SEARCH_TAGS = [
  'Sony A7 IV',
  'Fujifilm X-T5',
  'Canon EOS R6 II',
  'DJI Mini 4 Pro',
  'Lens Sigma Art',
  'Tamron 28-75mm',
];

const BRANDS_SHOWCASE = [
  {
    id: 'sony',
    name: 'Sony',
    subtitle: 'Alpha Full-Frame & Cinema',
    badge: 'Bán chạy #1',
    logo: 'SONY',
    accentColor: 'border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'canon',
    name: 'Canon',
    subtitle: 'Hệ sinh thái EOS R & RF Lenses',
    badge: 'Huyền thoại',
    logo: 'Canon',
    accentColor: 'border-red-500/20 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
  },
  {
    id: 'fujifilm',
    name: 'Fujifilm',
    subtitle: 'Chất màu Film cổ điển độc bản',
    badge: 'Yêu thích nhất',
    logo: 'FUJIFILM',
    accentColor: 'border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'nikon',
    name: 'Nikon',
    subtitle: 'Ngàm Z sắc nét & bền bỉ vượt trội',
    badge: 'Chuyên nghiệp',
    logo: 'Nikon',
    accentColor: 'border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'dji',
    name: 'DJI',
    subtitle: 'Flycam & Gimbal Ronin công nghệ cao',
    badge: 'Top công nghệ',
    logo: 'DJI',
    accentColor: 'border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'sigma',
    name: 'Sigma',
    subtitle: 'Ống kính Art Series siêu quang học',
    badge: 'Độ nét tối đa',
    logo: 'SIGMA',
    accentColor: 'border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400',
  },
];

const DEFAULT_VOUCHERS = [
  {
    id: 991,
    code: 'CAMERAHUB50K',
    name: 'Ưu đãi Khách hàng mới',
    description: 'Giảm ngay 50.000đ cho đơn hàng máy ảnh & phụ kiện đầu tiên',
    discount_type: 'fixed' as const,
    discount_value: 50000,
    min_order_amount: 500000,
  },
  {
    id: 992,
    code: 'PROLENS10',
    name: 'Sắm Ống Kính Chuyên Nghiệp',
    description: 'Giảm 10% (Tối đa 500.000đ) khi mua kèm combo Body & Lens',
    discount_type: 'percent' as const,
    discount_value: 10,
    min_order_amount: 5000000,
  },
  {
    id: 993,
    code: 'FREESHIPALL',
    name: 'Miễn Phí Vận Chuyển Toàn Quốc',
    description: 'Freeship hỏa tốc an toàn cho tất cả đơn hàng từ 2.000.000đ',
    discount_type: 'fixed' as const,
    discount_value: 30000,
    min_order_amount: 2000000,
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Nguyễn Tuấn Anh',
    role: 'Nhiếp ảnh gia Cưới & Sự kiện (Wedding Pro)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    product: 'Sony Alpha A7 IV Body',
    rating: 5,
    comment:
      'Máy fullbox nguyên seal chính hãng, kích hoạt bảo hành điện tử Sony Việt Nam ngay sau 10 phút nhận hàng. Đóng gói 3 lớp xốp khí chống sốc rất chu đáo!',
    verified: true,
  },
  {
    id: 2,
    name: 'Lê Minh Khoa',
    role: 'Street Photographer & Creator',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    product: 'Fujifilm X-T5 + Lens XF 33mm f/1.4',
    rating: 5,
    comment:
      'Màu film của Fuji kết hợp ống 33mm cho bokeh mịn màng. Cửa hàng tư vấn rất có tâm, hỗ trợ trả góp 0% nhanh chóng không rườm rà.',
    verified: true,
  },
  {
    id: 3,
    name: 'Trần Hoàng Long',
    role: 'Travel Vlogger & Droner',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    product: 'DJI Mini 4 Pro Fly More Combo Plus',
    rating: 5,
    comment:
      'Giao hỏa tốc 2 tiếng nhận ngay tại nội thành. Flycam kháng gió tốt, cảm biến đa hướng an toàn tuyệt đối cho anh em hay quay phong cảnh.',
    verified: true,
  },
];

export function HomePage({ onNavigate, categories }: Props) {
  const toast = useToast();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Flash Sale Live Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 8, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [feat, news, best, vList] = await Promise.all([
          api.getFeaturedProducts('featured'),
          api.getFeaturedProducts('new'),
          api.getBestSellers(4),
          api.getAvailableVouchers().catch(() => []),
        ]);
        setFeatured(feat || []);
        setNewProducts(news || []);
        setBestSellers(best || []);
        setVouchers(vList && vList.length > 0 ? vList : DEFAULT_VOUCHERS);
      } catch (e) {
        console.error('Error fetching home products:', e);
        setVouchers(DEFAULT_VOUCHERS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCopyVoucher = async (code: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedCode(code);
      toast.success(`Đã sao chép mã "${code}"! Dán mã này tại bước thanh toán để nhận giảm giá.`);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      toast.error('Không thể sao chép mã tự động');
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200 dark:from-[#191916] dark:via-[#141411] dark:to-[#171714] border-b border-cream-200/60 dark:border-ink-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800/60 text-accent-700 dark:text-accent-400 text-xs font-bold tracking-wide">
                <Sparkles size={14} className="animate-pulse" />
                <span>HỆ THỐNG MÁY ẢNH & THIẾT BỊ QUANG HỌC CHÍNH HÃNG</span>
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-ink-900 dark:text-cream-50 leading-[1.15] tracking-tight">
                Bắt trọn khoảnh khắc <br />
                <span className="text-accent-500 underline decoration-accent-500/20 underline-offset-8">
                  Tạo nên kiệt tác
                </span>
              </h1>

              <p className="text-base sm:text-lg text-ink-600 dark:text-cream-200/80 leading-relaxed max-w-xl">
                Khám phá bộ sưu tập máy ảnh Mirrorless, Ống kính & Phụ kiện cao cấp từ Sony, Canon, Fujifilm, Nikon, DJI. Cam kết 100% chính hãng, bảo hành 24 tháng, hỗ trợ trả góp 0%.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'catalog' })}
                  className="btn-primary px-6 py-3 text-sm font-semibold rounded-2xl shadow-sm"
                >
                  Khám phá bộ sưu tập
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'catalog', categorySlug: 'may-anh-mirrorless' })}
                  className="btn-secondary px-6 py-3 text-sm font-semibold rounded-2xl"
                >
                  Máy ảnh Mirrorless
                </button>
              </div>

              {/* Hot Search Tags */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-ink-400 dark:text-ink-400 uppercase tracking-wider mr-1">
                  Tìm kiếm hot:
                </span>
                {HOT_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onNavigate({ name: 'search', query: tag })}
                    className="px-3 py-1 bg-white/80 dark:bg-ink-800/80 hover:bg-white dark:hover:bg-ink-700 text-ink-700 dark:text-cream-200 hover:text-accent-500 text-xs font-medium rounded-full border border-cream-200 dark:border-ink-700 transition-all shadow-2xs hover:scale-105 active:scale-95"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 relative animate-fade-in">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-cream-200/80 dark:border-ink-700 group">
                <img
                  src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000"
                  alt="Máy ảnh chuyên nghiệp CameraHub"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />

                {/* Floating Badge Top-Right */}
                <div className="absolute top-4 right-4 backdrop-blur-md bg-white/90 dark:bg-ink-900/90 border border-white/40 dark:border-ink-700 px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    <Star size={13} className="fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-ink-900 dark:text-cream-50 leading-tight">4.9 / 5.0</p>
                    <p className="text-2xs text-ink-500 dark:text-ink-400">2.500+ nhiếp ảnh gia</p>
                  </div>
                </div>

                {/* Floating Badge Bottom-Left */}
                <div className="absolute bottom-4 left-4 right-4 backdrop-blur-md bg-white/90 dark:bg-ink-900/90 border border-white/40 dark:border-ink-700 p-3 rounded-2xl shadow-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent-500 text-white flex items-center justify-center font-bold">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-ink-900 dark:text-cream-50">Ưu đãi quà tặng hôm nay</p>
                      <p className="text-2xs text-ink-500 dark:text-ink-400">Tặng kèm thẻ nhớ 128GB Pro & Túi chống sốc</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate({ name: 'catalog' })}
                    className="p-1.5 bg-cream-100 dark:bg-ink-800 rounded-xl hover:bg-accent-500 hover:text-white transition-colors"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES / TRUST BAR */}
      <section className="bg-white dark:bg-ink-900 border-y border-cream-200 dark:border-ink-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                title: 'Miễn phí vận chuyển',
                desc: 'Đơn từ 5tr giao nhanh toàn quốc',
                color: 'text-amber-500',
              },
              {
                icon: Shield,
                title: 'Bảo hành chính hãng',
                desc: '24 tháng, 1 đổi 1 trong 30 ngày',
                color: 'text-emerald-500',
              },
              {
                icon: Headphones,
                title: 'Hỗ trợ kỹ thuật 24/7',
                desc: 'Tư vấn lens & setup máy ảnh',
                color: 'text-blue-500',
              },
              {
                icon: CreditCard,
                title: 'Thanh toán linh hoạt',
                desc: 'VietQR / MoMo / Trả góp 0%',
                color: 'text-purple-500',
              },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-cream-100 dark:bg-ink-800 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <f.icon size={20} className={f.color} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink-800 dark:text-cream-100">{f.title}</p>
                  <p className="text-xs text-ink-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BRAND SPOTLIGHT (THƯƠNG HIỆU HÀNG ĐẦU) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream-100 dark:bg-ink-800 text-ink-600 dark:text-cream-200 rounded-full text-xs font-bold mb-2">
              <Camera size={13} className="text-accent-500" />
              <span>Chính Hãng Phân Phối</span>
            </div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50">
              Thương hiệu nhiếp ảnh hàng đầu
            </h2>
            <p className="text-sm text-ink-400 mt-1">Lọc nhanh máy ảnh và thiết bị quang học theo hãng yêu thích</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-accent-500 hover:gap-2 transition-all"
          >
            Tất cả thương hiệu <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {BRANDS_SHOWCASE.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => onNavigate({ name: 'catalog', brand: brand.name })}
              className={`p-4 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col items-center justify-between ${brand.accentColor}`}
            >
              <span className="text-2xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-ink-900 shadow-2xs mb-2">
                {brand.badge}
              </span>
              <p className="font-display font-extrabold text-xl tracking-tight my-1 text-ink-900 dark:text-cream-50">
                {brand.logo}
              </p>
              <p className="text-2xs text-ink-500 dark:text-ink-400 line-clamp-1 mt-1">
                {brand.subtitle}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 4. KHO VOUCHER & MÃ GIẢM GIÁ ĐỘC QUYỀN (1-CLICK COPY) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-cream-100 via-white to-cream-100 dark:from-ink-900 dark:via-ink-900/90 dark:to-ink-900 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 rounded-full text-xs font-bold mb-1.5 border border-accent-200 dark:border-accent-800/60">
                <Ticket size={13} />
                <span>Kho Mã Giảm Giá Độc Quyền</span>
              </div>
              <h3 className="font-display font-bold text-xl lg:text-2xl text-ink-900 dark:text-cream-50">
                Lấy mã ưu đãi ngay - Tiết kiệm tối đa khi chốt đơn
              </h3>
              <p className="text-xs text-ink-400 mt-0.5">Bấm sao chép và dán trực tiếp vào ô Giảm giá tại trang Thanh toán</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'catalog' })}
              className="self-start sm:self-auto text-xs font-semibold text-accent-500 hover:underline flex items-center gap-1"
            >
              Xem điều kiện áp dụng <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vouchers.slice(0, 3).map((v) => {
              const isCopied = copiedCode === v.code;
              return (
                <div
                  key={v.id}
                  className="relative flex items-center bg-white dark:bg-ink-800/90 rounded-2xl border border-cream-200 dark:border-ink-700 overflow-hidden shadow-2xs group hover:border-accent-400 transition-colors"
                >
                  {/* Left coupon stub */}
                  <div className="w-24 bg-gradient-to-br from-accent-500 to-accent-600 text-white p-3 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-2xs uppercase tracking-wider font-bold opacity-80">ƯU ĐÃI</span>
                    <span className="font-display font-bold text-base mt-0.5">
                      {v.discount_type === 'percent'
                        ? `${v.discount_value}%`
                        : formatPrice(v.discount_value).replace('₫', '')}
                    </span>
                    <span className="text-2xs font-semibold opacity-90">GIẢM</span>
                  </div>

                  {/* Dotted separator */}
                  <div className="w-px h-full border-r-2 border-dashed border-cream-200 dark:border-ink-700 shrink-0" />

                  {/* Right coupon content */}
                  <div className="p-3.5 flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-ink-900 dark:text-cream-100 tracking-wider">
                          {v.code}
                        </span>
                        <span className="text-3xs px-1.5 py-0.5 rounded bg-cream-100 dark:bg-ink-700 text-ink-500 dark:text-ink-300 font-semibold">
                          {v.min_order_amount > 0 ? `Đơn từ ${formatPrice(v.min_order_amount)}` : 'Mọi đơn hàng'}
                        </span>
                      </div>
                      <p className="text-2xs text-ink-500 dark:text-ink-400 line-clamp-2 mt-1">
                        {v.description || v.name}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-cream-100 dark:border-ink-700/60 flex items-center justify-between">
                      <span className="text-3xs text-ink-400">Số lượng có hạn</span>
                      <button
                        type="button"
                        onClick={() => handleCopyVoucher(v.code)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          isCopied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 hover:bg-accent-500 hover:text-white'
                        }`}
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        {isCopied ? 'Đã sao chép' : 'Sao chép mã'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. FLASH SALE / GIỜ VÀNG SĂN DEAL (COUNTDOWN TIMER) */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 dark:via-ink-900 dark:to-ink-900 p-6 sm:p-8 rounded-3xl border border-amber-200 dark:border-amber-900/40 space-y-6">
            {/* Header with live ticking countdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 dark:border-amber-900/40 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow-xs">
                  <Zap size={14} className="fill-white" />
                  <span>FLASH DEAL GIÁ SỐC</span>
                </div>
                <h3 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50">
                  Giờ Vàng Nhiếp Ảnh Trong Ngày
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Thiết bị máy ảnh & ống kính giá tốt nhất hôm nay, cam kết chính hãng full VAT
                </p>
              </div>

              {/* Countdown Ticker */}
              <div className="flex items-center gap-2 bg-white dark:bg-ink-800 px-4 py-2.5 rounded-2xl border border-amber-300 dark:border-amber-800/80 shadow-xs shrink-0">
                <Clock size={16} className="text-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-ink-600 dark:text-cream-200 mr-1">Kết thúc sau:</span>
                <div className="flex items-center gap-1 text-xs font-mono font-extrabold">
                  <span className="px-2 py-1 bg-ink-900 text-white rounded-lg">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="px-2 py-1 bg-ink-900 text-white rounded-lg">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="px-2 py-1 bg-accent-500 text-white rounded-lg">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Flash Deal Products */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {bestSellers.map((p, idx) => (
                <div key={p.id} className="relative flex flex-col">
                  <ProductCard
                    product={p}
                    onView={(slug) => onNavigate({ name: 'product', slug })}
                  />
                  {/* Progress stock bar */}
                  <div className="mt-2 px-1">
                    <div className="flex items-center justify-between text-2xs text-ink-500 dark:text-ink-400 font-semibold mb-1">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Flame size={12} className="fill-amber-500" />
                        Đang bán chạy
                      </span>
                      <span>Đã bán {14 + (idx * 2)}/25</span>
                    </div>
                    <div className="w-full h-1.5 bg-cream-200 dark:bg-ink-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                        style={{ width: `${Math.min(95, 60 + idx * 10)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50 mb-2">
              Danh mục sản phẩm
            </h2>
            <p className="text-ink-400">Khám phá theo từng chủng loại thiết bị chuyên dụng</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:gap-2.5 transition-all"
          >
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon || 'Camera'] || Camera;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigate({ name: 'catalog', categorySlug: cat.slug })}
                className="group card p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="w-14 h-14 mx-auto bg-cream-100 dark:bg-ink-800 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-accent-500 transition-colors duration-300 shadow-2xs">
                  <Icon
                    size={24}
                    className="text-ink-700 dark:text-cream-200 group-hover:text-white transition-colors"
                  />
                </div>
                <p className="font-display font-semibold text-sm text-ink-800 dark:text-cream-100">
                  {cat.name}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50 mb-2">
              Sản phẩm nổi bật
            </h2>
            <p className="text-ink-400">Được đánh giá cao nhất bởi các chuyên gia & khách hàng</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:gap-2.5 transition-all"
          >
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="aspect-square bg-cream-200 dark:bg-ink-800 rounded-xl mb-4" />
                <div className="h-3 bg-cream-200 dark:bg-ink-800 rounded mb-2" />
                <div className="h-3 bg-cream-200 dark:bg-ink-800 rounded w-2/3 mb-4" />
                <div className="h-4 bg-cream-200 dark:bg-ink-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {featured.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onView={(slug) => onNavigate({ name: 'product', slug })}
              />
            ))}
          </div>
        )}
      </section>

      {/* 8. PROMO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative overflow-hidden bg-ink-900 rounded-3xl shadow-xl">
          <div className="absolute inset-0 opacity-25">
            <img
              src="https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000"
              alt="Promo Banner"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative px-8 py-16 lg:px-16 lg:py-20 text-center max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-accent-500 text-white text-xs font-semibold rounded-full mb-4 shadow-xs">
              ƯU ĐÃI KHỦNG THÁNG 8
            </span>
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-cream-50 mb-4 leading-tight">
              Giảm đến 15% cho Máy ảnh & Ống kính Sony, Canon
            </h2>
            <p className="text-cream-200 mb-8 leading-relaxed">
              Cơ hội sở hữu máy ảnh chuyên nghiệp giá cực ưu đãi cùng gói quà tặng phụ kiện trị giá 1.500.000đ!
            </p>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'catalog', categorySlug: 'may-anh-mirrorless' })}
              className="btn-accent px-8 py-3.5 text-sm font-semibold rounded-2xl shadow-md"
            >
              Mua ngay hôm nay
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 9. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50 mb-2">
              Hàng mới về
            </h2>
            <p className="text-ink-400">Các siêu phẩm công nghệ vừa cập bến showroom CameraHub</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:gap-2.5 transition-all"
          >
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="aspect-square bg-cream-200 dark:bg-ink-800 rounded-xl mb-4" />
                <div className="h-3 bg-cream-200 dark:bg-ink-800 rounded mb-2" />
                <div className="h-3 bg-cream-200 dark:bg-ink-800 rounded w-2/3 mb-4" />
                <div className="h-4 bg-cream-200 dark:bg-ink-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {newProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onView={(slug) => onNavigate({ name: 'product', slug })}
              />
            ))}
          </div>
        )}
      </section>

      {/* 10. SOCIAL PROOF / COMMUNITY REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-cream-100/70 dark:bg-ink-900 p-8 sm:p-12 rounded-3xl border border-cream-200 dark:border-ink-800 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-ink-800 text-ink-700 dark:text-cream-200 rounded-full text-xs font-bold shadow-2xs">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>100% Đánh Giá Xác Thực</span>
            </div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50">
              Đồng hành cùng cộng đồng Nhiếp ảnh gia
            </h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Lắng nghe cảm nhận thực tế từ những người cầm máy chuyên nghiệp đã tin tưởng lựa chọn CameraHub
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-ink-800 p-6 rounded-2xl border border-cream-200/80 dark:border-ink-700 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Stars */}
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} size={15} className="fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-ink-700 dark:text-cream-200 leading-relaxed italic">
                    "{t.comment}"
                  </p>
                </div>

                <div className="pt-4 border-t border-cream-100 dark:border-ink-700/60 flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-cream-200 dark:border-ink-600 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-xs text-ink-900 dark:text-cream-100 truncate">
                        {t.name}
                      </p>
                      <BadgeCheck size={14} className="text-accent-500 shrink-0" />
                    </div>
                    <p className="text-3xs text-ink-400 truncate">{t.role}</p>
                    <p className="text-3xs font-semibold text-accent-500 truncate mt-0.5">
                      Đã mua: {t.product}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
