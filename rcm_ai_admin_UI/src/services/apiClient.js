import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 15000,
  withCredentials: true,
});

let isRefreshing = false;
let waiters = [];

const waitForRefresh = () =>
  new Promise((resolve, reject) => {
    waiters.push({ resolve, reject });
  });

const flush = (err, token) => {
  const w = waiters;
  waiters = [];
  w.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)));
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminAccessToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    if (
      status === 401 &&
      original &&
      !original.__rcmRetry &&
      !String(original.url || '').includes('/api/auth/refresh')
    ) {
      original.__rcmRetry = true;

      try {
        if (isRefreshing) {
          const token = await waitForRefresh();
          if (token) {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(original);
        }

        isRefreshing = true;
        const res = await apiClient.post('/api/auth/refresh', null, { withCredentials: true });
        const token = res?.data?.accessToken || res?.data?.token || null;
        if (token) localStorage.setItem('adminAccessToken', token);
        flush(null, token);
        isRefreshing = false;

        if (token) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(original);
      } catch (e) {
        isRefreshing = false;
        flush(e);
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminRole');
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

