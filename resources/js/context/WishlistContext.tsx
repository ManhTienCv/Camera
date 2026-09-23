import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  loading: boolean;
  isInWishlist: (productId: string | number) => boolean;
  toggleWishlist: (product: Product) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setWishlistIds([]);
      setWishlistProducts([]);
      return;
    }

    try {
      setLoading(true);
      const ids = await api.getWishlistIds();
      setWishlistIds(ids.map(String));
    } catch (err) {
      console.warn('Could not load wishlist ids:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: string | number) => {
      return wishlistIds.includes(String(productId));
    },
    [wishlistIds]
  );

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích!');
      return false;
    }

    const pId = String(product.id);
    const currentlyIn = wishlistIds.includes(pId);

    // Optimistic UI update
    setWishlistIds((prev) =>
      currentlyIn ? prev.filter((id) => id !== pId) : [...prev, pId]
    );

    try {
      const res = await api.toggleWishlist(pId);
      if (res.in_wishlist) {
        toast.success(`Đã thêm "${product.name}" vào danh sách yêu thích!`);
      } else {
        toast.info(`Đã bỏ "${product.name}" khỏi danh sách yêu thích.`);
      }
      return res.in_wishlist;
    } catch (err: any) {
      // Revert optimistic update on failure
      setWishlistIds((prev) =>
        currentlyIn ? [...prev, pId] : prev.filter((id) => id !== pId)
      );
      toast.error('Có lỗi xảy ra khi cập nhật danh sách yêu thích.');
      return currentlyIn;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        loading,
        isInWishlist,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
