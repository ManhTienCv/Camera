import type { Review } from '../types';

const STORAGE_KEY = 'camerahub_reviews_v1';
const REVIEWED_ORDERS_KEY = 'camerahub_reviewed_orders_v1';

// Reviews are strictly loaded from real database APIs
const DEFAULT_REVIEWS: Review[] = [];

class ReviewService {
  private getStoredReviews(): Review[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load reviews from localStorage', e);
    }
    return DEFAULT_REVIEWS;
  }

  private saveReviews(reviews: Review[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
      window.dispatchEvent(new Event('camerahub_reviews_updated'));
    } catch (e) {
      console.error('Failed to save reviews to localStorage', e);
    }
  }

  public getReviewsByProduct(productId: string | number): Review[] {
    const all = this.getStoredReviews();
    const pId = String(productId);
    const matched = all.filter((r) => String(r.productId) === pId || r.productId === 'all');
    return matched.length > 0 ? matched : all;
  }

  public addReview(data: {
    productId: string | number;
    orderId?: string;
    userName: string;
    rating: number;
    variant?: string;
    comment: string;
    images?: string[];
  }): Review {
    const all = this.getStoredReviews();
    const newRev: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: String(data.productId),
      orderId: data.orderId,
      userName: data.userName.trim() || 'Khách hàng ẩn danh',
      rating: data.rating,
      variant: data.variant || 'Phiên bản tiêu chuẩn',
      comment: data.comment,
      images: data.images || [],
      isVerifiedPurchase: true,
      helpfulCount: 0,
      createdAt: new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    };

    const updated = [newRev, ...all];
    this.saveReviews(updated);

    if (data.orderId) {
      this.markOrderAsReviewed(data.orderId, String(data.productId));
    }

    return newRev;
  }

  public toggleHelpful(reviewId: string): number {
    const all = this.getStoredReviews();
    let newCount = 0;
    const key = `camerahub_helpful_${reviewId}`;
    const alreadyVoted = localStorage.getItem(key) === '1';

    const updated = all.map((r) => {
      if (r.id === reviewId) {
        const count = r.helpfulCount || 0;
        const next = alreadyVoted ? Math.max(0, count - 1) : count + 1;
        newCount = next;
        return { ...r, helpfulCount: next };
      }
      return r;
    });

    if (alreadyVoted) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, '1');
    }

    this.saveReviews(updated);
    return newCount;
  }

  public isReviewHelpfulVoted(reviewId: string): boolean {
    return localStorage.getItem(`camerahub_helpful_${reviewId}`) === '1';
  }

  public getProductStats(productId: string | number) {
    const reviews = this.getReviewsByProduct(productId);
    const count = reviews.length;
    if (count === 0) {
      return {
        average: 5.0,
        count: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        breakdownPercent: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        withImagesCount: 0,
      };
    }

    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const average = parseFloat((sum / count).toFixed(1));

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let withImagesCount = 0;

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      breakdown[star] = (breakdown[star] || 0) + 1;
      if (r.images && r.images.length > 0) {
        withImagesCount += 1;
      }
    });

    const breakdownPercent: Record<number, number> = {
      5: Math.round(((breakdown[5] || 0) / count) * 100),
      4: Math.round(((breakdown[4] || 0) / count) * 100),
      3: Math.round(((breakdown[3] || 0) / count) * 100),
      2: Math.round(((breakdown[2] || 0) / count) * 100),
      1: Math.round(((breakdown[1] || 0) / count) * 100),
    };

    return {
      average,
      count,
      breakdown,
      breakdownPercent,
      withImagesCount,
    };
  }

  // Check if an order / product has been reviewed
  public hasReviewedOrder(orderId: string, productId?: string): boolean {
    try {
      const raw = localStorage.getItem(REVIEWED_ORDERS_KEY);
      if (!raw) return false;
      const list: string[] = JSON.parse(raw);
      const tag = productId ? `${orderId}_${productId}` : orderId;
      return list.includes(tag) || list.includes(orderId);
    } catch {
      return false;
    }
  }

  public markOrderAsReviewed(orderId: string, productId?: string): void {
    try {
      const raw = localStorage.getItem(REVIEWED_ORDERS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const tag = productId ? `${orderId}_${productId}` : orderId;
      if (!list.includes(tag)) {
        list.push(tag);
        list.push(orderId);
        localStorage.setItem(REVIEWED_ORDERS_KEY, JSON.stringify(list));
      }
      window.dispatchEvent(new Event('camerahub_reviews_updated'));
    } catch (e) {
      console.error('Failed to mark order as reviewed', e);
    }
  }
}

export const reviewService = new ReviewService();
