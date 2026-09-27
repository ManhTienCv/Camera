import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Upload } from 'lucide-react';
import type { Product, Category } from '../../../types';
import { useToast } from '../../../context/ToastContext';

export interface ProductFormModalProps {
  show: boolean;
  editingProduct: Product | null;
  categories: Category[];
  formData: {
    name: string;
    category_id: string;
    brand: string;
    price: string;
    original_price: string;
    stock: string;
    description: string;
    image_url: string;
    status: string;
    gallery: string[];
    features: string[];
    specs: { key: string; value: string }[];
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  show,
  editingProduct,
  categories,
  formData,
  setFormData,
  onSubmit,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (!show) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev: any) => ({
            ...prev,
            gallery: [...(prev.gallery || []), reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    const updated = [...(formData.gallery || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, gallery: updated });
  };

  const handleAddFeature = () => {
    setFormData({
      ...formData,
      features: [...(formData.features || []), ''],
    });
  };

  const handleRemoveFeature = (index: number) => {
    const updated = [...(formData.features || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, features: updated });
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...(formData.features || [])];
    updated[index] = val;
    setFormData({ ...formData, features: updated });
  };

  const handleAddSpec = () => {
    setFormData({
      ...formData,
      specs: [...(formData.specs || []), { key: '', value: '' }],
    });
  };

  const handleRemoveSpec = (index: number) => {
    const updated = [...(formData.specs || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, specs: updated });
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...(formData.specs || [])];
    updated[index][field] = val;
    setFormData({ ...formData, specs: updated });
  };

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-ink-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl animate-scale-in border border-cream-200 dark:border-ink-800 my-auto max-h-[90vh] flex flex-col cursor-default text-ink-900 dark:text-cream-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 dark:border-ink-800 flex-shrink-0">
          <div>
            <h3 className="text-xl font-display font-bold text-ink-900 dark:text-cream-50">
              {editingProduct ? 'Chỉnh sửa bài đăng sản phẩm' : 'Đăng sản phẩm máy ảnh mới'}
            </h3>
            <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">Cập nhật đầy đủ hình ảnh, đặc điểm nổi bật và thông số kỹ thuật</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-cream-100 p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="py-4 space-y-6 overflow-y-auto flex-1 pr-2">
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">1. Thông tin cơ bản & Phân loại</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Tên máy ảnh / Ống kính *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Sony Alpha A7 IV Body"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Thương hiệu *</label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="Sony">Sony</option>
                  <option value="Canon">Canon</option>
                  <option value="Fujifilm">Fujifilm</option>
                  <option value="Nikon">Nikon</option>
                  <option value="DJI">DJI</option>
                  <option value="Leica">Leica</option>
                  <option value="Panasonic">Panasonic</option>
                  <option value="Sigma">Sigma</option>
                  <option value="Tamron">Tamron</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Danh mục sản phẩm *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="input-field text-sm"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Trạng thái kinh doanh *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="active">Đang kinh doanh (Active)</option>
                  <option value="inactive">Tạm ẩn (Inactive)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: GIÁ & KHO HÀNG */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">2. Giá bán & Tồn kho</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Giá bán hiện tại (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="59990000"
                  className="input-field text-sm font-semibold text-accent-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Giá gốc(VNĐ)</label>
                <input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="65000000"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Số lượng trong kho (Chiếc) *</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="10"
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: HÌNH ẢNH & BỘ SƯU TẬP */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">3. Hình ảnh sản phẩm (Upload hoặc URL)</h4>

            {/* Ảnh đại diện chính */}
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">Ảnh đại diện chính (Cover Image) *</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://... hoặc bấm tải ảnh bên phải"
                  className="input-field text-sm flex-1"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 border border-cream-300 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Tải ảnh lên</span>
                </button>
              </div>
              {formData.image_url && (
                <div className="mt-2.5 w-24 h-24 rounded-2xl overflow-hidden border border-cream-300 bg-cream-50">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Gallery ảnh kèm theo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink-700">Bộ sưu tập ảnh chi tiết (Gallery)</label>
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleGalleryUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-xs font-bold text-accent-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={12} />
                  <span>+ Tải thêm ảnh chi tiết</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {(formData.gallery || []).map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-cream-200 group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: ĐẶC ĐIỂM NỔI BẬT */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">4. Đặc điểm nổi bật (Key Features)</h4>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-xs font-bold text-accent-500 hover:underline"
              >
                + Thêm đặc điểm
              </button>
            </div>

            <div className="space-y-2">
              {(formData.features || []).map((feat, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder="Ví dụ: Cảm biến Full-frame Exmor R 33MP thế hệ mới"
                    className="input-field text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-2 text-ink-400 hover:text-rose-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: THÔNG SỐ KỸ THUẬT CHI TIẾT */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">5. Thông số kỹ thuật chi tiết</h4>
              <button
                type="button"
                onClick={handleAddSpec}
                className="text-xs font-bold text-accent-500 hover:underline"
              >
                + Thêm thông số
              </button>
            </div>

            <div className="space-y-2">
              {(formData.specs || []).map((spec, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    placeholder="Tên (Cảm biến...)"
                    className="input-field text-sm col-span-2 font-semibold"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    placeholder="Giá trị (Full-frame 33MP...)"
                    className="input-field text-sm col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-2 text-ink-400 hover:text-rose-600 col-span-1 justify-self-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: MÔ TẢ BÀI VIẾT CHI TIẾT */}
          <div className="space-y-2 pt-4 border-t border-cream-200">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">6. Bài viết mô tả sản phẩm chi tiết</h4>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập bài viết đánh giá chi tiết sản phẩm máy ảnh..."
              className="input-field text-sm resize-none"
            />
          </div>

          <div className="pt-4 border-t border-cream-200 dark:border-ink-800 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-cream-300 dark:border-ink-700 rounded-xl text-sm font-medium text-ink-700 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-ink-800 cursor-pointer transition-colors"
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn-accent px-6 py-2.5 text-sm font-semibold rounded-xl shadow-sm cursor-pointer active:scale-98 transition-all">
              {editingProduct ? 'Lưu bài đăng sản phẩm' : 'Đăng sản phẩm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
