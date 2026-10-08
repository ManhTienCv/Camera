import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Eye, Trash2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { Product, Page } from '../../types';
import { api } from '../../lib/api';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

interface ProfileWishlistTabProps {
  onNavigate: (page: Page) => void;
}

export const ProfileWishlistTab: React.FC<ProfileWishlistTabProps> = ({ onNavigate }) => {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tải danh sách sản phẩm yêu thích thực tế từ server
  useEffect(() => {
    let isMounted = true;

    const fetchWishlistProducts = async () => {
      setLoading(true);
      try {
        const data = await api.getWishlist();
        if (isMounted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Không thể tải danh sách yêu thích:', err);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWishlistProducts();

    return () => {
      isMounted = false;
    };
  }, [wishlistIds.length]);

  const handleRemove = async (product: Product) => {
    await toggleWishlist(product);
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(product.id)));
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  return (
    <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in transition-colors">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cream-100 dark:border-ink-800">
        <div>
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-rose-500 fill-rose-500" />
            <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
              Sản Phẩm Yêu Thích & Đã Lưu
            </h3>
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Danh sách các dòng máy ảnh và ống kính bạn quan tâm để dễ dàng theo dõi giá và đặt mua
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs">
          {products.length} Sản Phẩm Đã Lưu
        </span>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="p-12 text-center text-ink-400 dark:text-ink-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <span className="text-xs">Đang tải danh sách yêu thích...</span>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/30 text-rose-400 dark:text-rose-500 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/50 shadow-2xs">
            <Heart size={40} className="stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50">
              Chưa có sản phẩm yêu thích nào
            </h4>
            <p className="text-xs text-ink-500 dark:text-ink-400 max-w-md mx-auto">
              Hãy nhấn biểu tượng trái tim trên các sản phẩm máy ảnh để lưu lại danh sách bạn ưng ý nhất!
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'catalog' })}
            className="btn-accent px-6 py-3 rounded-2xl font-bold text-xs shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ShoppingBag size={15} />
            <span>Khám Phá Máy Ảnh Ngay</span>
          </button>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group border border-cream-200 dark:border-ink-800 rounded-2xl p-4 bg-cream-50/50 dark:bg-ink-950/40 hover:border-accent-400 dark:hover:border-accent-500 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image & Action Badges */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-ink-900 mb-3 border border-cream-200/60 dark:border-ink-800">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(product)}
                    title="Xóa khỏi danh sách yêu thích"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-ink-900/90 backdrop-blur-xs text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs border border-cream-200 dark:border-ink-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Details */}
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
                  {product.brand}
                </span>
                <h4
                  onClick={() => onNavigate({ name: 'product', slug: product.slug })}
                  className="font-display font-semibold text-sm text-ink-900 dark:text-cream-100 hover:text-accent-500 cursor-pointer truncate mt-0.5"
                >
                  {product.name}
                </h4>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display font-bold text-sm text-accent-600 dark:text-accent-400">
                    {formatCurrency(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xs text-ink-400 line-through">
                      {formatCurrency(product.original_price)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-cream-200/60 dark:border-ink-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 py-2 px-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <ShoppingBag size={13} />
                  <span>Thêm Vào Giỏ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'product', slug: product.slug })}
                  className="p-2 rounded-xl border border-cream-300 dark:border-ink-700 hover:bg-cream-100 dark:hover:bg-ink-800 text-ink-700 dark:text-cream-200 transition-colors cursor-pointer"
                  title="Xem chi tiết"
                >
                  <Eye size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
