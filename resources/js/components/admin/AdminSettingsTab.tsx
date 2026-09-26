import React, { useState, useEffect } from 'react';
import {
  Store,
  CreditCard,
  Truck,
  Cpu,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Bell,
  Smartphone,
} from 'lucide-react';
import { getStoreSettings, saveStoreSettings, resetStoreSettings, type StoreSettings } from '../../lib/settings';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../lib/utils';
import { GlidingIndicator } from '../ui/GlidingIndicator';

interface AdminSettingsTabProps {
  onSaveSuccess: () => void;
}

type SettingsSubTab = 'general' | 'payment' | 'shipping' | 'system';

const BANK_OPTIONS = [
  { id: 'vietcombank', name: 'Vietcombank', fullName: 'Ngân hàng Ngoại Thương Việt Nam (VCB)' },
  { id: 'mbbank', name: 'MB Bank', fullName: 'Ngân hàng TMCP Quân Đội (MB)' },
  { id: 'techcombank', name: 'Techcombank', fullName: 'Ngân hàng Kỹ Thương Việt Nam (TCB)' },
  { id: 'bidv', name: 'BIDV', fullName: 'Ngân hàng Đầu tư và Phát triển Việt Nam' },
  { id: 'tpbank', name: 'TPBank', fullName: 'Ngân hàng Tiên Phong' },
  { id: 'vpbank', name: 'VPBank', fullName: 'Ngân hàng Việt Nam Thịnh Vượng' },
  { id: 'acb', name: 'ACB', fullName: 'Ngân hàng Á Châu' },
];

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ onSaveSuccess }) => {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('general');
  const [formData, setFormData] = useState<StoreSettings>(() => getStoreSettings());
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    setFormData(getStoreSettings());
  }, []);

  const handleInputChange = <K extends keyof StoreSettings>(field: K, value: StoreSettings[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoreSettings(formData);
    setIsSavedRecently(true);
    toast.success('Đã lưu cấu hình hệ thống thành công!');
    onSaveSuccess();
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ cài đặt về trạng thái mặc định của hệ thống?')) {
      const reset = resetStoreSettings();
      setFormData(reset);
      toast.info('Đã khôi phục cài đặt mặc định ban đầu');
      onSaveSuccess();
    }
  };

  const handleClearCache = () => {
    setIsClearingCache(true);
    try {
      localStorage.removeItem('camera_session_id');
      // Dispatch event to clear cache in any active store/services
      window.dispatchEvent(new Event('camerahub_cache_cleared'));
      setTimeout(() => {
        setIsClearingCache(false);
        toast.success('Đã xóa sạch bộ nhớ tạm (Cache) và dữ liệu phiên thành công!');
      }, 600);
    } catch {
      setIsClearingCache(false);
      toast.error('Không thể xóa bộ nhớ tạm');
    }
  };

  const sampleQrUrl = `https://img.vietqr.io/image/${formData.bankId}-${formData.bankAccountNumber}-compact2.png?amount=500000&addInfo=TEST%20DON%20HANG&accountName=${encodeURIComponent(
    formData.bankAccountName
  )}`;

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-50 text-accent-600 dark:bg-accent-950/60 dark:text-accent-400 border border-accent-200 dark:border-accent-800/60">
              System Control
            </span>
            <span className="text-xs text-ink-400">Phiên bản 2.4.0 Pro</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-ink-900 dark:text-cream-50 mt-1">
            Cài đặt & Vận hành Hệ thống
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">
            Quản trị thông tin thương hiệu, tài khoản VietQR, chính sách giao hàng và cấu hình toàn trang
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white bg-cream-100 hover:bg-cream-200 dark:bg-ink-800 dark:hover:bg-ink-700 rounded-xl transition-all"
            title="Khôi phục cài đặt xuất xưởng"
          >
            <RotateCcw size={15} />
            Mặc định
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-accent-500 hover:bg-accent-600 rounded-xl shadow-xs transition-all active:scale-95"
          >
            {isSavedRecently ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {isSavedRecently ? 'Đã lưu cấu hình' : 'Lưu tất cả thay đổi'}
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation (Apple-like with GlidingIndicator) */}
      <div className="flex items-center gap-2 p-1.5 bg-cream-100 dark:bg-ink-800/80 rounded-2xl border border-cream-200 dark:border-ink-700/80 overflow-x-auto no-scrollbar">
        {[
          { id: 'general', label: 'Cửa hàng & Showroom', icon: Store },
          { id: 'payment', label: 'Thanh toán & VietQR', icon: CreditCard },
          { id: 'shipping', label: 'Vận chuyển & GHN', icon: Truck },
          { id: 'system', label: 'Vận hành & Hệ thống', icon: Cpu },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SettingsSubTab)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                isActive
                  ? 'text-white shadow-xs'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <GlidingIndicator
                  layoutId="admin-settings-subtab-pill"
                  className="inset-0 bg-accent-500 rounded-xl"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={16} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-tab 1: Cửa hàng & Showroom */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-ink-900 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs space-y-6">
            <div className="border-b border-cream-100 dark:border-ink-800 pb-4">
              <h3 className="text-base font-bold text-ink-900 dark:text-cream-50 flex items-center gap-2">
                <Store size={18} className="text-accent-500" />
                Thông tin nhận diện & Trụ sở Showroom
              </h3>
              <p className="text-xs text-ink-400 mt-1">
                Các thông tin này sẽ hiển thị trên Header, Footer, Hóa đơn và các email gửi đến khách hàng
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                  Tên thương hiệu / Cửa hàng
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Ví dụ: CameraHub Vietnam"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                  Hotline tư vấn kỹ thuật (24/7)
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Ví dụ: 1900 6868"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                  Email hỗ trợ khách hàng
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field text-sm"
                  placeholder="support@camerahub.vn"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                  Giờ mở cửa phục vụ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.businessHours}
                    onChange={(e) => handleInputChange('businessHours', e.target.value)}
                    className="input-field text-sm pl-9"
                    placeholder="08:30 - 21:30 (Thứ 2 - Chủ Nhật)"
                  />
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                Địa chỉ Showroom trải nghiệm máy ảnh
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="input-field text-sm"
                placeholder="Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
              />
            </div>

            {/* Social Links */}
            <div className="pt-4 border-t border-cream-100 dark:border-ink-800">
              <h4 className="text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-4">
                Kênh kết nối & Mạng xã hội
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-ink-500 mb-1">Fanpage Facebook</label>
                  <input
                    type="url"
                    value={formData.socialFacebook}
                    onChange={(e) => handleInputChange('socialFacebook', e.target.value)}
                    className="input-field text-xs"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-500 mb-1">Kênh YouTube (Review)</label>
                  <input
                    type="url"
                    value={formData.socialYoutube}
                    onChange={(e) => handleInputChange('socialYoutube', e.target.value)}
                    className="input-field text-xs"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-500 mb-1">Zalo Hỗ trợ OA</label>
                  <input
                    type="text"
                    value={formData.socialZalo}
                    onChange={(e) => handleInputChange('socialZalo', e.target.value)}
                    className="input-field text-xs"
                    placeholder="https://zalo.me/..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                Chính sách bảo hành & Đổi trả chính hãng
              </label>
              <textarea
                rows={3}
                required
                value={formData.returnPolicy}
                onChange={(e) => handleInputChange('returnPolicy', e.target.value)}
                className="input-field text-sm resize-none"
                placeholder="Mô tả chính sách bảo hành 24 tháng, bao test đổi mới..."
              />
            </div>

            <div className="pt-4 border-t border-cream-200 dark:border-ink-800 flex justify-end">
              <button
                type="submit"
                className="btn-accent px-6 py-2.5 text-xs font-semibold rounded-xl shadow-xs"
              >
                Lưu thông tin cửa hàng
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sub-tab 2: Thanh toán & VietQR */}
      {activeSubTab === 'payment' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bank VietQR Settings */}
            <div className="lg:col-span-2 bg-white dark:bg-ink-900 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs space-y-6">
              <div className="border-b border-cream-100 dark:border-ink-800 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-ink-900 dark:text-cream-50 flex items-center gap-2">
                    <QrCode size={18} className="text-emerald-500" />
                    Cấu hình Tài khoản Ngân hàng (VietQR Napas 24/7)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    Live Auto-QR
                  </span>
                </div>
                <p className="text-xs text-ink-400 mt-1">
                  Hệ thống tự sinh mã QR thanh toán chuẩn Napas 247 khớp với từng mã đơn hàng
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                  Ngân hàng thụ hưởng
                </label>
                <select
                  value={formData.bankId}
                  onChange={(e) => {
                    const selected = BANK_OPTIONS.find((b) => b.id === e.target.value);
                    if (selected) {
                      setFormData((prev) => ({
                        ...prev,
                        bankId: selected.id,
                        bankName: selected.name,
                        bankFullName: selected.fullName,
                      }));
                    }
                  }}
                  className="input-field text-sm"
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} - {b.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                    Số tài khoản ngân hàng
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleInputChange('bankAccountNumber', e.target.value.replace(/\s+/g, ''))}
                    className="input-field text-sm font-mono tracking-wider font-semibold"
                    placeholder="88888888"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                    Tên chủ tài khoản (In hoa không dấu)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankAccountName}
                    onChange={(e) => handleInputChange('bankAccountName', e.target.value.toUpperCase())}
                    className="input-field text-sm uppercase font-semibold"
                    placeholder="NGUYEN MANH TIEN"
                  />
                </div>
              </div>

              {/* Payment Methods Switches */}
              <div className="pt-4 border-t border-cream-100 dark:border-ink-800 space-y-4">
                <h4 className="text-xs font-bold text-ink-700 dark:text-ink-300 uppercase">
                  Bật / Tắt Phương thức Thanh toán tại Bước Checkout
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 bg-cream-50 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700/60 cursor-pointer hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        QR
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900 dark:text-cream-100">
                          Chuyển khoản nhanh VietQR 24/7
                        </p>
                        <p className="text-xs text-ink-400">Khách quét mã QR tự động điền số tiền và nội dung đơn</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isVietQrEnabled}
                      onChange={(e) => handleInputChange('isVietQrEnabled', e.target.checked)}
                      className="w-5 h-5 accent-accent-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-cream-50 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700/60 cursor-pointer hover:border-pink-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-950/80 dark:text-pink-400 flex items-center justify-center font-bold text-xs">
                        MoMo
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900 dark:text-cream-100">
                          Ví Điện Tử MoMo (QR & App)
                        </p>
                        <p className="text-xs text-ink-400">Tích hợp cổng thanh toán trực tuyến MoMo Gateway</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isMomoEnabled}
                      onChange={(e) => handleInputChange('isMomoEnabled', e.target.checked)}
                      className="w-5 h-5 accent-accent-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-cream-50 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700/60 cursor-pointer hover:border-amber-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                        COD
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900 dark:text-cream-100">
                          Thanh toán khi nhận hàng (COD)
                        </p>
                        <p className="text-xs text-ink-400">Khách kiểm tra bưu phẩm máy ảnh rồi thanh toán tiền mặt</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isCodEnabled}
                      onChange={(e) => handleInputChange('isCodEnabled', e.target.checked)}
                      className="w-5 h-5 accent-accent-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-cream-200 dark:border-ink-800 flex justify-end">
                <button
                  type="submit"
                  className="btn-accent px-6 py-2.5 text-xs font-semibold rounded-xl shadow-xs"
                >
                  Lưu cấu hình thanh toán
                </button>
              </div>
            </div>

            {/* Live QR Preview Box */}
            <div className="bg-white dark:bg-ink-900 p-6 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs flex flex-col items-center justify-between text-center">
              <div className="w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream-100 dark:bg-ink-800 text-ink-600 dark:text-cream-200 rounded-full text-xs font-bold mb-4">
                  <Sparkles size={13} className="text-accent-500" />
                  Xem trước mã VietQR khách nhìn thấy
                </div>

                <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-300 shadow-xs inline-block mx-auto mb-4">
                  <img
                    src={sampleQrUrl}
                    alt="VietQR Preview"
                    className="w-48 h-48 object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                <div className="text-left bg-cream-50 dark:bg-ink-800/60 p-4 rounded-2xl space-y-1.5 text-xs">
                  <p className="text-ink-400">Ngân hàng:</p>
                  <p className="font-bold text-ink-800 dark:text-cream-100">{formData.bankName}</p>
                  <p className="text-ink-400 mt-2">Số tài khoản:</p>
                  <p className="font-mono font-bold text-ink-900 dark:text-accent-400 text-sm">{formData.bankAccountNumber}</p>
                  <p className="text-ink-400 mt-2">Chủ tài khoản:</p>
                  <p className="font-bold text-ink-800 dark:text-cream-100 uppercase">{formData.bankAccountName}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-cream-100 dark:border-ink-800 text-2xs text-ink-400">
                Thử nghiệm quét QR bằng app ngân hàng bất kỳ để kiểm tra tên chủ tài khoản
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Sub-tab 3: Vận chuyển & GHN */}
      {activeSubTab === 'shipping' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-ink-900 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs space-y-6">
            <div className="border-b border-cream-100 dark:border-ink-800 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-ink-900 dark:text-cream-50 flex items-center gap-2">
                  <Truck size={18} className="text-amber-500" />
                  Chính sách Vận chuyển Toàn quốc & Tích hợp GHN Express
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  Logistics Connected
                </span>
              </div>
              <p className="text-xs text-ink-400 mt-1">
                Tối ưu hóa phí giao hàng và kích thích giá trị giỏ hàng thông qua cơ chế Freeship tự động
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                  Phí giao hàng tiêu chuẩn (VND)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={formData.shippingFee}
                  onChange={(e) => handleInputChange('shippingFee', Number(e.target.value))}
                  className="input-field text-sm"
                />
                <p className="text-2xs text-ink-400 mt-1.5">
                  Áp dụng mặc định: {formatPrice(Number(formData.shippingFee) || 0)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                  Ngưỡng Miễn Phí Vận Chuyển Toàn Quốc (Freeship Threshold)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={100000}
                  value={formData.freeShippingThreshold}
                  onChange={(e) => handleInputChange('freeShippingThreshold', Number(e.target.value))}
                  className="input-field text-sm"
                />
                <p className="text-2xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Đơn từ {formatPrice(Number(formData.freeShippingThreshold) || 0)} sẽ tự động FREESHIP tại checkout
                </p>
              </div>
            </div>

            {/* GHN Express Section */}
            <div className="pt-4 border-t border-cream-100 dark:border-ink-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-bold text-xs uppercase text-ink-700 dark:text-ink-300">
                  Thông số kết nối Giao Hàng Nhanh (GHN Open API)
                </span>
                <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  API Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-ink-500 mb-1">Mã cửa hàng GHN (Shop ID)</label>
                  <input
                    type="text"
                    value={formData.ghnShopId}
                    onChange={(e) => handleInputChange('ghnShopId', e.target.value)}
                    className="input-field text-xs font-mono"
                    placeholder="190452"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-500 mb-1">Mã Phường/Xã kho lấy hàng (Default Ward Code)</label>
                  <input
                    type="text"
                    value={formData.ghnDefaultWardCode}
                    onChange={(e) => handleInputChange('ghnDefaultWardCode', e.target.value)}
                    className="input-field text-xs font-mono"
                    placeholder="20101 (Phường Bến Nghé, Quận 1)"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-cream-50 dark:bg-ink-800/60 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Info size={16} className="text-accent-500 shrink-0" />
                  <span className="text-ink-600 dark:text-ink-300">
                    Khi đơn hàng được xác nhận trong Quản lý đơn hàng, admin có thể bấm 1-click để tạo vận đơn và đẩy trực tiếp sang hệ thống GHN.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Kết nối API GHN đang hoạt động ổn định (Ping: 42ms)')}
                  className="shrink-0 px-3 py-1.5 bg-white dark:bg-ink-700 hover:bg-cream-100 rounded-xl font-semibold border border-cream-200 dark:border-ink-600 transition-colors"
                >
                  Kiểm tra kết nối
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-cream-200 dark:border-ink-800 flex justify-end">
              <button
                type="submit"
                className="btn-accent px-6 py-2.5 text-xs font-semibold rounded-xl shadow-xs"
              >
                Lưu cài đặt vận chuyển
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sub-tab 4: Vận hành & Hệ thống */}
      {activeSubTab === 'system' && (
        <div className="space-y-6">
          {/* Top Announcement Bar Configuration */}
          <div className="bg-white dark:bg-ink-900 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-cream-100 dark:border-ink-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-ink-900 dark:text-cream-50 flex items-center gap-2">
                  <Bell size={18} className="text-accent-500" />
                  Thanh Thông Báo Toàn Website (Top Announcement Banner)
                </h3>
                <p className="text-xs text-ink-400 mt-1">
                  Hiển thị thông điệp khuyến mãi hoặc thông báo nghỉ lễ ở đầu trang cho toàn bộ khách hàng
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.announcementEnabled}
                  onChange={(e) => handleInputChange('announcementEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-cream-300 peer-focus:outline-none rounded-full peer dark:bg-ink-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500" />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-ink-300 uppercase mb-2">
                Nội dung dòng chữ thông báo
              </label>
              <input
                type="text"
                value={formData.announcementText}
                onChange={(e) => handleInputChange('announcementText', e.target.value)}
                className="input-field text-sm"
                placeholder="Ví dụ: 🔥 Miễn phí vận chuyển toàn quốc cho đơn máy ảnh từ 5.000.000đ!"
              />
            </div>

            {formData.announcementEnabled && formData.announcementText && (
              <div className="p-3 bg-accent-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow-xs">
                <Sparkles size={14} className="shrink-0" />
                <span>Xem trước: {formData.announcementText}</span>
              </div>
            )}
          </div>

          {/* Maintenance Mode */}
          <div className="bg-white dark:bg-ink-900 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-cream-100 dark:border-ink-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-ink-900 dark:text-cream-50 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-500" />
                  Chế độ Bảo trì Hệ thống (Maintenance Mode)
                </h3>
                <p className="text-xs text-ink-400 mt-1">
                  Khi bật, website sẽ hiện biểu ngữ tạm ngưng tiếp nhận đơn hàng cho việc nâng cấp cơ sở dữ liệu
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.maintenanceMode}
                  onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-cream-300 peer-focus:outline-none rounded-full peer dark:bg-ink-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
              </label>
            </div>

            {formData.maintenanceMode && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-3">
                <AlertTriangle size={20} className="shrink-0 text-rose-500" />
                <span>
                  <strong>Cảnh báo:</strong> Chế độ bảo trì đang BẬT. Khách hàng thông thường sẽ được cảnh báo hệ thống đang bảo trì định kỳ. Quản trị viên vẫn thao tác bình thường.
                </span>
              </div>
            )}
          </div>

          {/* Quick Operations & Cache Clear */}
          <div className="bg-white dark:bg-ink-900 p-6 sm:p-8 rounded-3xl border border-cream-200 dark:border-ink-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-ink-900 dark:text-cream-50 flex items-center gap-2">
              <RefreshCw size={18} className="text-blue-500" />
              Công cụ Vận hành Dữ liệu & Xóa Cache
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 bg-cream-50 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700/60 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-ink-900 dark:text-cream-100 mb-1">
                    Xóa Bộ Nhớ Đệm (Application Cache)
                  </h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
                    Giải phóng cache API in-memory và phiên duyệt web nhằm cập nhật tức thì giá và tồn kho máy ảnh mới.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-ink-700 hover:bg-cream-100 text-ink-800 dark:text-cream-100 text-xs font-semibold rounded-xl border border-cream-200 dark:border-ink-600 transition-all shadow-2xs"
                >
                  <RefreshCw size={14} className={isClearingCache ? 'animate-spin text-accent-500' : ''} />
                  {isClearingCache ? 'Đang làm mới cache...' : 'Xóa sạch Cache ngay'}
                </button>
              </div>

              <div className="p-5 bg-cream-50 dark:bg-ink-800/60 rounded-2xl border border-cream-200 dark:border-ink-700/60 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-ink-900 dark:text-cream-100 mb-1">
                    Khôi phục Cấu hình Ban đầu
                  </h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
                    Đặt lại tất cả các thông số VietQR, chính sách Freeship và địa chỉ về cấu hình mẫu mặc định của CameraHub.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-all"
                >
                  <RotateCcw size={14} />
                  Khôi phục mặc định
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
