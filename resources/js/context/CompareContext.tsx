import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { useToast } from './ToastContext';

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string | number) => void;
  clearCompare: () => void;
  isInCompare: (productId: string | number) => boolean;
  setCompareItems: React.Dispatch<React.SetStateAction<Product[]>>;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = 'camerahub_compare_items';
const MAX_COMPARE_ITEMS = 4;

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  const [compareItems, setCompareItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems));
    } catch (e) {
      console.warn('Could not save compare items to localStorage', e);
    }
  }, [compareItems]);

  const isInCompare = useCallback(
    (productId: string | number) => {
      const idStr = String(productId);
      return compareItems.some((item) => String(item.id) === idStr);
    },
    [compareItems]
  );

  const addToCompare = useCallback(
    (product: Product): boolean => {
      const idStr = String(product.id);
      if (compareItems.some((item) => String(item.id) === idStr)) {
        toast.info(`"${product.name}" đã có trong danh sách so sánh.`);
        return false;
      }

      if (compareItems.length >= MAX_COMPARE_ITEMS) {
        toast.warning(
          `Bạn chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm cùng lúc. Vui lòng xóa bớt sản phẩm để thêm mới!`
        );
        return false;
      }

      setCompareItems((prev) => [...prev, product]);
      toast.success(`Đã thêm "${product.name}" vào danh sách so sánh (${compareItems.length + 1}/${MAX_COMPARE_ITEMS}).`);
      return true;
    },
    [compareItems, toast]
  );

  const removeFromCompare = useCallback(
    (productId: string | number) => {
      const idStr = String(productId);
      setCompareItems((prev) => prev.filter((item) => String(item.id) !== idStr));
    },
    []
  );

  const clearCompare = useCallback(() => {
    setCompareItems([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        setCompareItems,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = (): CompareContextType => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
