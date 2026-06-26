import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

let refreshPromise: Promise<string> | null = null;

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        clearSession();
        return Promise.reject(error);
      }

      refreshPromise = client
        .post<{ data: { accessToken: string; refreshToken: string } }>('/auth/refresh', {
          refreshToken,
        })
        .then((res) => {
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          return accessToken;
        })
        .catch((refreshError: unknown) => {
          clearSession();
          return Promise.reject(refreshError);
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newToken = await refreshPromise;
      if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
      return client(original);
    } catch {
      return Promise.reject(error);
    }
  },
);

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
}

export default client;
