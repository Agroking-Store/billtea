import { apiClient } from '../api/client';
import { TOKEN_KEYS } from '../constants/keys';
import { setStorageItemAsync } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });

    if (response.data && response.data.accessToken) {
      await setStorageItemAsync(TOKEN_KEYS.ACCESS, response.data.accessToken);
      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      if (response.data.refreshToken) {
        await setStorageItemAsync(TOKEN_KEYS.REFRESH, response.data.refreshToken);
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }

    return response.data;
  },

  async sendForgotPasswordOtp(email: string) {
    const response = await apiClient.post('/auth/forgot-password/send-otp', { email });
    return response.data;
  },

  async verifyForgotPasswordOtp(email: string, otp: string) {
    const response = await apiClient.post('/auth/forgot-password/verify-otp', { email, otp });
    return response.data;
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const response = await apiClient.post('/auth/forgot-password/reset-password', {
      email,
      otp,
      newPassword,
    });
    return response.data;
  },
};