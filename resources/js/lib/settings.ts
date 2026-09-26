export interface StoreSettings {
  // General Store Info
  storeName: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  socialFacebook: string;
  socialYoutube: string;
  socialZalo: string;

  // Shipping & Logistics
  shippingFee: number;
  freeShippingThreshold: number;
  ghnShopId: string;
  ghnDefaultWardCode: string;

  // Payment & Banking
  bankId: string;
  bankName: string;
  bankFullName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  isCodEnabled: boolean;
  isVietQrEnabled: boolean;
  isMomoEnabled: boolean;
  momoEnvironment: 'sandbox' | 'production';

  // Policies
  returnPolicy: string;

  // System & Operations
  maintenanceMode: boolean;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'CameraHub Vietnam',
  phone: '1900 6868',
  email: 'support@camerahub.vn',
  address: '123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  businessHours: '08:30 - 21:30 (Thứ 2 - Chủ Nhật)',
  socialFacebook: 'https://facebook.com/camerahub.vn',
  socialYoutube: 'https://youtube.com/@camerahub',
  socialZalo: 'https://zalo.me/0909123456',

  shippingFee: 30000,
  freeShippingThreshold: 5000000,
  ghnShopId: '190452',
  ghnDefaultWardCode: '20101',

  bankId: 'vietcombank',
  bankName: 'Vietcombank',
  bankFullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam (VCB)',
  bankAccountNumber: '88888888',
  bankAccountName: 'NGUYEN MANH TIEN',
  isCodEnabled: true,
  isVietQrEnabled: true,
  isMomoEnabled: true,
  momoEnvironment: 'sandbox',

  returnPolicy: 'Bảo hành chính hãng 24 tháng, 1 đổi 1 trong 30 ngày đối với lỗi kỹ thuật từ nhà sản xuất.',

  maintenanceMode: false,
};

export function getStoreSettings(): StoreSettings {
  try {
    const data = localStorage.getItem('camerahub_store_settings');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        shippingFee: Number(parsed.shippingFee) || DEFAULT_SETTINGS.shippingFee,
        freeShippingThreshold: Number(parsed.freeShippingThreshold) || DEFAULT_SETTINGS.freeShippingThreshold,
        isCodEnabled: parsed.isCodEnabled !== undefined ? Boolean(parsed.isCodEnabled) : DEFAULT_SETTINGS.isCodEnabled,
        isVietQrEnabled: parsed.isVietQrEnabled !== undefined ? Boolean(parsed.isVietQrEnabled) : DEFAULT_SETTINGS.isVietQrEnabled,
        isMomoEnabled: parsed.isMomoEnabled !== undefined ? Boolean(parsed.isMomoEnabled) : DEFAULT_SETTINGS.isMomoEnabled,
        maintenanceMode: parsed.maintenanceMode !== undefined ? Boolean(parsed.maintenanceMode) : DEFAULT_SETTINGS.maintenanceMode,
      };
    }
  } catch (e) {
    console.error('Failed to load store settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoreSettings(settings: Partial<StoreSettings>): StoreSettings {
  const current = getStoreSettings();
  const updated: StoreSettings = {
    ...current,
    ...settings,
    shippingFee: Number(settings.shippingFee ?? current.shippingFee),
    freeShippingThreshold: Number(settings.freeShippingThreshold ?? current.freeShippingThreshold),
  };
  try {
    localStorage.setItem('camerahub_store_settings', JSON.stringify(updated));
    window.dispatchEvent(new Event('store_settings_updated'));
  } catch (e) {
    console.error('Failed to save store settings:', e);
  }
  return updated;
}

export function resetStoreSettings(): StoreSettings {
  try {
    localStorage.removeItem('camerahub_store_settings');
    window.dispatchEvent(new Event('store_settings_updated'));
  } catch (e) {
    console.error('Failed to reset store settings:', e);
  }
  return DEFAULT_SETTINGS;
}
