import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;
const REFRESH_URL = '/api/auth/admin/refresh';
const REFRESH_EARLY_MS = 60 * 1000; // refresh when < 60s of life is left
const SESSION_KEYS = ['auth_token', 'token', 'adminToken', 'user'];

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

// Plain instance without interceptors: the refresh call can never loop into itself.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

// ---------------------------------------------------------------- helpers
const getToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('token') ||
  localStorage.getItem('adminToken');

const setToken = (token) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('token', token);
};

// Single place that ends a session. The app (AuthContext/App) listens for 'auth:logout' and routes to /login.
const clearSession = () => {
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new Event('auth:logout'));
};

const msUntilExpiry = (token) => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(b64));
    return exp ? exp * 1000 - Date.now() : Infinity;
  } catch {
    return Infinity;
  }
};

// Only a real "refresh token rejected" answer may log the user out.
// Network errors, timeouts and 5xx must NOT, otherwise a flaky connection signs the user out.
const isAuthRejection = (err) => [401, 403].includes(err?.response?.status);

const isAuthUrl = (url = '') =>
  url.includes('/login') ||
  url.includes('/register') ||
  url.includes('/auth/') ||
  url.includes('/refresh');

// ---------------------------------------------------------------- refresh (single-flight, multi-tab safe)
let refreshPromise = null;

const runRefresh = async (staleToken) => {
  // Another tab may have refreshed while we waited for the lock: reuse its token.
  const current = getToken();
  if (current && current !== staleToken && msUntilExpiry(current) > REFRESH_EARLY_MS) {
    return current;
  }

  const res = await refreshClient.post(REFRESH_URL);
  const token = res?.data?.accessToken || res?.data?.token;
  if (!token) throw new Error('Refresh response had no access token');
  setToken(token);
  return token;
};

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    const stale = getToken();
    const task =
      typeof navigator !== 'undefined' && navigator.locks?.request
        ? navigator.locks.request('rcm-admin-refresh', () => runRefresh(stale))
        : runRefresh(stale);
    refreshPromise = task.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// ---------------------------------------------------------------- request: attach token, refresh early if needed
apiClient.interceptors.request.use(async (config) => {
  if (isAuthUrl(config.url || '')) return config;

  let token = getToken();

  if (token && msUntilExpiry(token) < REFRESH_EARLY_MS) {
    try {
      token = await refreshAccessToken();
    } catch (e) {
      if (isAuthRejection(e)) clearSession();
      throw e;
    }
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------- response: on 401 refresh once, retry once
apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    if (status !== 401 || !original || original.__rcmRetry || isAuthUrl(original.url || '')) {
      return Promise.reject(error);
    }
    original.__rcmRetry = true;

    try {
      const token = await refreshAccessToken();
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${token}`;
      return apiClient(original);
    } catch (e) {
      if (isAuthRejection(e)) clearSession();
      return Promise.reject(error);
    }
  }
);

// ---------------------------------------------------------------- keep idle / background tabs fresh
const keepFresh = () => {
  const token = getToken();
  if (token && msUntilExpiry(token) < REFRESH_EARLY_MS) {
    refreshAccessToken().catch((e) => {
      if (isAuthRejection(e)) clearSession();
    });
  }
};

if (typeof window !== 'undefined') {
  setInterval(keepFresh, 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') keepFresh();
  });
  window.addEventListener('online', keepFresh);
}

export default apiClient;