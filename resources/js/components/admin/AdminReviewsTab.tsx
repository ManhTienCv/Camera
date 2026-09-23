import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Search,
  RotateCw,
  X,
  Trash2,
  MessageCircle,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  CornerDownRight,
  ExternalLink,
} from 'lucide-react';
import type { AdminReviewItem } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const AdminReviewsTab: React.FC = () => {
  const toast = useToast();

  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    average: 5.0,
    approved_count: 0,
    hidden_count: 0,
    five_star_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters (matches media_1790132554619.png)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Modals state
  const [replyingReview, setReplyingReview] = useState<AdminReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deletingReview, setDeletingReview] = useState<AdminReviewItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const totalPages = Math.max(1, Math.ceil(reviews.length / itemsPerPage));
  const paginatedReviews = reviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.querySelector('main')?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, ratingFilter]);

  // Fetch Reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminReviews({
        q: searchTerm.trim() || undefined,
        status: statusFilter,
        rating: ratingFilter,
      });
      setReviews(res.reviews || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      if (err.isUnauthorized || (err.message && err.message.includes('Unauthorized'))) {
        return;
      }
      toast.error(err.message || 'Lỗi tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, ratingFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  // Toggle Visibility Status (Approved ⇄ Hidden)
  const handleToggleStatus = async (id: string | number) => {
    try {
      const res = await api.toggleAdminReviewStatus(id);
      toast.success(res.message);
      setReviews((prev) =>
        prev.map((r) => (r.id === String(id) ? { ...r, status: res.status } : r))
      );
      setStats((prev) => ({
        ...prev,
        approved_count: res.status === 'approved' ? prev.approved_count + 1 : Math.max(0, prev.approved_count - 1),
        hidden_count: res.status === 'hidden' ? prev.hidden_count + 1 : Math.max(0, prev.hidden_count - 1),
      }));
    } catch (err: any) {
      toast.error(err.message || 'Không thể thay đổi trạng thái đánh giá.');
    }
  };

  // Open Reply Modal
  const handleOpenReply = (review: AdminReviewItem) => {
    setReplyingReview(review);
    setReplyText(review.admin_reply || '');
  };

  // Submit Admin Reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview) return;
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.replyAdminReview(replyingReview.id, replyText.trim());
      toast.success(res.message);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === replyingReview.id
            ? { ...r, admin_reply: res.admin_reply, replied_at: res.replied_at }
            : r
        )
      );
      setReplyingReview(null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể lưu phản hồi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Review
  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    setIsSubmitting(true);
    try {
      await api.deleteAdminReview(deletingReview.id);
      toast.success('Đã xóa đánh giá thành công!');
      setDeletingReview(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Bar (matches media_1790132554619.png) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">
            Quản Lý Đánh Giá & Bình Luận
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Theo dõi trải nghiệm khách hàng, kiểm duyệt hình ảnh và phản hồi đánh giá sản phẩm
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReviews()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-cream-300 text-ink-700 bg-white hover:bg-cream-100 hover:text-ink-900 rounded-2xl text-sm font-semibold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Four Stat Cards (matches media_1790132554619.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng đánh giá */}
        <div className="bg-white rounded-2xl border border-cream-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-400 tracking-wider uppercase">
              TỔNG ĐÁNH GIÁ
            </span>
            <div className="text-3xl font-display font-bold text-ink-900 leading-none">
              {stats.total}
            </div>
            <p className="text-xs text-ink-400">
              Lưu trữ trên cơ sở dữ liệu MySQL
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cream-100 text-ink-500 flex items-center justify-center shrink-0">
            <MessageSquare size={22} />
          </div>
        </div>

        {/* Card 2: Điểm đánh giá TB */}
        <div className="bg-white rounded-2xl border border-cream-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-400 tracking-wider uppercase">
              ĐIỂM ĐÁNH GIÁ TB
            </span>
            <div className="text-3xl font-display font-bold text-amber-500 leading-none flex items-center gap-1.5">
              <span>{stats.average > 0 ? stats.average.toFixed(1) : '5.0'}</span>
              <span className="text-xl">★</span>
            </div>
            <p className="text-xs text-ink-400">
              {stats.five_star_count} đánh giá 5 sao tuyệt đối
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Star size={24} fill="currentColor" />
          </div>
        </div>

        {/* Card 3: Đang hiển thị */}
        <div className="bg-white rounded-2xl border border-cream-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-400 tracking-wider uppercase">
              ĐANG HIỂN THỊ
            </span>
            <div className="text-3xl font-display font-bold text-emerald-600 leading-none">
              {stats.approved_count}
            </div>
            <p className="text-xs text-ink-400">
              Công khai trên trang chi tiết sản phẩm
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Card 4: Đã ẩn / Vi phạm */}
        <div className="bg-white rounded-2xl border border-cream-200/90 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-400 tracking-wider uppercase">
              ĐÃ ẨN / VI PHẠM
            </span>
            <div className="text-3xl font-display font-bold text-red-600 leading-none">
              {stats.hidden_count}
            </div>
            <p className="text-xs text-ink-400">
              Bị ẩn khỏi trang thương mại điện tử
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* 3. Search and Dual Filter Pills Bar (matches media_1790132554619.png) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
          <input
            type="text"
            placeholder="Tìm người gửi, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 transition-colors shadow-xs placeholder:text-ink-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Pills */}
          <div className="inline-flex items-center p-1 bg-white border border-cream-200 rounded-2xl shadow-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-ink-900 text-white shadow-xs'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-cream-100/70'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-ink-900 text-white shadow-xs'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-cream-100/70'
              }`}
            >
              Đang hiển thị
            </button>
            <button
              onClick={() => setStatusFilter('hidden')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'hidden'
                  ? 'bg-ink-900 text-white shadow-xs'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-cream-100/70'
              }`}
            >
              Đã ẩn
            </button>
          </div>

          {/* Rating Pills */}
          <div className="inline-flex items-center p-1 bg-white border border-cream-200 rounded-2xl shadow-xs">
            <button
              onClick={() => setRatingFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                ratingFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Tất cả sao
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setRatingFilter(String(star))}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  ratingFilter === String(star)
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {star} ★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Reviews List or Empty State (matches media_1790132554619.png) */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-cream-200 p-6 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cream-200" />
                <div className="space-y-1.5">
                  <div className="w-32 h-4 bg-cream-200 rounded" />
                  <div className="w-20 h-3 bg-cream-100 rounded" />
                </div>
              </div>
              <div className="w-3/4 h-4 bg-cream-100 rounded" />
              <div className="w-1/2 h-3 bg-cream-100 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        /* Empty State matching media_1790132554619.png precisely */
        <div className="bg-white border border-cream-200 rounded-3xl py-20 px-6 text-center shadow-xs">
          <div className="w-20 h-20 bg-cream-100/70 rounded-full flex items-center justify-center mx-auto mb-4 text-ink-300">
            <MessageSquare size={38} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-ink-800 font-display">
            Chưa có đánh giá nào phù hợp
          </h3>
          <p className="text-xs sm:text-sm text-ink-400 mt-1 max-w-md mx-auto">
            Thử thay đổi bộ lọc tìm kiếm hoặc trạng thái kiểm duyệt
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((rev) => {
            const isApproved = rev.status === 'approved';

            return (
              <div
                key={rev.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all hover:shadow-md ${
                  isApproved ? 'border-cream-200/90' : 'border-red-200 bg-red-50/20'
                }`}
              >
                {/* Top Section: User Info, Product Info, Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: User Avatar & Details */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-accent-100 text-accent-700 font-bold flex items-center justify-center shrink-0 uppercase text-sm border border-accent-200">
                      {rev.customer_avatar ? (
                        <img
                          src={rev.customer_avatar}
                          alt={rev.customer_name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        rev.customer_name.slice(0, 2)
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink-900 text-sm">
                          {rev.customer_name}
                        </span>

                        {rev.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={11} />
                            Đã mua hàng
                          </span>
                        )}

                        <span className="text-[11px] text-ink-400">
                          {rev.created_at}
                        </span>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={15}
                              fill={s <= rev.rating ? 'currentColor' : 'none'}
                              className={s <= rev.rating ? 'text-amber-400' : 'text-cream-300'}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-ink-600 ml-1">
                          {rev.rating}.0
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Pill & Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleToggleStatus(rev.id)}
                      title="Bấm để Đổi trạng thái Ẩn / Hiển thị"
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <Eye size={13} />
                          <span>Đang hiển thị</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} />
                          <span>Đã ẩn</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenReply(rev)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-cream-100 hover:bg-cream-200 text-ink-700 rounded-full text-xs font-semibold transition cursor-pointer"
                    >
                      <CornerDownRight size={13} />
                      <span>{rev.admin_reply ? 'Sửa phản hồi' : 'Trả lời'}</span>
                    </button>

                    <button
                      onClick={() => setDeletingReview(rev)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-ink-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Xóa đánh giá"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Product Tag / Link */}
                <div className="mt-3.5 inline-flex items-center gap-2.5 px-3 py-1.5 bg-cream-50 rounded-xl border border-cream-200/80 text-xs">
                  {rev.product_image && (
                    <img
                      src={rev.product_image}
                      alt={rev.product_name}
                      className="w-6 h-6 object-cover rounded-md"
                    />
                  )}
                  <span className="font-semibold text-ink-800 line-clamp-1">
                    {rev.product_name}
                  </span>
                  {rev.variant && (
                    <span className="text-[11px] text-ink-400 hidden sm:inline">
                      ({rev.variant})
                    </span>
                  )}
                </div>

                {/* Review Comment */}
                <div className="mt-3 text-xs sm:text-sm text-ink-700 leading-relaxed font-sans">
                  {rev.comment}
                </div>

                {/* Attached Images (with Lightbox click) */}
                {rev.images && rev.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rev.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLightboxImage(imgUrl)}
                        className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-cream-200 hover:border-accent-500 transition-all cursor-pointer shadow-2xs"
                      >
                        <img
                          src={imgUrl}
                          alt="Review attached"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-ink-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ExternalLink size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Admin Official Reply (if any) */}
                {rev.admin_reply && (
                  <div className="mt-4 p-3.5 rounded-xl bg-accent-50/60 border-l-4 border-accent-500 text-xs space-y-1">
                    <div className="flex items-center justify-between text-accent-800 font-bold">
                      <span className="flex items-center gap-1.5">
                        <MessageCircle size={14} />
                        Phản hồi từ CameraHub:
                      </span>
                      {rev.replied_at && (
                        <span className="text-[10px] text-ink-400 font-normal">
                          {rev.replied_at}
                        </span>
                      )}
                    </div>
                    <p className="text-ink-700 leading-relaxed italic">
                      "{rev.admin_reply}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Toolbar */}
          {reviews.length > 0 && (
            <div className="p-4 px-6 bg-white rounded-2xl border border-cream-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-ink-600 font-medium">
                <div>
                  Hiển thị <span className="font-bold text-ink-900">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                  <span className="font-bold text-ink-900">{Math.min(currentPage * itemsPerPage, reviews.length)}</span> trên{' '}
                  <span className="font-bold text-ink-900">{reviews.length}</span> đánh giá
                </div>

                <div className="flex items-center gap-1.5 border-l border-cream-200 pl-3">
                  <span className="text-[11px] text-ink-400">Hiển thị:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-cream-50 border border-cream-200 rounded-lg text-xs font-bold text-ink-800 focus:outline-none focus:border-accent-500 cursor-pointer shadow-2xs"
                  >
                    <option value={5}>5 đánh giá / trang</option>
                    <option value={10}>10 đánh giá / trang</option>
                    <option value={20}>20 đánh giá / trang</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-cream-300 bg-white text-xs font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  ‹ Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-ink-900 text-white shadow-xs'
                        : 'bg-white text-ink-700 border border-cream-300 hover:bg-cream-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3.5 py-1.5 rounded-xl border border-cream-300 bg-white text-xs font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  Sau ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. REPLY MODAL */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-cream-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-cream-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
                  <CornerDownRight size={18} />
                </div>
                <h3 className="text-base font-bold text-ink-900 font-display">
                  Phản hồi đánh giá của {replyingReview.customer_name}
                </h3>
              </div>
              <button
                onClick={() => setReplyingReview(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-cream-200/50 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReply} className="p-6 space-y-4">
              {/* Review snippet */}
              <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 text-xs space-y-1 text-ink-600">
                <div className="font-bold text-ink-800">
                  {replyingReview.product_name} • {replyingReview.rating}★
                </div>
                <div className="italic line-clamp-2">
                  "{replyingReview.comment}"
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Nội dung phản hồi từ Cửa hàng *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập lời cảm ơn, hỗ trợ giải đáp hoặc hướng dẫn sử dụng sản phẩm..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 bg-cream-50/60 border border-cream-300 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-accent-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 border border-cream-300 text-ink-700 hover:bg-cream-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-accent px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw size={14} className="animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Gửi phản hồi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-cream-200 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink-900 font-display">
                Xóa đánh giá này?
              </h3>
              <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                Đánh giá của <strong>{deletingReview.customer_name}</strong> sẽ bị xóa vĩnh viễn và điểm đánh giá trung bình của sản phẩm sẽ được tự động tính toán lại.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="px-4 py-2 border border-cream-300 text-ink-700 hover:bg-cream-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Đồng ý xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-ink-900 flex items-center justify-center shadow-lg hover:bg-cream-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
