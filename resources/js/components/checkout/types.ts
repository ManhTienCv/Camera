export interface VoucherItem {
  id: number;
  code: string;
  name: string;
  description: string;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
}

export interface AppliedVoucher {
  code: string;
  name: string;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  discount_amount: number;
  final_amount: number;
}
