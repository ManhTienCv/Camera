export interface OrderJourneyStep {
  time: string;
  title: string;
  desc: string;
  done: boolean;
  current?: boolean;
}

export interface EnhancedOrder {
  id: string;
  order_code: string;
  date: string;
  status: 'pending' | 'shipping' | 'delivered' | 'refund_pending' | 'cancelled';
  statusLabel: string;
  paymentStatus?: string;
  paymentMethodCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  refundRefCode?: string;
  refundedAt?: string;
  isReviewed?: boolean;
  review?: {
    id: string;
    rating: number;
    comment: string;
    images?: string[];
    createdAt?: string;
    adminReply?: string;
    repliedAt?: string;
  } | null;
  items: Array<{
    product_id?: string;
    categoryTag: string;
    name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  shippingPartner: string;
  trackingCode: string;
  paymentMethod: string;
  totalAmount: number;
  journey: OrderJourneyStep[];
  cancelReason?: string;
}
