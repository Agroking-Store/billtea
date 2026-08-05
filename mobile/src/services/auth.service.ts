import { apiClient } from '../api/client';
import { TOKEN_KEYS } from '../constants/keys';
import { setStorageItemAsync, deleteStorageItemAsync } from '../utils/storage';

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });

    if (response.data && response.data.accessToken) {
      // ✅ Uses localStorage on Web and SecureStore on Native
      await setStorageItemAsync(TOKEN_KEYS.ACCESS, response.data.accessToken);
      
      if (response.data.refreshToken) {
        await setStorageItemAsync(TOKEN_KEYS.REFRESH, response.data.refreshToken);
      }
    }

    return response.data;
  },

  async logout() {
    try {
      await deleteStorageItemAsync(TOKEN_KEYS.ACCESS);
      await deleteStorageItemAsync(TOKEN_KEYS.REFRESH);
    } catch (error) {
      console.error('Error clearing tokens during logout:', error);
    }
  },
};