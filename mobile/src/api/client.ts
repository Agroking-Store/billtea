import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    'ngrok-skip-browser-warning': 'true', // FIX 1: Required for ngrok tunnels
    'Bypass-Tunnel-Reminder': 'true',     // Kept in case localtunnel is used
  },
});

console.log('API_URL is:', ENV.API_URL);

// Add request interceptor for auth token and selected branch
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = await getStorageItemAsync(TOKEN_KEYS.ACCESS);
      if (!token) {
        token = await AsyncStorage.getItem('accessToken');
      }
      if (!token && Platform.OS === 'web' && typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      let branchId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        branchId = localStorage.getItem('selectedBranchId');
      }
      if (!branchId) {
        branchId = await AsyncStorage.getItem('selectedBranchId');
      }
      if (!branchId) {
        branchId = await getStorageItemAsync('selectedBranchId');
      }

      if (branchId && config.headers) {
        config.headers['x-branch-id'] = branchId;
      }
    } catch (error) {
      console.error('Error fetching token or branch from storage', error);
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
        let refreshToken = await getStorageItemAsync(TOKEN_KEYS.REFRESH);
        if (!refreshToken) {
          refreshToken = await AsyncStorage.getItem('refreshToken');
        }

        if (!refreshToken) {
          await useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        // FIX 2: Send ngrok header during token refresh as well
        const res = await axios.post(
          `${ENV.API_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );

        if (res.data?.accessToken) {
          await setStorageItemAsync(TOKEN_KEYS.ACCESS, res.data.accessToken);
          await AsyncStorage.setItem('accessToken', res.data.accessToken);
          if (res.data.refreshToken) {
            await setStorageItemAsync(TOKEN_KEYS.REFRESH, res.data.refreshToken);
            await AsyncStorage.setItem('refreshToken', res.data.refreshToken);
          }

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Clear tokens and update state if refresh fails
        await useAuthStore.getState().logout();
      }
    }

    if (!error.response) {
      console.error(
        `Network Error attempting to reach ${ENV.API_URL}${error.config?.url || ''}:`,
        error.message
      );
    }

    return Promise.reject(error);
  }
);