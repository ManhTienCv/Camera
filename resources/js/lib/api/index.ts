export * from './client';
export * from './auth.api';
export * from './products.api';
export * from './orders.api';
export * from './chat.api';
export * from './admin.api';

import { authApi } from './auth.api';
import { productsApi } from './products.api';
import { ordersApi } from './orders.api';
import { chatApi } from './chat.api';
import { adminApi } from './admin.api';
import { apiCache } from './client';

export const api = {
  ...authApi,
  ...productsApi,
  ...ordersApi,
  ...chatApi,
  ...adminApi,
  clearCache: () => {
    apiCache.clear();
  },
};

export default api;
