import { apiClient } from '../api/client';
import { TOKEN_KEYS } from '../constants/keys';
import * as ExpoSecureStore from 'expo-secure-store';
export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });

    if (response.data && response.data.accessToken) {
      await ExpoSecureStore.setItemAsync(TOKEN_KEYS.ACCESS, response.data.accessToken);
      if (response.data.refreshToken) {
        await ExpoSecureStore.setItemAsync(TOKEN_KEYS.REFRESH, response.data.refreshToken);
      }
    }

    return response.data;
  },

  async checkDuplicate(email: string, phoneNumber: string) {
    const response = await apiClient.post('/auth/check-duplicate', { email, phoneNumber });
    return response.data;
  },

  async sendOtp(email: string, phoneNumber: string) {
    const response = await apiClient.post('/auth/send-otp', { email, phoneNumber });
    return response.data;
  },

  async verifyOtp(emailOtp: string, mobileOtp: string) {
    const response = await apiClient.post('/auth/verify-otp', { emailOtp, mobileOtp });
    return response.data;
  },

  async register(formData: Record<string, string>) {
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value ?? '');
    });

    const response = await apiClient.post('/auth/register', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data && response.data.accessToken) {
      await ExpoSecureStore.setItemAsync(TOKEN_KEYS.ACCESS, response.data.accessToken);
      if (response.data.refreshToken) {
        await ExpoSecureStore.setItemAsync(TOKEN_KEYS.REFRESH, response.data.refreshToken);
      }
    }

    return response.data;
  },
};