export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  products_count?: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  original_price: number | null;
  category_id: string;
  category_name?: string;
  image_url: string;
  gallery: string[];
  specs: Record<string, string>;
  features: string[];
  rating: number;
  review_count: number;
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  status?: string;
  created_at?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at?: string;
  product?: Product;
}

export interface Cart {
  id: string;
  session_id: string;
  created_at?: string;
  updated_at?: string;
  items?: CartItem[];
}

export interface Order {
  id: string;
  order_code?: string;
  session_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  payment_method?: string;
  payment_status?: string;
  total_amount: number;
  shipping_fee?: number;
  discount_amount?: number;
  shipping_partner?: string;
  tracking_code?: string;
  ghn_order_code?: string;
  expected_delivery_time?: string;
  status: string;
  order_status?: string;
  cancel_reason?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  refund_ref_code?: string;
  refunded_at?: string;
  items: OrderItem[];
  created_at?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface User {
  id: string;
  customerCode?: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  hasPassword?: boolean;
  createdAt?: string;
  totalOrders?: number;
  addresses?: Address[];
}

export interface Address {
  id: string;
  userId?: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Review {
  id: string;
  productId: string;
  orderId?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  variant?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at?: string;
  sender?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  receiver?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ChatUserItem {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export interface CategoryRevenueItem {
  category_id: number;
  category_name: string | null;
  total_revenue: number;
  total_qty: number;
}

export interface PeriodRevenueItem {
  date?: string;
  month?: string;
  year?: string;
  total_revenue: number;
  order_count: number;
}

export interface TopSellingProductItem {
  id: number;
  name: string;
  image_url?: string | null;
  price: number;
  sold_qty: number;
  total_revenue: number;
}

export interface ReportSummaryData {
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  categoryRevenue: CategoryRevenueItem[];
  revenueByDate: PeriodRevenueItem[];
  revenueByMonth: PeriodRevenueItem[];
  revenueByYear: PeriodRevenueItem[];
  topSellingProducts?: TopSellingProductItem[];
  isMock?: boolean;
}

export interface ReportChartsData {
  catLabels: string[];
  catRevenue: number[];
  revDateLabels: string[];
  revDateData: number[];
  revMonthLabels: string[];
  revMonthData: number[];
  revYearLabels: string[];
  revYearData: number[];
  paymentMethodLabels: string[];
  paymentMethodRevenue: number[];
  isMock?: boolean;
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'customer' | 'user';
  created_at?: string;
}

export interface AdminVoucherItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface AdminReviewItem {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_avatar?: string | null;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  product_sku?: string | null;
  rating: number;
  variant: string;
  comment: string;
  images: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  status: 'approved' | 'hidden';
  admin_reply?: string | null;
  replied_at?: string | null;
  created_at: string;
}

export interface FinanceFilterParams {
  search?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: string | number;
  max_amount?: string | number;
  gateway?: string;
  payment_status?: string;
  sort?: string;
  page?: number;
}

export interface FinanceSummaryData {
  filters: Record<string, any>;
  summary: {
    order_count: number;
    total_amount: number;
  };
  statusTotals: Record<string, { order_count: number; total_amount: number }>;
  methodTotals: Record<string, { order_count: number; total_amount: number; paid_amount: number }>;
  statuses: Record<string, string>;
  methods: Record<string, string>;
}

export interface FinanceTransactionItem {
  id: number;
  order_code: string;
  user_id: number | null;
  customer_name: string;
  name: string;
  customer_email: string;
  customer_phone: string;
  phone: string;
  shipping_address: string;
  city: string;
  payment_method: string;
  total_amount: number;
  total_price: number;
  order_status: string;
  status: string;
  payment_id: number | null;
  paid_at: string | null;
  gateway: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceTransactionsData {
  orders: {
    data: FinanceTransactionItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  filters: Record<string, any>;
  statuses: Record<string, string>;
  codTransitions: Record<string, string[]>;
  methods: Record<string, string>;
}

export type Page =
  | { name: 'home' }
  | { name: 'catalog'; categorySlug?: string; brand?: string }
  | { name: 'product'; slug: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'order-success'; orderId: string }
  | { name: 'search'; query: string }
  | { name: 'orders' }
  | { name: 'profile'; tab?: 'profile' | 'addresses' | 'orders' }
  | { name: 'admin'; tab?: 'dashboard' | 'products' | 'categories' | 'orders' | 'vouchers' | 'reviews' | 'settings' | 'reports' | 'finance' | 'users' | 'chat' };

