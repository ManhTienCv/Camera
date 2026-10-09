import type { Category, Product } from '../../types';
import { request } from './client';

export const productsApi = {
  // Categories
  getCategories: () => request<Category[]>('/categories'),
  getCategory: (slug: string) => request<{ category: Category; products: Product[] }>(`/categories/${slug}`),

  // Brands
  getBrands: () => request<Array<{ id: string; name: string; slug: string; logo_url: string | null }>>('/brands'),

  // Products
  getProducts: (params?: { category?: string; brand?: string; sort?: string; q?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.brand) searchParams.append('brand', params.brand);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.q) searchParams.append('q', params.q);
    const query = searchParams.toString();
    return request<Product[]>(`/products${query ? `?${query}` : ''}`);
  },

  getFeaturedProducts: (type: 'featured' | 'new' = 'featured') =>
    request<Product[]>(`/products/featured?type=${type}`),

  getBestSellers: (limit: number = 8) =>
    request<Product[]>(`/products/best-sellers?limit=${limit}`),

  searchProducts: (q: string) =>
    request<Product[]>(`/products/search?q=${encodeURIComponent(q)}`),

  getProductBySlug: (slug: string) =>
    request<Product>(`/products/${slug}`),

  getRelatedProducts: (id: string, limit: number = 4) =>
    request<Product[]>(`/products/${id}/related?limit=${limit}`),

  compareProducts: (ids: (string | number)[]) =>
    request<{
      products: Product[];
      allSpecs: string[];
    }>(`/products/compare?ids=${encodeURIComponent(ids.join(','))}`),

  checkWarranty: (query: string) =>
    request<{
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
    }>(`/warranty/check?query=${encodeURIComponent(query)}`),

  // Reviews (Database connected)
  getFeaturedReviews: (limit = 6) =>
    request<{
      success: boolean;
      reviews: Array<{
        id: string;
        name: string;
        role: string;
        avatar: string;
        product: string;
        productSlug?: string;
        rating: number;
        comment: string;
        verified: boolean;
        createdAt?: string;
      }>;
      count: number;
    }>(`/reviews/featured?limit=${limit}`),

  getProductReviews: (productId: string) =>
    request<{
      reviews: any[];
      stats: {
        average: number;
        count: number;
        breakdown: Record<number, number>;
        breakdownPercent: Record<number, number>;
        withImagesCount: number;
      };
    }>(`/products/${productId}/reviews`),

  createProductReview: (
    productId: string,
    data: { rating: number; comment: string; variant?: string; images?: string[] }
  ) =>
    request<{ message: string; review: any; newProductStats: { rating: number; review_count: number } }>(
      `/products/${productId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  voteReviewHelpful: (reviewId: string) =>
    request<{ success: boolean; helpful_count: number }>(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
    }),
};
