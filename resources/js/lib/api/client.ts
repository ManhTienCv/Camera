export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1';

// Session ID for cart persistence
export function getSessionId(): string {
  let id = localStorage.getItem('camera_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('camera_session_id', id);
  }
  return id;
}

export function getAuthToken(url?: string): string | null {
  if (url && (url.startsWith('/admin') || url.includes('/admin/'))) {
    return localStorage.getItem('camera_admin_token');
  }
  return localStorage.getItem('camera_auth_token');
}

// Helper to safely serialize query parameters without passing undefined, null, or empty string
export function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const cleanParams: Record<string, string> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== 'null') {
      cleanParams[key] = String(val);
    }
  }
  const qs = new URLSearchParams(cleanParams).toString();
  return qs ? `?${qs}` : '';
}

// In-memory cache for GET requests to eliminate page switch flashing
export const apiCache = new Map<string, { data: any; timestamp: number }>();
export const CACHE_TTL = 60000; // 60 seconds

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  const isRealtime = url.includes('/chat');
  const shouldBypassCache = isRealtime || url.includes('refresh=');
  if (isGet && !shouldBypassCache && apiCache.has(url)) {
    const cached = apiCache.get(url)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const token = getAuthToken(url);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Session-ID': getSessionId(),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (url.startsWith('/admin') || url.includes('/admin/')) {
        localStorage.removeItem('camera_admin_token');
        localStorage.removeItem('camera_admin_user');
        window.dispatchEvent(new Event('camera_admin_session_expired'));
      } else {
        localStorage.removeItem('camera_auth_token');
        localStorage.removeItem('camera_auth_user');
        window.dispatchEvent(new Event('camera_user_session_expired'));
      }
    }

    let errMsg = `API error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.message) errMsg = errData.message;
    } catch (_) {}
    const error: any = new Error(errMsg);
    error.status = response.status;
    error.isUnauthorized = response.status === 401;
    throw error;
  }

  const data = await response.json();
  if (isGet) {
    apiCache.set(url, { data, timestamp: Date.now() });
  } else {
    // If mutating data, clear cache so fresh data is fetched
    apiCache.clear();
  }

  return data;
}
