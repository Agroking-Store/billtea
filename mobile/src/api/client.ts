import axios from 'axios';
import { ENV } from '../config/env';
import { getStorageItemAsync, setStorageItemAsync } from '../utils/storage';
import { TOKEN_KEYS } from '../constants/keys';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
});

console.log('API_URL is:', ENV.API_URL);

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getStorageItemAsync(TOKEN_KEYS.ACCESS);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getStorageItemAsync(TOKEN_KEYS.REFRESH);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh token
        const res = await axios.post(`${ENV.API_URL}/auth/refresh`, {
          refreshToken,
        });

        if (res.data?.accessToken) {
          await setStorageItemAsync(TOKEN_KEYS.ACCESS, res.data.accessToken);
          if (res.data.refreshToken) {
            await setStorageItemAsync(TOKEN_KEYS.REFRESH, res.data.refreshToken);
          }

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, we should logout the user (clear tokens and update state)
        await useAuthStore.getState().logout();
        console.error('Refresh token expired or invalid', refreshError);
      }
    }

    return Promise.reject(error);
  }
);