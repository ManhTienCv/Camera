import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Upload, Plus, Tag } from 'lucide-react';
import type { Product, Category, Brand } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';

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

  const [brands, setBrands] = useState<{ id: string | number; name: string }[]>([]);
  const [isCustomBrand, setIsCustomBrand] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getBrands()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setBrands(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBrands([
            { id: 1, name: 'Sony' },
            { id: 2, name: 'Canon' },
            { id: 3, name: 'Fujifilm' },
            { id: 4, name: 'Nikon' },
            { id: 5, name: 'DJI' },
            { id: 6, name: 'Leica' },
            { id: 7, name: 'Panasonic' },
            { id: 8, name: 'Sigma' },
            { id: 9, name: 'Tamron' },
            { id: 10, name: 'GoPro' },
            { id: 11, name: 'SanDisk' },
            { id: 12, name: 'Peak Design' },
          ]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (show && formData.brand && brands.length > 0) {
      const match = brands.some(
        (b) => b.name.toLowerCase() === formData.brand.trim().toLowerCase()
      );
      if (!match && formData.brand !== 'Khác') {
        setIsCustomBrand(true);
      }
    }
  }, [show, formData.brand, brands]);

  if (!show) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev: any) => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.warning(`Ảnh "${file.name}" vượt quá 5MB và đã bị bỏ qua.`);
          return;
        }
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
    e.target.value = '';
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData((prev: any) => {
      const updated = [...(prev.gallery || [])];
      updated.splice(index, 1);
      return { ...prev, gallery: updated };
    });
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.warning('Vui lòng tải lên ảnh đại diện chính (Cover Image) cho sản phẩm!');
      return;
    }
    onSubmit(e);
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

        <form onSubmit={handleFormSubmit} className="py-4 space-y-6 overflow-y-auto flex-1 pr-2">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-ink-700 uppercase">Thương hiệu *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCustomBrand;
                      setIsCustomBrand(next);
                      if (next) {
                        setFormData({ ...formData, brand: '' });
                      } else {
                        setFormData({ ...formData, brand: brands[0]?.name || 'Sony' });
                      }
                    }}
                    className="text-[11px] font-semibold text-accent-600 hover:text-accent-700 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isCustomBrand ? 'Chọn từ danh sách' : '+ Thêm hiệu mới'}
                  </button>
                </div>

                {isCustomBrand ? (
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Nhập tên hãng mới (VD: Hasselblad, Insta360...)"
                      className="input-field text-sm border-accent-300 focus:border-accent-500"
                      autoFocus
                    />
                  </div>
                ) : (
                  <select
                    value={formData.brand}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomBrand(true);
                        setFormData({ ...formData, brand: '' });
                      } else {
                        setFormData({ ...formData, brand: e.target.value });
                      }
                    }}
                    className="input-field text-sm"
                  >
                    {brands.length > 0 ? (
                      brands.map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Sony">Sony</option>
                        <option value="Canon">Canon</option>
                        <option value="Fujifilm">Fujifilm</option>
                        <option value="Nikon">Nikon</option>
                        <option value="DJI">DJI</option>
                        <option value="Leica">Leica</option>
                        <option value="Panasonic">Panasonic</option>
                        <option value="Sigma">Sigma</option>
                        <option value="Tamron">Tamron</option>
                        <option value="GoPro">GoPro</option>
                      </>
                    )}
                    <option value="Khác">Khác</option>
                    <option value="__custom__" className="font-bold text-accent-600">
                      + Nhập thương hiệu mới...
                    </option>
                  </select>
                )}
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
          <div className="space-y-4 pt-4 border-t border-cream-200 dark:border-ink-800">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">3. Hình ảnh sản phẩm (Tải lên)</h4>

            {/* Ảnh đại diện chính */}
            <div>
              <label className="block text-xs font-bold text-ink-700 dark:text-cream-200 mb-1.5 uppercase">
                Ảnh đại diện chính (Cover Image) *
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {!formData.image_url ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-cream-300 dark:border-ink-700 hover:border-accent-500 dark:hover:border-accent-400 bg-cream-50/50 dark:bg-ink-900/40 hover:bg-accent-50/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-ink-800 border border-cream-300 dark:border-ink-700 group-hover:border-accent-400 flex items-center justify-center text-accent-500 shadow-2xs group-hover:scale-110 transition-transform">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-900 dark:text-cream-50 group-hover:text-accent-600 transition-colors">
                      Bấm vào đây để tải ảnh đại diện lên *
                    </p>
                    <p className="text-[11px] text-ink-400 mt-0.5">
                      Hỗ trợ PNG, JPG, JPEG, WEBP (Tối đa 5MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-cream-200 dark:border-ink-700 bg-cream-50 dark:bg-ink-800 shadow-xs group">
                    <img
                      src={formData.image_url}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Nút xóa nhỏ trên đầu ảnh */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image_url: '' });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-rose-600 hover:bg-rose-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                      title="Xóa ảnh đại diện"
                    >
                      <X size={15} />
                    </button>
                    {/* Nút đổi ảnh ở chân ảnh */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 left-2 right-2 py-1 bg-black/65 hover:bg-black/85 backdrop-blur-xs text-white text-[11px] font-semibold rounded-lg text-center transition-all cursor-pointer"
                    >
                      Đổi ảnh khác
                    </button>
                  </div>
                  <div className="text-xs text-ink-500 space-y-1">
                    <p className="font-bold text-ink-800 dark:text-cream-100">Đã chọn ảnh đại diện chính</p>
                    <p className="text-[11px] text-ink-400 max-w-xs">
                      Bấm nút <span className="text-rose-600 font-bold">X</span> màu đỏ trên đầu ảnh để xóa hoặc bấm "Đổi ảnh khác" để chọn ảnh mới từ máy.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery ảnh kèm theo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink-700 dark:text-cream-200 uppercase">
                  Bộ sưu tập ảnh chi tiết (Gallery)
                </label>
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleGalleryUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-xs font-bold text-accent-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={13} />
                  <span>+ Tải thêm ảnh chi tiết</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {(formData.gallery || []).map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-cream-200 dark:border-ink-700 shadow-2xs group">
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    {/* Nút xóa nhỏ trên đầu ảnh */}
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-600 hover:bg-rose-700 active:scale-90 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md z-10"
                      title="Xóa ảnh này"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-cream-300 dark:border-ink-700 hover:border-accent-500 rounded-2xl flex flex-col items-center justify-center gap-1 bg-cream-50/50 dark:bg-ink-900/30 hover:bg-accent-50/20 text-ink-500 hover:text-accent-600 transition-all cursor-pointer group"
                >
                  <Upload size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">+ Thêm ảnh</span>
                </button>
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
