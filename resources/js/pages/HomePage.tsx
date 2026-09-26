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
  Star,
  ShieldCheck,
  ChevronRight,
  BadgeCheck,
  Sparkles,
  ArrowLeftRight,
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
    code: 'FREESHIP30K',
    name: 'Miễn Phí Vận Chuyển',
    description: 'Giảm 30.000đ phí ship cho đơn từ 300.000đ',
    discount_type: 'fixed' as const,
    discount_value: 30000,
    min_order_amount: 300000,
  },
  {
    id: 992,
    code: 'WELCOME50K',
    name: 'Khách hàng mới',
    description: 'Giảm ngay 50.000đ cho đơn hàng từ 500.000đ',
    discount_type: 'fixed' as const,
    discount_value: 50000,
    min_order_amount: 500000,
  },
  {
    id: 993,
    code: 'CAMERAHUB100K',
    name: 'Ưu đãi Đặc quyền',
    description: 'Giảm ngay 100.000đ cho đơn hàng từ 2.000.000đ',
    discount_type: 'fixed' as const,
    discount_value: 100000,
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
    <div className="animate-fade-in">
      {/* 1. Hero (Nguyên bản gốc sạch đẹp) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200 dark:from-[#191916] dark:via-[#141411] dark:to-[#171714] border-b border-cream-200/60 dark:border-ink-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h1 className="font-display font-bold text-4xl lg:text-6xl text-ink-900 dark:text-cream-50 leading-tight mb-6">
                Bắt trọn khoảnh khắc<br />
                <span className="text-accent-500">Tạo nên nghệ thuật</span>
              </h1>
              <p className="text-lg text-ink-500 dark:text-cream-200/80 leading-relaxed mb-8 max-w-lg">
                Khám phá bộ sưu tập máy ảnh, ống kính và phụ kiện chuyên nghiệp từ các thương hiệu
                hàng đầu thế giới. Canon, Nikon, Sony, Fujifilm, DJI và hơn thế nữa.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'catalog' })}
                  className="btn-primary"
                >
                  Khám phá sản phẩm
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('camerahub_open_selector'))}
                  className="btn-secondary group flex items-center gap-2 border-accent-300 dark:border-accent-700/60 hover:border-accent-500 text-accent-700 dark:text-accent-300 shadow-2xs hover:scale-102 transition-all"
                >
                  <Sparkles size={16} className="text-accent-500 animate-pulse" />
                  <span>Tư vấn chọn máy (60s)</span>
                </button>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl dark:border dark:border-ink-800">
                <img
                  src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000"
                  alt="Máy ảnh chuyên nghiệp"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features bar (Nguyên bản) */}
      <section className="bg-white dark:bg-ink-900 border-y border-ink-100 dark:border-ink-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng toàn quốc' },
              { icon: Shield, title: 'Bảo hành chính hãng', desc: 'Lên đến 24 tháng' },
              { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Tư vấn chuyên nghiệp' },
              { icon: CreditCard, title: 'Thanh toán linh hoạt', desc: 'VNPAY / MoMo / COD' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-cream-100 dark:bg-ink-800 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                  <f.icon size={20} className="text-ink-700 dark:text-cream-200" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink-800 dark:text-cream-100">{f.title}</p>
                  <p className="text-xs text-ink-400 dark:text-ink-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2.5 CÔNG CỤ CHUYÊN BIỆT NGÀNH MÁY ẢNH: TƯ VẤN AI, SO SÁNH THÔNG SỐ & BẢO HÀNH ĐIỆN TỬ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Trợ lý AI Tư vấn */}
          <div
            onClick={() => window.dispatchEvent(new Event('camerahub_open_selector'))}
            className="p-6 rounded-3xl bg-gradient-to-br from-accent-500/10 via-accent-500/5 to-transparent dark:from-accent-500/15 dark:via-accent-950/20 dark:to-transparent border border-accent-300/60 dark:border-accent-800/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800">
                  AI Finder 60s
                </span>
              </div>
              <h3 className="font-display font-extrabold text-lg text-ink-900 dark:text-cream-50 group-hover:text-accent-500 transition-colors">
                Trợ lý Tư vấn Chọn máy ảnh
              </h3>
              <p className="text-xs text-ink-500 dark:text-cream-400 mt-2 leading-relaxed">
                Chưa biết chọn body hay lens nào? Trả lời 4 câu hỏi nhanh để tìm combo hoàn hảo cho ngân sách và nhu cầu của bạn.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 group-hover:gap-2.5 transition-all">
              <span>Bắt đầu làm bài test</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 2: So sánh thông số */}
          <div
            onClick={() => onNavigate({ name: 'compare' })}
            className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/15 dark:via-blue-950/20 dark:to-transparent border border-blue-200 dark:border-blue-900/60 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ArrowLeftRight size={22} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  So sánh 1:1
                </span>
              </div>
              <h3 className="font-display font-extrabold text-lg text-ink-900 dark:text-cream-50 group-hover:text-blue-500 transition-colors">
                So sánh Thông số Chuyên sâu
              </h3>
              <p className="text-xs text-ink-500 dark:text-cream-400 mt-2 leading-relaxed">
                Đặt 2–4 máy ảnh cạnh nhau: đối chiếu cảm biến Full-Frame vs APS-C, chống rung IBIS, quay 4K 10-bit và hệ thống lấy nét AI.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all">
              <span>Mở bảng đối chiếu</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 3: Tra cứu bảo hành điện tử */}
          <div
            onClick={() => onNavigate({ name: 'warranty' })}
            className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-emerald-950/20 dark:to-transparent border border-emerald-200 dark:border-emerald-900/60 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ShieldCheck size={22} />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  CameraHub Care
                </span>
              </div>
              <h3 className="font-display font-extrabold text-lg text-ink-900 dark:text-cream-50 group-hover:text-emerald-500 transition-colors">
                Tra cứu Bảo hành & Serial
              </h3>
              <p className="text-xs text-ink-500 dark:text-cream-400 mt-2 leading-relaxed">
                Nhập số Serial hoặc Mã đơn hàng để kiểm tra thời hạn bảo hành 24 tháng chính hãng, tình trạng thiết bị và nhật ký kiểm định.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all">
              <span>Tra cứu trực tuyến</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* 3. THƯƠNG HIỆU NHIẾP ẢNH HÀNG ĐẦU (GIỮ LẠI THEO ẢNH CHỤP CỦA BẠN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-accent-500 hover:gap-2 transition-all cursor-pointer"
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

      {/* 4. KHO MÃ GIẢM GIÁ ĐỘC QUYỀN (GIỮ LẠI THEO ẢNH CHỤP CỦA BẠN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-gradient-to-r from-cream-100 via-white to-cream-100 dark:from-ink-900 dark:via-ink-900/90 dark:to-ink-900 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 rounded-full text-xs font-bold mb-1.5 border border-accent-200 dark:border-accent-800/60">
                <Ticket size={13} />
                <span>Kho Mã Giảm Giá Độc Quyền</span>
              </div>
              <h3 className="font-display font-bold text-xl lg:text-2xl text-ink-900 dark:text-cream-50">
                Lấy mã ưu đãi ngay – Tiết kiệm tối đa khi chốt đơn
              </h3>
              <p className="text-xs text-ink-400 mt-0.5">Bấm sao chép và dán trực tiếp vào ô Giảm giá tại trang Thanh toán</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'catalog' })}
              className="self-start sm:self-auto text-xs font-semibold text-accent-500 hover:underline flex items-center gap-1 cursor-pointer"
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
                    <span className="font-display font-bold text-sm mt-0.5">
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
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

      {/* 5. Categories (Nguyên bản) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50 mb-2">
              Danh mục nổi bật
            </h2>
            <p className="text-ink-400 dark:text-ink-400">Khám phá theo loại sản phẩm</p>
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
                className="group card p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto bg-cream-100 dark:bg-ink-800 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-accent-500 transition-colors duration-300">
                  <Icon size={24} className="text-ink-700 dark:text-cream-200 group-hover:text-white transition-colors" />
                </div>
                <p className="font-display font-semibold text-sm text-ink-800 dark:text-cream-100">{cat.name}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Featured Products (Nguyên bản) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50 mb-2">
              Sản phẩm nổi bật
            </h2>
            <p className="text-ink-400 dark:text-ink-400">Được đánh giá cao nhất bởi khách hàng</p>
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
              <ProductCard key={p.id} product={p} onView={(slug) => onNavigate({ name: 'product', slug })} />
            ))}
          </div>
        )}
      </section>

      {/* 7. Best Sellers Section (Nguyên bản) */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold mb-2 border border-amber-200 dark:border-amber-800/60">
                <Flame size={13} className="text-amber-500 fill-amber-500" />
                <span>Bán Chạy Nhất Tuần Qua</span>
              </div>
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50 mb-2">
                Top máy ảnh & thiết bị bán chạy
              </h2>
              <p className="text-ink-400 dark:text-ink-400">Được đông đảo nhiếp ảnh gia và nhà sáng tạo nội dung tin dùng</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'catalog' })}
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:gap-2.5 transition-all"
            >
              Xem tất cả <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} onView={(slug) => onNavigate({ name: 'product', slug })} />
            ))}
          </div>
        </section>
      )}

      {/* 8. Promo Banner (Nguyên bản) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden bg-ink-900 rounded-3xl">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative px-8 py-16 lg:px-16 lg:py-20 text-center max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-accent-500 text-white text-xs font-semibold rounded-full mb-4">
              ƯU ĐÃI ĐẶC BIỆT
            </span>
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-cream-50 mb-4">
              Giảm đến 15% cho Máy ảnh & Ống kính Sony, Canon
            </h2>
            <p className="text-cream-200 mb-8">
              Cơ hội sở hữu máy ảnh chuyên nghiệp giá cực ưu đãi. Số lượng quà tặng có hạn!
            </p>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'catalog', categorySlug: 'may-anh-mirrorless' })}
              className="btn-accent"
            >
              Mua ngay
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 9. New Arrivals (Nguyên bản) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 dark:text-cream-50 mb-2">
              Hàng mới về
            </h2>
            <p className="text-ink-400 dark:text-ink-400">Các sản phẩm vừa được ra mắt</p>
          </div>
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
              <ProductCard key={p.id} product={p} onView={(slug) => onNavigate({ name: 'product', slug })} />
            ))}
          </div>
        )}
      </section>

      {/* 10. ĐỒNG HÀNH CÙNG CỘNG ĐỒNG NHIẾP ẢNH GIA (GIỮ LẠI THEO ẢNH CHỤP CỦA BẠN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
