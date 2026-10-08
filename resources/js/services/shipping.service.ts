import { getStoreSettings } from '../lib/settings';

export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  tagline: string;
  baseFee: number;
  estimatedTime: string;
  isExpress?: boolean;
  logoColor: string;
  badgeText?: string;
}

export const AVAILABLE_CARRIERS: ShippingCarrier[] = [
  {
    id: 'ghn',
    name: 'Giao Hàng Nhanh (GHN Express)',
    code: 'GHN',
    tagline: 'Đối tác vận chuyển chính thức — Giao toàn quốc 1-3 ngày, đóng gói chống sốc và bảo hiểm 100% giá trị thiết bị',
    baseFee: 30000,
    estimatedTime: '1 - 3 ngày',
    logoColor: 'from-orange-500 to-amber-600',
    badgeText: 'Đối tác chính thức',
  },
];

export const FREE_SHIPPING_THRESHOLD = 1000000; // 1,000,000 VND

export interface ShippingCalculationParams {
  carrierId: string;
  subtotal: number;
  province?: string;
  weightGram?: number;
}

export function calculateShippingFee(params: ShippingCalculationParams): {
  fee: number;
  originalFee: number;
  isFree: boolean;
  carrier: ShippingCarrier;
} {
  const carrier =
    AVAILABLE_CARRIERS.find((c) => c.id === params.carrierId) || AVAILABLE_CARRIERS[0];
  const settings = getStoreSettings();
  const threshold = settings.freeShippingThreshold || FREE_SHIPPING_THRESHOLD;
  const originalFee =
    typeof settings.shippingFee === 'number' && settings.shippingFee >= 0
      ? settings.shippingFee
      : carrier.baseFee;

  // Freeship for orders >= freeShippingThreshold
  const isEligibleForFree = params.subtotal >= threshold;
  const fee = isEligibleForFree ? 0 : originalFee;

  return {
    fee,
    originalFee,
    isFree: isEligibleForFree,
    carrier,
  };
}

export interface TrackingStep {
  title: string;
  description: string;
  time: string;
  completed: boolean;
  current?: boolean;
}
