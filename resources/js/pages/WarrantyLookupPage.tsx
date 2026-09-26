import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  QrCode,
  Sparkles,
  ChevronRight,
  Award,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { Page } from '../types';
import { api } from '../lib/api';

interface Props {
  onNavigate: (page: Page) => void;
}

interface WarrantyData {
  found: boolean;
  serialNumber: string;
  productName: string;
  productImage: string;
  brand: string;
  customerName: string;
  customerPhone: string;
  orderCode: string;
  purchaseDate: string;
  expiryDate: string;
  warrantyDuration: string;
  daysLeft: number;
  status: 'active' | 'expired';
  statusLabel: string;
  serviceCenter: string;
  history: Array<{ date: string; title: string; desc: string }>;
}

export function WarrantyLookupPage({ onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WarrantyData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) {
      setErrorMsg('Vui lòng nhập Số Serial máy ảnh, Mã đơn hàng hoặc Số điện thoại mua hàng.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const data = await api.checkWarranty(q);
      if (data.found) {
        setResult(data);
      } else {
        setErrorMsg('Không tìm thấy thông tin bảo hành điện tử cho mã này.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Không tìm thấy dữ liệu bảo hành. Vui lòng kiểm tra lại số Serial hoặc Mã đơn hàng.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = (sampleQuery: string) => {
    setQuery(sampleQuery);
    handleSearch(sampleQuery);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-ink-900 dark:text-cream-100">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-400 mb-6 flex-wrap">
        <button
          onClick={() => onNavigate({ name: 'home' })}
          className="hover:text-accent-500 transition-colors cursor-pointer"
        >
          Trang chủ
        </button>
        <ChevronRight size={14} />
        <span className="text-ink-700 dark:text-cream-300 font-semibold">
          Tra cứu bảo hành điện tử
        </span>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-300 rounded-full text-xs font-bold mb-4 shadow-2xs">
          <ShieldCheck size={16} className="text-accent-500" />
          <span>Hệ Thống Xác Thực Điện Tử CameraHub Care 24/7</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink-900 dark:text-cream-50 tracking-tight mb-3">
          Tra cứu bảo hành điện tử chính hãng
        </h1>
        <p className="text-sm text-ink-500 dark:text-cream-400 leading-relaxed">
          Mọi thiết bị máy ảnh, ống kính và phụ kiện phân phối bởi CameraHub đều được kích hoạt bảo hành điện tử tự động. Kiểm tra ngày hết hạn, tình trạng thiết bị và quyền lợi hậu mãi.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-ink-900 rounded-3xl p-4 sm:p-6 shadow-xl border border-cream-200 dark:border-ink-800 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập số Serial (SN-...), Mã đơn hàng (#CAM-...) hoặc SĐT"
              className="w-full pl-11 pr-4 py-3.5 bg-cream-50 dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white dark:focus:bg-ink-900 focus:ring-2 focus:ring-accent-500/20 text-ink-900 dark:text-cream-100 placeholder:text-ink-400"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Đang tra cứu...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Tra cứu ngay</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Test Samples */}
        <div className="mt-4 pt-4 border-t border-cream-100 dark:border-ink-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-400 font-medium">Thử nhanh với mẫu:</span>
          <button
            type="button"
            onClick={() => handleQuickTest('SN-CH-SON-000101')}
            className="px-2.5 py-1 bg-cream-100 dark:bg-ink-800 hover:bg-accent-50 dark:hover:bg-accent-950/60 text-ink-700 dark:text-cream-300 hover:text-accent-600 rounded-lg transition-colors cursor-pointer font-mono"
          >
            SN-CH-SON-000101
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest('#CAM-01')}
            className="px-2.5 py-1 bg-cream-100 dark:bg-ink-800 hover:bg-accent-50 dark:hover:bg-accent-950/60 text-ink-700 dark:text-cream-300 hover:text-accent-600 rounded-lg transition-colors cursor-pointer font-mono"
          >
            #CAM-01
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest('0988888888')}
            className="px-2.5 py-1 bg-cream-100 dark:bg-ink-800 hover:bg-accent-50 dark:hover:bg-accent-950/60 text-ink-700 dark:text-cream-300 hover:text-accent-600 rounded-lg transition-colors cursor-pointer font-mono"
          >
            0988888888
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <p className="font-bold">Không tìm thấy thông tin</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ELECTRONIC WARRANTY CERTIFICATE CARD (RESULT) */}
      {result && (
        <div className="max-w-3xl mx-auto mb-12 animate-scale-up">
          <div className="relative rounded-3xl bg-gradient-to-br from-white via-cream-50 to-cream-100 dark:from-ink-900 dark:via-[#161614] dark:to-ink-950 p-6 sm:p-8 border-2 border-accent-500/50 shadow-2xl overflow-hidden">
            {/* Holographic Watermark Badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 px-3 py-1 bg-accent-500/10 dark:bg-accent-500/20 border border-accent-500/30 rounded-full text-[11px] font-extrabold text-accent-600 dark:text-accent-300 uppercase tracking-widest">
              <Sparkles size={12} className="text-accent-500 animate-pulse" />
              <span>Chính Hãng Phân Phối</span>
            </div>

            {/* Certificate Header */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-cream-200 dark:border-ink-800">
              <div className="w-12 h-12 rounded-2xl bg-accent-500 text-white flex items-center justify-center shadow-md">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-ink-900 dark:text-cream-50">
                  Thẻ Chứng Nhận Bảo Hành Điện Tử
                </h3>
                <p className="text-xs text-ink-400 dark:text-cream-400 font-mono">
                  SỐ SERIAL: <strong className="text-ink-900 dark:text-cream-100">{result.serialNumber}</strong>
                </p>
              </div>
            </div>

            {/* Product Details & QR Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Product Info */}
              <div className="md:col-span-2 flex items-center gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-ink-800 overflow-hidden border border-cream-200 dark:border-ink-700 shrink-0 shadow-xs">
                  <img
                    src={result.productImage}
                    alt={result.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">
                    {result.brand}
                  </span>
                  <h4 className="font-display font-bold text-base text-ink-900 dark:text-cream-50 mt-1 mb-1 truncate">
                    {result.productName}
                  </h4>
                  <p className="text-xs text-ink-500 dark:text-cream-400">
                    Đơn hàng: <span className="font-semibold text-ink-800 dark:text-cream-200">{result.orderCode}</span>
                  </p>
                  <p className="text-xs text-ink-500 dark:text-cream-400 mt-0.5">
                    Chủ sở hữu: <span className="font-semibold text-ink-800 dark:text-cream-200">{result.customerName} ({result.customerPhone})</span>
                  </p>
                </div>
              </div>

              {/* QR Verification Box */}
              <div className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-ink-800/80 rounded-2xl border border-cream-200 dark:border-ink-700 text-center">
                <div className="w-20 h-20 bg-cream-100 dark:bg-ink-900 rounded-xl flex items-center justify-center text-ink-800 dark:text-cream-200 mb-1.5 p-2">
                  <QrCode size={56} className="text-ink-900 dark:text-cream-100" />
                </div>
                <span className="text-[10px] font-bold text-ink-500 dark:text-cream-400 uppercase tracking-tight">
                  Quét mã bảo hành
                </span>
              </div>
            </div>

            {/* Countdown & Status Progress */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-ink-800/60 border border-cream-200 dark:border-ink-700/80 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      result.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-display font-bold text-sm text-ink-900 dark:text-cream-50">
                    {result.statusLabel}
                  </span>
                </div>

                <div className="text-xs text-ink-500 dark:text-cream-400 font-medium">
                  {result.status === 'active' ? (
                    <span>
                      Còn lại <strong className="text-accent-500 font-extrabold text-sm">{result.daysLeft}</strong> ngày
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold">Hết hạn bảo hành</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-cream-100 dark:bg-ink-900 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(5, (result.daysLeft / 730) * 100))}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-ink-400">Ngày kích hoạt:</span>
                  <p className="font-bold text-ink-800 dark:text-cream-200 mt-0.5">{result.purchaseDate}</p>
                </div>
                <div className="text-right">
                  <span className="text-ink-400">Hạn bảo hành:</span>
                  <p className="font-bold text-ink-800 dark:text-cream-200 mt-0.5">{result.expiryDate}</p>
                </div>
              </div>
            </div>

            {/* History & Inspection Timeline */}
            {result.history && result.history.length > 0 && (
              <div className="mb-6">
                <h5 className="font-display font-bold text-xs uppercase tracking-wider text-ink-400 dark:text-cream-400 mb-3">
                  Nhật ký kiểm định & Kích hoạt thiết bị
                </h5>
                <div className="space-y-3">
                  {result.history.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/70 dark:bg-ink-800/40 rounded-xl border border-cream-200 dark:border-ink-800 text-xs flex items-start gap-3"
                    >
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-ink-900 dark:text-cream-100">{h.title}</strong>
                          <span className="text-[11px] text-ink-400">{h.date}</span>
                        </div>
                        <p className="text-ink-500 dark:text-cream-400 mt-0.5">{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Center Info */}
            <div className="pt-4 border-t border-cream-200 dark:border-ink-800 text-xs text-ink-500 dark:text-cream-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-accent-500 shrink-0" />
                <span>{result.serviceCenter}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-accent-600 dark:text-accent-400 shrink-0">
                <Phone size={15} />
                <span>Hotline tiếp nhận: 1900 6868</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Trụ Cột Chính Sách Bảo Hành Chính Hãng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-accent-100 dark:bg-accent-950 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-4">
            <RefreshCw size={22} />
          </div>
          <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-50 mb-2">
            1 Đổi 1 trong 30 ngày
          </h3>
          <p className="text-xs text-ink-500 dark:text-cream-400 leading-relaxed">
            Nếu phát hiện lỗi từ nhà sản xuất về cảm biến, màn trập hay bo mạch, quý khách được đổi ngay thiết bị mới 100% nguyên seal.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-accent-100 dark:bg-accent-950 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-4">
            <Award size={22} />
          </div>
          <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-50 mb-2">
            Vệ sinh Sensor miễn phí trọn đời
          </h3>
          <p className="text-xs text-ink-500 dark:text-cream-400 leading-relaxed">
            Khách hàng mua máy tại CameraHub được vệ sinh cảm biến, khử nấm mốc và cập nhật firmware body & lens miễn phí không giới hạn.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-accent-100 dark:bg-accent-950 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-4">
            <Clock size={22} />
          </div>
          <h3 className="font-display font-bold text-base text-ink-900 dark:text-cream-50 mb-2">
            Hỗ trợ máy mượn tác nghiệp
          </h3>
          <p className="text-xs text-ink-500 dark:text-cream-400 leading-relaxed">
            Với các nhiếp ảnh gia và quay phim chuyên nghiệp, CameraHub hỗ trợ thiết bị tương đương thay thế trong thời gian chờ thẩm định bảo hành.
          </p>
        </div>
      </div>
    </div>
  );
}
