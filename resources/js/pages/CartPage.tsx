import { Trash2, ArrowRight, Minus, Plus, ShoppingBag, Lock } from 'lucide-react';
import type { Page } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';

interface Props {
  onNavigate: (page: Page) => void;
}

export function CartPage({ onNavigate }: Props) {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-cream-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-accent-600 border border-cream-200 shadow-xs">
          <Lock size={36} />
        </div>
        <h2 className="font-display font-bold text-2xl text-ink-900 mb-2">Yêu cầu đăng nhập</h2>
        <p className="text-ink-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Bạn cần đăng nhập tài khoản để xem giỏ hàng của mình và tiến hành đặt mua máy ảnh, thiết bị.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate({ name: 'catalog' })}
            className="btn-secondary px-6 py-3 text-sm font-bold cursor-pointer"
          >
            Tiếp tục xem sản phẩm
          </button>
          <button
            onClick={() => openAuthModal('login')}
            className="btn-accent px-8 py-3 text-sm font-bold shadow-md hover:shadow-lg cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={36} className="text-ink-400" />
        </div>
        <h2 className="font-display font-bold text-2xl text-ink-900 mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-ink-400 mb-8 max-w-md mx-auto">
          Hãy khám phá danh mục máy ảnh và phụ kiện phong phú để chọn cho mình sản phẩm ưng ý nhất.
        </p>
        <button onClick={() => onNavigate({ name: 'catalog' })} className="btn-primary">
          Khám phá sản phẩm
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-display font-bold text-3xl text-ink-900 mb-8">Giỏ hàng của bạn</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2">
            <span className="text-sm text-ink-500">{items.length} sản phẩm</span>
            <button
              onClick={() => clearCart()}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={14} /> Xóa tất cả
            </button>
          </div>

          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={item.id} className="card p-4 flex gap-4 items-center">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-xl bg-cream-100 shrink-0 cursor-pointer"
                  onClick={() => onNavigate({ name: 'product', slug: product.slug })}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-400 font-medium uppercase">{product.brand}</p>
                  <h3
                    onClick={() => onNavigate({ name: 'product', slug: product.slug })}
                    className="font-display font-semibold text-ink-900 text-sm truncate cursor-pointer hover:text-accent-500"
                  >
                    {product.name}
                  </h3>
                  <p className="font-display font-bold text-ink-900 text-sm mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-ink-200 dark:border-ink-700 rounded-lg overflow-hidden bg-white dark:bg-ink-800">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-700 dark:text-cream-200 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-sm font-semibold text-ink-800 dark:text-cream-100 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-700 dark:text-cream-200 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-ink-400 hover:text-rose-500 transition-colors"
                    aria-label="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h3 className="font-display font-bold text-lg text-ink-900 mb-4">Tóm tắt đơn hàng</h3>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-ink-600">
                <span>Tạm tính</span>
                <span className="font-semibold text-ink-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-accent-600">Miễn phí</span>
              </div>
              <div className="border-t border-ink-100 dark:border-ink-700 pt-3 flex justify-between text-base font-bold text-ink-900">
                <span>Tổng cộng</span>
                <span className="font-display text-xl text-accent-600">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                sessionStorage.removeItem('camerahub_checkout_deadline');
                onNavigate({ name: 'checkout' });
              }}
              className="w-full btn-accent py-3.5 mb-3 cursor-pointer"
            >
              Tiến hành thanh toán
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate({ name: 'catalog' })}
              className="w-full btn-secondary py-2.5 text-xs"
            >
              Tiếp tục mua hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
