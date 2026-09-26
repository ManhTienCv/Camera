import React from 'react';
import { ShoppingBag, Eye, Heart, ArrowLeftRight } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { StarRating } from './StarRating';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';

interface Props {
  product: Product;
  onView: (slug: string) => void;
}

export function ProductCard({ product, onView }: Props) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      onClick={() => onView(product.slug)}
      className="group card overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-100 dark:bg-ink-900">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.stock <= 0 ? (
            <span className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-full shadow-xs">
              Hết hàng
            </span>
          ) : (
            <>
              {product.is_new && (
                <span className="px-2.5 py-1 bg-ink-800 dark:bg-ink-700 text-cream-50 text-xs font-semibold rounded-full">
                  Mới
                </span>
              )}
              {discount > 0 && (
                <span className="px-2.5 py-1 bg-accent-500 text-white text-xs font-semibold rounded-full">
                  -{discount}%
                </span>
              )}
            </>
          )}
        </div>

        {/* Actions top right: Wishlist & Compare */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleToggleWishlist}
            title={inWishlist ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              inWishlist
                ? 'bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                : 'bg-white/85 dark:bg-ink-800/85 backdrop-blur-md text-ink-500 dark:text-ink-300 hover:text-rose-500 hover:bg-white dark:hover:bg-ink-700 border border-cream-200 dark:border-ink-700'
            }`}
          >
            <Heart size={15} className={inWishlist ? 'fill-rose-500 text-rose-500' : ''} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (inCompare) {
                removeFromCompare(product.id);
              } else {
                addToCompare(product);
              }
            }}
            title={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              inCompare
                ? 'bg-accent-500 text-white border border-accent-600 shadow-sm'
                : 'bg-white/85 dark:bg-ink-800/85 backdrop-blur-md text-ink-500 dark:text-ink-300 hover:text-accent-500 hover:bg-white dark:hover:bg-ink-700 border border-cream-200 dark:border-ink-700'
            }`}
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>

        <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/10 transition-all duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 text-cream-50 text-sm font-medium">
            <Eye size={16} /> Xem chi tiết
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-ink-400 dark:text-ink-400 font-medium uppercase tracking-wide mb-1">
          {product.brand}
        </p>
        <h3 className="font-display font-semibold text-ink-800 dark:text-ink-100 text-sm leading-snug mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 mb-3">
          <StarRating rating={product.rating} />
          <span className="text-xs text-ink-400 dark:text-ink-400">({product.review_count})</span>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="font-display font-bold text-ink-900 dark:text-ink-50 text-base">
              {formatCurrency(product.price)}
            </p>
            {product.original_price && (
              <p className="text-xs text-ink-400 dark:text-ink-500 line-through">
                {formatCurrency(product.original_price)}
              </p>
            )}
          </div>
          {product.stock > 0 ? (
            <button
              onClick={handleAdd}
              className="p-2.5 bg-ink-800 text-cream-50 dark:bg-accent-600 dark:hover:bg-accent-500 rounded-xl hover:bg-accent-500 transition-all duration-200 active:scale-90"
              aria-label="Thêm vào giỏ hàng"
            >
              <ShoppingBag size={16} />
            </button>
          ) : (
            <span className="px-2.5 py-1.5 bg-cream-200 text-ink-400 dark:bg-ink-800 dark:text-ink-500 text-xs font-semibold rounded-xl cursor-not-allowed">
              Hết hàng
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
