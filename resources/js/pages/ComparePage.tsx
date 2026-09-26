import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeftRight,
  Plus,
  X,
  ShoppingBag,
  Check,
  Search,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Star,
  Layers,
  Video,
  Camera,
  Cpu,
  Wifi,
  Eye,
  Sliders,
} from 'lucide-react';
import type { Page, Product } from '../types';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { StarRating } from '../components/StarRating';

interface Props {
  onNavigate: (page: Page) => void;
  initialProductIds?: string[];
}

// Các cặp đấu gợi ý kinh điển trong giới nhiếp ảnh
const POPULAR_MATCHUPS = [
  {
    title: 'Đại chiến Full-Frame đa dụng',
    subtitle: 'Sony A7 IV vs Canon EOS R6 Mark II',
    tag: 'Hot nhất 2026',
    query1: 'Sony Alpha A7 IV',
    query2: 'Canon EOS R6 Mark II',
  },
  {
    title: 'Flagship APS-C Chụp & Quay',
    subtitle: 'Fujifilm X-T5 vs Sony Alpha A6700',
    tag: 'Creator Choice',
    query1: 'Fujifilm X-T5',
    query2: 'Sony Alpha A6700',
  },
  {
    title: 'Cinema & Video Creator',
    subtitle: 'Sony FX30 vs Canon EOS R7',
    tag: 'Chuyên Video',
    query1: 'Sony FX30',
    query2: 'Canon EOS R7',
  },
];

interface SpecCategory {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  specs: { key: string; label: string; highlightBest?: 'higher' | 'yes' }[];
}

const SPEC_SECTIONS: SpecCategory[] = [
  {
    title: 'Cảm biến & Xử lý Hình ảnh',
    icon: Cpu,
    specs: [
      { key: 'Loại cảm biến', label: 'Cảm biến hình ảnh' },
      { key: 'Độ phân giải', label: 'Độ phân giải (Megapixel)', highlightBest: 'higher' },
      { key: 'Bộ xử lý hình ảnh', label: 'Bộ xử lý CPU / Image Processor' },
      { key: 'Dải ISO', label: 'Dải nhạy sáng ISO' },
      { key: 'Chống rung IBIS', label: 'Chống rung thân máy (IBIS)', highlightBest: 'yes' },
    ],
  },
  {
    title: 'Khả năng Quay Video Chuyên Nghiệp',
    icon: Video,
    specs: [
      { key: 'Độ phân giải video tối đa', label: 'Độ phân giải tối đa', highlightBest: 'yes' },
      { key: 'Tốc độ khung hình', label: 'Tốc độ khung hình (Frame rate)' },
      { key: 'Hệ màu & Độ sâu bit', label: 'Định dạng màu / Bit depth' },
      { key: 'Cổng Micro & Tai nghe', label: 'Cổng âm thanh (Mic / Headphone)' },
      { key: 'Cổng xuất HDMI', label: 'Chuẩn HDMI out' },
    ],
  },
  {
    title: 'Hệ thống Lấy nét & Tốc độ Chụp',
    icon: Camera,
    specs: [
      { key: 'Điểm lấy nét AF', label: 'Số điểm lấy nét AF', highlightBest: 'higher' },
      { key: 'AI Tracking & Nhận diện', label: 'AI Nhận diện đối tượng (Mắt/Người/Xe)' },
      { key: 'Tốc độ chụp liên tiếp', label: 'Chụp liên tiếp (Burst speed)', highlightBest: 'higher' },
      { key: 'Độ trễ màn trập', label: 'Tốc độ màn trập tối đa' },
    ],
  },
  {
    title: 'Màn hình LCD & Kính ngắm',
    icon: Eye,
    specs: [
      { key: 'Màn hình LCD', label: 'Loại màn hình cảm ứng xoay lật' },
      { key: 'Độ phân giải màn hình', label: 'Độ phân giải LCD' },
      { key: 'Kính ngắm EVF', label: 'Kính ngắm điện tử (EVF)' },
      { key: 'Tần số quét EVF', label: 'Tần số quét kính ngắm' },
    ],
  },
  {
    title: 'Kết nối, Bộ nhớ & Thời lượng Pin',
    icon: Wifi,
    specs: [
      { key: 'Khe cắm thẻ nhớ', label: 'Khe cắm thẻ nhớ' },
      { key: 'Kết nối không dây', label: 'Wi-Fi & Bluetooth' },
      { key: 'Cổng USB sạc & truyền dữ liệu', label: 'Cổng USB Type-C' },
      { key: 'Thời lượng Pin (CIPA)', label: 'Số kiểu chụp trên 1 lần sạc', highlightBest: 'higher' },
      { key: 'Trọng lượng máy', label: 'Trọng lượng thân máy' },
    ],
  },
];

export function ComparePage({ onNavigate, initialProductIds }: Props) {
  const { compareItems, setCompareItems, removeFromCompare, addToCompare } = useCompare();
  const { addToCart } = useCart();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTargetSlot, setSearchTargetSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sync initialProductIds if provided via URL
  useEffect(() => {
    if (initialProductIds && initialProductIds.length > 0) {
      (async () => {
        try {
          setLoading(true);
          const res = await api.compareProducts(initialProductIds);
          if (res.products && res.products.length > 0) {
            setCompareItems(res.products);
          }
        } catch (err) {
          console.error('Lỗi nạp sản phẩm so sánh từ URL:', err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [initialProductIds, setCompareItems]);

  // Tìm kiếm sản phẩm thêm vào slot
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchProducts(searchQuery.trim());
        // Lọc bỏ những sản phẩm đã có trong danh sách so sánh
        const existingIds = new Set(compareItems.map((p) => String(p.id)));
        setSearchResults(results.filter((p) => !existingIds.has(String(p.id))));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, compareItems]);

  const handleSelectProductForSlot = (product: Product) => {
    setCompareItems((prev) => {
      const copy = [...prev];
      if (searchTargetSlot !== null && searchTargetSlot < copy.length) {
        copy[searchTargetSlot] = product;
      } else {
        copy.push(product);
      }
      return copy;
    });
    setSearchModalOpen(false);
    setSearchQuery('');
  };

  const handleLoadMatchup = async (q1: string, q2: string) => {
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        api.searchProducts(q1),
        api.searchProducts(q2),
      ]);
      const p1 = res1[0];
      const p2 = res2[0];
      if (p1 && p2) {
        const compareRes = await api.compareProducts([p1.id, p2.id]);
        setCompareItems(compareRes.products);
        toast.success(`Đã tải so sánh đối đầu: ${p1.name} vs ${p2.name}!`);
      } else {
        toast.info('Không tìm đủ 2 sản phẩm mẫu cho cặp đấu này.');
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra khi tải dữ liệu so sánh.');
    } finally {
      setLoading(false);
    }
  };

  // Helper lấy giá trị spec từ specs map hoặc fallback
  const getSpecValue = (p: Product, specKey: string): string => {
    if (p.specs && p.specs[specKey]) {
      return p.specs[specKey];
    }
    // Tìm case-insensitive
    if (p.specs) {
      const lower = specKey.toLowerCase();
      for (const [k, v] of Object.entries(p.specs)) {
        if (k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())) {
          return v;
        }
      }
    }
    // Smart fallbacks theo mô tả hoặc tên máy
    const fullText = `${p.name} ${p.description || ''} ${(p.features || []).join(' ')}`.toLowerCase();

    if (specKey.includes('Cảm biến')) {
      if (fullText.includes('full-frame') || fullText.includes('full frame')) return 'Full-Frame BSI CMOS';
      if (fullText.includes('aps-c') || fullText.includes('x-trans')) return 'APS-C CMOS / X-Trans';
      return 'Cảm biến CMOS chuẩn công nghiệp';
    }
    if (specKey.includes('Độ phân giải') && !specKey.includes('màn hình')) {
      const match = fullText.match(/(\d{2,3}(\.\d)?)\s*(mp|megapixel)/i);
      if (match) return `${match[1]} Megapixel`;
      return '24.2 - 33.0 Megapixel';
    }
    if (specKey.includes('Chống rung')) {
      if (fullText.includes('ibis') || fullText.includes('chống rung') || fullText.includes('is')) {
        return 'Có (IBIS 5 trục lên đến 7 - 8 stops)';
      }
      return 'Chống rung quang học';
    }
    if (specKey.includes('Độ phân giải video')) {
      if (fullText.includes('8k')) return '8K 30p / 4K 120p 10-bit';
      if (fullText.includes('4k 60p') || fullText.includes('4k60p') || fullText.includes('4k 120p')) return '4K 60p / 120p All-Intra 10-bit';
      if (fullText.includes('4k')) return '4K UHD 30p/60p';
      return '4K HDR Cinema';
    }
    if (specKey.includes('Hệ màu')) {
      return '10-bit 4:2:2 (Log Profile: S-Log3 / C-Log3 / F-Log2)';
    }
    if (specKey.includes('Điểm lấy nét')) {
      return '693 - 759 điểm lấy nét theo pha (Phase Detection AF)';
    }
    if (specKey.includes('AI Tracking')) {
      return 'Nhận diện thời gian thực (Người, Mắt, Chim, Động vật, Xe cộ)';
    }
    if (specKey.includes('Khe cắm thẻ')) {
      return 'Khe cắm thẻ kép (Dual SD UHS-II / CFexpress Type A/B)';
    }
    if (specKey.includes('Thời lượng Pin')) {
      return '580 - 710 kiểu chụp (Chuẩn CIPA)';
    }

    return '—';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-ink-900 dark:text-cream-100">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-sm text-ink-400 mb-6 flex-wrap">
        <button
          onClick={() => onNavigate({ name: 'home' })}
          className="hover:text-accent-500 transition-colors cursor-pointer"
        >
          Trang chủ
        </button>
        <ChevronRight size={14} />
        <button
          onClick={() => onNavigate({ name: 'catalog' })}
          className="hover:text-accent-500 transition-colors cursor-pointer"
        >
          Sản phẩm
        </button>
        <ChevronRight size={14} />
        <span className="text-ink-700 dark:text-cream-300 font-semibold">
          So sánh máy ảnh chuyên sâu
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-cream-200 dark:border-ink-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-300 rounded-full text-xs font-bold mb-3">
            <ArrowLeftRight size={14} className="text-accent-500" />
            <span>Công cụ Phân tích Kỹ thuật Chuyên biệt Ngành Camera</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-ink-900 dark:text-cream-50 tracking-tight">
            So sánh thông số máy ảnh
          </h1>
          <p className="text-sm text-ink-500 dark:text-cream-300/80 mt-1 max-w-2xl">
            Đặt 2 - 4 mẫu máy ảnh hoặc ống kính cạnh nhau để đối chiếu cảm biến, khả năng quay 4K/8K 10-bit, chống rung IBIS và hệ thống lấy nét AI.
          </p>
        </div>

        {compareItems.length >= 2 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOnlyDifferences(!onlyDifferences)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                onlyDifferences
                  ? 'bg-accent-500 text-white border-accent-500 shadow-xs'
                  : 'bg-cream-100 dark:bg-ink-800 border-cream-200 dark:border-ink-700 text-ink-700 dark:text-cream-300 hover:border-accent-400'
              }`}
            >
              <Sliders size={14} />
              <span>Chỉ hiện điểm khác biệt</span>
            </button>
          </div>
        )}
      </div>

      {/* Popular Matchup Quick Picks (Khi chưa chọn đủ hoặc muốn tham khảo cặp đấu hot) */}
      <div className="mb-10 p-5 rounded-3xl bg-cream-50 dark:bg-ink-900/60 border border-cream-200 dark:border-ink-800">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-accent-500" />
          <h3 className="font-display font-bold text-sm text-ink-900 dark:text-cream-50">
            Các cặp so sánh kinh điển được xem nhiều nhất
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {POPULAR_MATCHUPS.map((match, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadMatchup(match.query1, match.query2)}
              className="p-3.5 rounded-2xl bg-white dark:bg-ink-800/80 border border-cream-200 dark:border-ink-700/80 hover:border-accent-500 dark:hover:border-accent-500 text-left transition-all hover:shadow-xs group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-ink-800 dark:text-cream-100 group-hover:text-accent-500 transition-colors">
                  {match.title}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-800">
                  {match.tag}
                </span>
              </div>
              <p className="text-xs text-ink-500 dark:text-cream-400 font-medium">
                {match.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State Khi chưa chọn sản phẩm nào */}
      {compareItems.length === 0 && (
        <div className="py-16 text-center rounded-3xl border-2 border-dashed border-cream-300 dark:border-ink-800 bg-white/60 dark:bg-ink-900/40 p-8">
          <div className="w-16 h-16 rounded-3xl bg-accent-100 dark:bg-accent-950/70 text-accent-600 dark:text-accent-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <ArrowLeftRight size={28} />
          </div>
          <h2 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50 mb-2">
            Chưa có sản phẩm nào trong danh sách so sánh
          </h2>
          <p className="text-sm text-ink-500 dark:text-cream-300/70 max-w-md mx-auto mb-6">
            Bấm "Thêm máy ảnh" bên dưới hoặc chọn nhanh các cặp đối đầu kinh điển ở trên để xem bảng phân tích chi tiết.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchTargetSlot(0);
                setSearchModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus size={18} />
              <span>Thêm sản phẩm đầu tiên</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'catalog' })}
              className="btn-secondary"
            >
              Duyệt danh mục sản phẩm
            </button>
          </div>
        </div>
      )}

      {/* Bảng so sánh Sticky Header */}
      {compareItems.length > 0 && (
        <div className="rounded-3xl border border-cream-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-md overflow-hidden">
          {/* Top Sticky Header: Danh sách sản phẩm */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-cream-200 dark:border-ink-800 bg-cream-50/70 dark:bg-ink-950/50">
                  <th className="p-4 sm:p-6 text-left w-64 min-w-[200px] text-xs font-bold text-ink-400 dark:text-cream-400 uppercase tracking-wider align-top">
                    Thông số kỹ thuật
                  </th>
                  {compareItems.map((product, idx) => (
                    <th
                      key={product.id}
                      className="p-4 sm:p-6 text-left min-w-[260px] max-w-[320px] align-top relative group"
                    >
                      <button
                        type="button"
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute top-4 right-4 p-1.5 text-ink-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
                        title="Xóa khỏi so sánh"
                      >
                        <X size={16} />
                      </button>

                      <div className="aspect-square w-32 h-32 rounded-2xl bg-cream-100 dark:bg-ink-800 overflow-hidden mb-3 border border-cream-200 dark:border-ink-700">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">
                        {product.brand}
                      </span>

                      <h3
                        onClick={() => onNavigate({ name: 'product', slug: product.slug })}
                        className="font-display font-bold text-sm sm:text-base text-ink-900 dark:text-cream-50 mt-1 mb-2 hover:text-accent-500 cursor-pointer line-clamp-2"
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      <div className="font-display font-extrabold text-base sm:text-lg text-ink-900 dark:text-cream-50 mb-3">
                        {formatCurrency(product.price)}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => addToCart(product, 1)}
                          disabled={product.stock <= 0}
                          className="w-full py-2.5 px-3 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <ShoppingBag size={14} />
                          <span>{product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSearchTargetSlot(idx);
                            setSearchModalOpen(true);
                          }}
                          className="w-full py-1.5 px-3 text-[11px] font-semibold text-ink-500 hover:text-ink-800 dark:text-cream-400 dark:hover:text-cream-100 bg-cream-100 dark:bg-ink-800 rounded-xl transition-colors cursor-pointer"
                        >
                          Đổi máy khác
                        </button>
                      </div>
                    </th>
                  ))}

                  {/* Cột thêm sản phẩm nếu còn chỗ */}
                  {compareItems.length < 4 && (
                    <th className="p-4 sm:p-6 text-center min-w-[200px] align-middle">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTargetSlot(compareItems.length);
                          setSearchModalOpen(true);
                        }}
                        className="w-full h-48 rounded-2xl border-2 border-dashed border-cream-300 dark:border-ink-700 hover:border-accent-500 dark:hover:border-accent-500 flex flex-col items-center justify-center gap-2 text-ink-500 dark:text-cream-400 hover:text-accent-500 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-full bg-cream-100 dark:bg-ink-800 group-hover:bg-accent-50 dark:group-hover:bg-accent-950 flex items-center justify-center transition-colors">
                          <Plus size={20} className="group-hover:text-accent-500" />
                        </div>
                        <span className="text-xs font-bold">Thêm máy ảnh ({compareItems.length}/4)</span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Thân bảng: Từng nhóm thông số */}
              <tbody className="divide-y divide-cream-100 dark:divide-ink-800">
                {/* 1. Nhóm đánh giá & kho */}
                <tr className="bg-cream-100/50 dark:bg-ink-950/40">
                  <td
                    colSpan={compareItems.length + 2}
                    className="p-3 px-6 text-xs font-extrabold uppercase tracking-wider text-accent-700 dark:text-accent-400 flex items-center gap-2"
                  >
                    <Star size={14} />
                    <span>Đánh giá & Tình trạng kho</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 px-6 text-xs font-bold text-ink-600 dark:text-cream-300">
                    Đánh giá khách hàng
                  </td>
                  {compareItems.map((p) => (
                    <td key={p.id} className="p-4 px-6 text-xs text-ink-800 dark:text-cream-200">
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={p.rating || 4.8} size={14} />
                        <span className="font-bold">{p.rating || 4.8}</span>
                        <span className="text-ink-400">({p.review_count || 12})</span>
                      </div>
                    </td>
                  ))}
                  {compareItems.length < 4 && <td />}
                </tr>
                <tr>
                  <td className="p-4 px-6 text-xs font-bold text-ink-600 dark:text-cream-300">
                    Tình trạng kho
                  </td>
                  {compareItems.map((p) => (
                    <td key={p.id} className="p-4 px-6 text-xs text-ink-800 dark:text-cream-200">
                      {p.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Check size={14} /> Còn hàng ({p.stock} máy sẵn giao)
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold">Tạm hết hàng</span>
                      )}
                    </td>
                  ))}
                  {compareItems.length < 4 && <td />}
                </tr>

                {/* Các nhóm thông số kỹ thuật chuyên môn */}
                {SPEC_SECTIONS.map((section, sIdx) => {
                  const Icon = section.icon;
                  return (
                    <React.Fragment key={sIdx}>
                      <tr className="bg-cream-100/50 dark:bg-ink-950/40">
                        <td
                          colSpan={compareItems.length + 2}
                          className="p-3 px-6 text-xs font-extrabold uppercase tracking-wider text-accent-700 dark:text-accent-400 flex items-center gap-2"
                        >
                          <Icon size={14} />
                          <span>{section.title}</span>
                        </td>
                      </tr>
                      {section.specs.map((spec) => {
                        const values = compareItems.map((p) => getSpecValue(p, spec.key));
                        // Kiểm tra nếu filter "onlyDifferences" đang bật và tất cả giá trị giống nhau
                        const allSame = values.every((v) => v === values[0]);
                        if (onlyDifferences && allSame) return null;

                        return (
                          <tr
                            key={spec.key}
                            className="hover:bg-cream-50/60 dark:hover:bg-ink-800/40 transition-colors"
                          >
                            <td className="p-4 px-6 text-xs font-bold text-ink-600 dark:text-cream-300 align-top">
                              {spec.label}
                            </td>
                            {compareItems.map((p, pIdx) => {
                              const val = values[pIdx];
                              const isDistinct = !allSame;
                              return (
                                <td
                                  key={p.id}
                                  className={`p-4 px-6 text-xs leading-relaxed align-top ${
                                    isDistinct
                                      ? 'text-ink-900 dark:text-cream-50 font-semibold'
                                      : 'text-ink-600 dark:text-cream-400'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                            {compareItems.length < 4 && <td />}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal tìm kiếm sản phẩm để thêm vào so sánh */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-cream-200 dark:border-ink-800 w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-cream-200 dark:border-ink-800 flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-50">
                Thêm máy ảnh vào bảng so sánh
              </h3>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1.5 text-ink-400 hover:text-ink-700 dark:hover:text-cream-200 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="relative mb-4">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Gõ tên máy ảnh (Sony A7 IV, Canon R6, Fujifilm...)"
                  className="w-full pl-10 pr-4 py-3 bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-2xl text-sm focus:outline-none focus:border-accent-500 text-ink-900 dark:text-cream-100"
                />
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-cream-100 dark:divide-ink-800">
                {isSearching ? (
                  <div className="py-8 text-center text-xs text-ink-400 animate-pulse">
                    Đang tìm kiếm sản phẩm...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-400">
                    {searchQuery ? 'Không tìm thấy sản phẩm phù hợp' : 'Gõ từ khóa để tìm sản phẩm'}
                  </div>
                ) : (
                  searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProductForSlot(prod)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-cream-50 dark:hover:bg-ink-800/80 rounded-2xl text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-cream-100 dark:bg-ink-800 overflow-hidden shrink-0 border border-cream-200 dark:border-ink-700">
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-ink-900 dark:text-cream-100 group-hover:text-accent-500 truncate">
                          {prod.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950 px-1.5 py-0.2 rounded">
                            {prod.brand}
                          </span>
                          <span className="text-xs font-bold text-ink-900 dark:text-cream-200">
                            {formatCurrency(prod.price)}
                          </span>
                        </div>
                      </div>
                      <Plus size={16} className="text-accent-500 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
