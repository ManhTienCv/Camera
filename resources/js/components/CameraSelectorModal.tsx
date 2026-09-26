import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShoppingBag,
  Camera,
  Film,
  Compass,
  Briefcase,
  DollarSign,
  Layers,
  Award,
  Zap,
  ArrowLeftRight,
} from 'lucide-react';
import type { Page, Product } from '../types';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}

interface QuizState {
  budget: 'budget_low' | 'budget_mid' | 'budget_high' | 'budget_pro';
  usage: 'portrait' | 'vlog' | 'travel' | 'event';
  priority: 'compact' | 'autofocus' | 'lowlight' | 'ecosystem';
  brand: 'any' | 'sony' | 'canon' | 'fujifilm';
}

const BUDGET_OPTIONS = [
  {
    id: 'budget_low',
    title: 'Dưới 15 triệu',
    desc: 'Học nhiếp ảnh cơ bản, du lịch gia đình, kinh phí tiết kiệm',
    min: 0,
    max: 15000000,
  },
  {
    id: 'budget_mid',
    title: '15 - 30 triệu',
    desc: 'Nâng cấp máy ảnh bán chuyên, chụp chân dung, quay vlog sắc nét',
    min: 15000000,
    max: 30000000,
  },
  {
    id: 'budget_high',
    title: '30 - 50 triệu',
    desc: 'Full-Frame hiện đại, màu sắc cao cấp, chụp ảnh sự kiện bán chuyên',
    min: 30000000,
    max: 50000000,
  },
  {
    id: 'budget_pro',
    title: 'Trên 50 triệu',
    desc: 'Hệ thống Studio chuyên nghiệp, phóng sự cưới, sản xuất TVC/Video',
    min: 50000000,
    max: 999000000,
  },
];

const USAGE_OPTIONS = [
  {
    id: 'portrait',
    title: 'Chân dung & Xóa phông (Portrait)',
    desc: 'Tập trung độ nét đôi mắt, bokeh lung linh mịn màng và màu da tự nhiên',
    icon: Camera,
  },
  {
    id: 'vlog',
    title: 'Quay Vlog, TikTok & Youtube Creator',
    desc: 'Cần màn hình xoay lật 180 độ, chống rung tốt, lấy nét theo mắt siêu tốc',
    icon: Film,
  },
  {
    id: 'travel',
    title: 'Du lịch & Nhiếp ảnh Đường phố (Street)',
    desc: 'Cần thiết kế nhỏ gọn, mang vác nhẹ cả ngày, màu ảnh đẹp ăn liền không cần hậu kỳ',
    icon: Compass,
  },
  {
    id: 'event',
    title: 'Dịch vụ Cưới hỏi & Sự kiện Thể thao',
    desc: 'Chụp liên tiếp nhanh, 2 khe thẻ nhớ bảo vệ an toàn, pin chụp cả ngày',
    icon: Briefcase,
  },
];

const PRIORITY_OPTIONS = [
  {
    id: 'compact',
    title: 'Nhỏ gọn & Trọng lượng nhẹ',
    desc: 'Ưu tiên kích thước bỏ vừa balo nhỏ, mang theo mọi chuyến đi không mỏi vai',
    icon: Zap,
  },
  {
    id: 'autofocus',
    title: 'Lấy nét AI & Chống rung IBIS đỉnh cao',
    desc: 'Khóa nét đối tượng tức thì, quay cầm tay mượt mà không cần mang gimbal',
    icon: Award,
  },
  {
    id: 'lowlight',
    title: 'Chụp đêm & Khử nhiễu ISO xuất sắc',
    desc: 'Cảm biến Full-Frame lớn, thu nhận nhiều ánh sáng khi tác nghiệp buổi tối',
    icon: Layers,
  },
  {
    id: 'ecosystem',
    title: 'Hệ sinh thái ống kính phong phú',
    desc: 'Dễ tìm mua ống kính bên thứ 3 (Sigma, Tamron) với chi phí hợp lý',
    icon: Camera,
  },
];

const BRAND_OPTIONS = [
  {
    id: 'any',
    title: 'Bất kỳ hãng nào tốt nhất trong tầm giá',
    desc: 'Tối ưu hiệu năng trên từng đồng chi phí, không phân biệt thương hiệu',
  },
  {
    id: 'sony',
    title: 'Sony (E-mount)',
    desc: 'Lấy nét Real-time Eye AF dẫn đầu thế giới, hệ lens E-mount phong phú nhất',
  },
  {
    id: 'canon',
    title: 'Canon (EOS R)',
    desc: 'Màu da (Skin tone) hồng hào nịnh mắt, công thái học cầm nắm tuyệt vời',
  },
  {
    id: 'fujifilm',
    title: 'Fujifilm (X-Series)',
    desc: 'Giả lập màu film độc bản hoài cổ, thiết kế dial kim loại cổ điển truyền cảm hứng',
  },
];

export function CameraSelectorModal({ isOpen, onClose, onNavigate }: Props) {
  const { addToCart } = useCart();
  const { addToCompare } = useCompare();
  const toast = useToast();

  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<QuizState>({
    budget: 'budget_mid',
    usage: 'vlog',
    priority: 'autofocus',
    brand: 'any',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    bestMatch: Product | null;
    runnerUp: Product | null;
    recommendedLens: Product | null;
    reason: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      runMatchingAlgorithm();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const runMatchingAlgorithm = async () => {
    setAnalyzing(true);
    setRecommendations(null);

    try {
      // 1. Fetch available products
      const allProducts = await api.getProducts({ limit: 40 });
      const products = Array.isArray(allProducts) ? allProducts : [];

      const budgetConfig = BUDGET_OPTIONS.find((b) => b.id === answers.budget)!;

      // 2. Tách máy ảnh và ống kính
      const cameras = products.filter((p) => {
        const cat = (p.category_name || '').toLowerCase();
        const name = p.name.toLowerCase();
        return (
          cat.includes('máy ảnh') ||
          cat.includes('camera') ||
          cat.includes('mirrorless') ||
          name.includes('body') ||
          name.includes('alpha') ||
          name.includes('eos') ||
          name.includes('x-t')
        );
      });

      const lenses = products.filter((p) => {
        const cat = (p.category_name || '').toLowerCase();
        const name = p.name.toLowerCase();
        return cat.includes('ống kính') || cat.includes('lens') || name.includes('lens') || name.includes('f/');
      });

      // 3. Tính điểm độ phù hợp (Scoring Algorithm)
      const scoredCameras = (cameras.length > 0 ? cameras : products).map((prod) => {
        let score = 0;
        const text = `${prod.name} ${prod.description || ''} ${(prod.features || []).join(' ')}`.toLowerCase();

        // Điểm ngân sách
        if (prod.price >= budgetConfig.min && prod.price <= budgetConfig.max) {
          score += 50;
        } else {
          const diff = Math.min(Math.abs(prod.price - budgetConfig.min), Math.abs(prod.price - budgetConfig.max));
          score += Math.max(0, 30 - diff / 1000000);
        }

        // Điểm thương hiệu
        if (answers.brand !== 'any') {
          if (prod.brand.toLowerCase().includes(answers.brand) || text.includes(answers.brand)) {
            score += 40;
          }
        }

        // Điểm nhu cầu
        if (answers.usage === 'vlog') {
          if (text.includes('vlog') || text.includes('video') || text.includes('4k 60p') || text.includes('xoay lật')) {
            score += 30;
          }
        } else if (answers.usage === 'portrait') {
          if (text.includes('full-frame') || text.includes('chân dung') || text.includes('bokeh') || text.includes('eye af')) {
            score += 30;
          }
        } else if (answers.usage === 'travel') {
          if (text.includes('nhỏ gọn') || text.includes('aps-c') || text.includes('compact') || text.includes('fujifilm')) {
            score += 30;
          }
        } else if (answers.usage === 'event') {
          if (text.includes('khe thẻ kép') || text.includes('dual') || text.includes('bền bỉ') || text.includes('fps')) {
            score += 30;
          }
        }

        // Điểm ưu tiên kỹ thuật
        if (answers.priority === 'autofocus' && (text.includes('ai') || text.includes('bionz') || text.includes('dual pixel'))) {
          score += 20;
        }
        if (answers.priority === 'lowlight' && (text.includes('full-frame') || text.includes('bsi') || text.includes('iso'))) {
          score += 20;
        }

        return { product: prod, score };
      });

      scoredCameras.sort((a, b) => b.score - a.score);

      const best = scoredCameras[0]?.product || products[0] || null;
      const runner = scoredCameras[1]?.product || products[1] || null;

      // Tìm ống kính phù hợp tương thích
      const lensMatch = lenses.find((l) => {
        if (!best) return true;
        return l.brand.toLowerCase() === best.brand.toLowerCase();
      }) || lenses[0] || null;

      // Sinh lời khuyên chuyên gia tự động
      const usageLabel = USAGE_OPTIONS.find((u) => u.id === answers.usage)?.title || 'đa dụng';
      const budgetLabel = budgetConfig.title;
      const brandText = answers.brand !== 'any' ? `hệ sinh thái ${answers.brand.toUpperCase()}` : 'các dòng máy tối ưu nhất';

      const reason = `Với ngân sách ${budgetLabel} cùng nhu cầu chính là ${usageLabel}, mẫu máy "${best?.name}" đạt điểm số kỹ thuật cao nhất nhờ cảm biến tân tiến, khả năng chống rung thân máy và hệ thống lấy nét mắt AI chuẩn xác. Khi kết hợp cùng ống kính đi kèm, bạn sẽ có ngay một combo hoàn chỉnh từ chụp chân dung tới quay video sáng tạo mà không phát sinh thêm chi phí.`;

      // Giả lập tính toán thông minh với độ trễ 600ms
      setTimeout(() => {
        setRecommendations({
          bestMatch: best,
          runnerUp: runner,
          recommendedLens: lensMatch,
          reason,
        });
        setAnalyzing(false);
      }, 650);
    } catch (err) {
      console.error('Error during camera matching:', err);
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setRecommendations(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-md animate-fade-in text-ink-900 dark:text-cream-100">
      <div className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-cream-200 dark:border-ink-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-cream-200 dark:border-ink-800 flex items-center justify-between bg-cream-50/60 dark:bg-ink-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-cream-50">
                Trợ lý Tư vấn Chọn máy ảnh AI
              </h2>
              <p className="text-xs text-ink-500 dark:text-cream-400">
                Trả lời 4 câu hỏi nhanh để tìm thiết bị hoàn hảo trong 60 giây
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-ink-400 hover:text-ink-700 dark:hover:text-cream-200 rounded-full hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          {/* Progress bar khi đang trả lời quiz */}
          {!recommendations && !analyzing && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-ink-500 dark:text-cream-400 mb-2">
                <span>Bước {step} trên 4</span>
                <span className="text-accent-500">
                  {step === 1 && 'Dự trù Ngân sách'}
                  {step === 2 && 'Mục đích Sử dụng'}
                  {step === 3 && 'Ưu tiên Kỹ thuật'}
                  {step === 4 && 'Thương hiệu Ưa thích'}
                </span>
              </div>
              <div className="w-full h-2 bg-cream-100 dark:bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {analyzing && (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-accent-500 border-t-transparent animate-spin mx-auto" />
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50">
                Trợ lý đang phân tích cơ sở dữ liệu kỹ thuật...
              </h3>
              <p className="text-xs text-ink-500 dark:text-cream-400 max-w-sm mx-auto">
                Đang đối chiếu khẩu độ, dải dynamic range và hệ lấy nét AI để chọn ra combo tối ưu nhất cho bạn.
              </p>
            </div>
          )}

          {/* QUESTION 1: NGÂN SÁCH */}
          {!recommendations && !analyzing && step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-base sm:text-lg text-ink-900 dark:text-cream-50">
                1. Ngân sách dự kiến bạn muốn đầu tư cho cả combo là bao nhiêu?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAnswers({ ...answers, budget: opt.id as any })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      answers.budget === opt.id
                        ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-950/40 ring-2 ring-accent-500/20'
                        : 'border-cream-200 dark:border-ink-800 hover:border-accent-300 dark:hover:border-ink-700 bg-white dark:bg-ink-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-sm text-ink-900 dark:text-cream-50">
                        {opt.title}
                      </span>
                      {answers.budget === opt.id && (
                        <CheckCircle2 size={18} className="text-accent-500" />
                      )}
                    </div>
                    <p className="text-xs text-ink-500 dark:text-cream-400 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUESTION 2: NHU CẦU SỬ DỤNG */}
          {!recommendations && !analyzing && step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-base sm:text-lg text-ink-900 dark:text-cream-50">
                2. Bạn dự định sử dụng máy ảnh vào mục đích chính nào?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {USAGE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswers({ ...answers, usage: opt.id as any })}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        answers.usage === opt.id
                          ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-950/40 ring-2 ring-accent-500/20'
                          : 'border-cream-200 dark:border-ink-800 hover:border-accent-300 dark:hover:border-ink-700 bg-white dark:bg-ink-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className="text-accent-500" />
                          <span className="font-display font-bold text-sm text-ink-900 dark:text-cream-50">
                            {opt.title}
                          </span>
                        </div>
                        {answers.usage === opt.id && (
                          <CheckCircle2 size={18} className="text-accent-500" />
                        )}
                      </div>
                      <p className="text-xs text-ink-500 dark:text-cream-400 leading-relaxed">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUESTION 3: ƯU TIÊN KỸ THUẬT */}
          {!recommendations && !analyzing && step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-base sm:text-lg text-ink-900 dark:text-cream-50">
                3. Yếu tố kỹ thuật nào bạn đặt lên hàng đầu?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {PRIORITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswers({ ...answers, priority: opt.id as any })}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        answers.priority === opt.id
                          ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-950/40 ring-2 ring-accent-500/20'
                          : 'border-cream-200 dark:border-ink-800 hover:border-accent-300 dark:hover:border-ink-700 bg-white dark:bg-ink-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className="text-accent-500" />
                          <span className="font-display font-bold text-sm text-ink-900 dark:text-cream-50">
                            {opt.title}
                          </span>
                        </div>
                        {answers.priority === opt.id && (
                          <CheckCircle2 size={18} className="text-accent-500" />
                        )}
                      </div>
                      <p className="text-xs text-ink-500 dark:text-cream-400 leading-relaxed">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUESTION 4: THƯƠNG HIỆU */}
          {!recommendations && !analyzing && step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-base sm:text-lg text-ink-900 dark:text-cream-50">
                4. Bạn có cảm tình đặc biệt với thương hiệu máy ảnh nào không?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {BRAND_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAnswers({ ...answers, brand: opt.id as any })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      answers.brand === opt.id
                        ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-950/40 ring-2 ring-accent-500/20'
                        : 'border-cream-200 dark:border-ink-800 hover:border-accent-300 dark:hover:border-ink-700 bg-white dark:bg-ink-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-sm text-ink-900 dark:text-cream-50">
                        {opt.title}
                      </span>
                      {answers.brand === opt.id && (
                        <CheckCircle2 size={18} className="text-accent-500" />
                      )}
                    </div>
                    <p className="text-xs text-ink-500 dark:text-cream-400 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RESULTS: KẾT QUẢ GỢI Ý CHI TIẾT */}
          {recommendations && (
            <div className="space-y-6 animate-fade-in">
              {/* Expert Summary Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-accent-50/60 dark:bg-accent-950/40 border border-accent-200 dark:border-accent-800/80">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-accent-600 dark:text-accent-400" />
                  <h4 className="font-display font-bold text-sm text-accent-900 dark:text-accent-200">
                    Nhận định từ chuyên gia CameraHub
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-ink-700 dark:text-cream-300 leading-relaxed">
                  {recommendations.reason}
                </p>
              </div>

              {/* Top 1 Best Match */}
              {recommendations.bestMatch && (
                <div className="p-5 rounded-3xl border-2 border-accent-500 bg-white dark:bg-ink-900 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-accent-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    Lựa chọn #1 Phù hợp nhất
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-cream-100 dark:bg-ink-800 overflow-hidden shrink-0 border border-cream-200 dark:border-ink-700">
                      <img
                        src={recommendations.bestMatch.image_url}
                        alt={recommendations.bestMatch.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">
                        {recommendations.bestMatch.brand}
                      </span>
                      <h3
                        onClick={() => {
                          onClose();
                          onNavigate({ name: 'product', slug: recommendations.bestMatch!.slug });
                        }}
                        className="font-display font-extrabold text-base sm:text-lg text-ink-900 dark:text-cream-50 mt-1 mb-2 hover:text-accent-500 cursor-pointer line-clamp-2"
                      >
                        {recommendations.bestMatch.name}
                      </h3>
                      <div className="font-display font-bold text-xl text-ink-900 dark:text-cream-50 mb-3">
                        {formatCurrency(recommendations.bestMatch.price)}
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(recommendations.bestMatch!, 1);
                            toast.success(`Đã thêm ${recommendations.bestMatch!.name} vào giỏ hàng!`);
                          }}
                          className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <ShoppingBag size={14} />
                          <span>Thêm vào giỏ hàng</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            addToCompare(recommendations.bestMatch!);
                            onClose();
                            onNavigate({ name: 'compare', ids: [recommendations.bestMatch!.id] });
                          }}
                          className="px-3 py-2 bg-cream-100 dark:bg-ink-800 text-ink-700 dark:text-cream-200 hover:bg-cream-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeftRight size={14} />
                          <span>So sánh máy này</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Combo Lens đi kèm & Máy thay thế */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendations.recommendedLens && (
                  <div className="p-4 rounded-2xl border border-cream-200 dark:border-ink-800 bg-cream-50/50 dark:bg-ink-800/40">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      Ống kính khuyên dùng kèm combo
                    </span>
                    <h5 className="font-display font-bold text-xs sm:text-sm text-ink-900 dark:text-cream-50 mt-2 mb-1 truncate">
                      {recommendations.recommendedLens.name}
                    </h5>
                    <p className="text-xs font-bold text-ink-800 dark:text-cream-200 mb-3">
                      {formatCurrency(recommendations.recommendedLens.price)}
                    </p>
                    <button
                      type="button"
                      onClick={() => addToCart(recommendations.recommendedLens!, 1)}
                      className="w-full py-1.5 px-3 bg-white dark:bg-ink-900 border border-cream-300 dark:border-ink-700 hover:border-accent-500 rounded-xl text-xs font-semibold text-ink-700 dark:text-cream-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShoppingBag size={12} />
                      <span>Thêm ống kính này (+ {formatCurrency(recommendations.recommendedLens.price)})</span>
                    </button>
                  </div>
                )}

                {recommendations.runnerUp && (
                  <div className="p-4 rounded-2xl border border-cream-200 dark:border-ink-800 bg-cream-50/50 dark:bg-ink-800/40">
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                      Lựa chọn thay thế đáng cân nhắc #2
                    </span>
                    <h5 className="font-display font-bold text-xs sm:text-sm text-ink-900 dark:text-cream-50 mt-2 mb-1 truncate">
                      {recommendations.runnerUp.name}
                    </h5>
                    <p className="text-xs font-bold text-ink-800 dark:text-cream-200 mb-3">
                      {formatCurrency(recommendations.runnerUp.price)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate({ name: 'product', slug: recommendations.runnerUp!.slug });
                      }}
                      className="w-full py-1.5 px-3 bg-white dark:bg-ink-900 border border-cream-300 dark:border-ink-700 hover:border-accent-500 rounded-xl text-xs font-semibold text-ink-700 dark:text-cream-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Xem thông số chi tiết</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-cream-200 dark:border-ink-800 flex items-center justify-between bg-cream-50/50 dark:bg-ink-950/40">
          {!recommendations ? (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1 || analyzing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 dark:text-cream-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Quay lại</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={analyzing}
                className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{step === 4 ? 'Xem gợi ý phù hợp nhất' : 'Câu tiếp theo'}</span>
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 dark:text-cream-300 hover:bg-cream-100 dark:hover:bg-ink-800 transition-colors cursor-pointer"
              >
                Làm lại trắc nghiệm
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-ink-900 dark:bg-cream-100 text-white dark:text-ink-900 rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                Đóng
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
