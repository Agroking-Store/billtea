import { apiClient } from '../api/client';
import { TOKEN_KEYS } from '../constants/keys';
import { setStorageItemAsync } from '../utils/storage';

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });

    if (response.data && response.data.accessToken) {
      await setStorageItemAsync(TOKEN_KEYS.ACCESS, response.data.accessToken);
      if (response.data.refreshToken) {
        await setStorageItemAsync(TOKEN_KEYS.REFRESH, response.data.refreshToken);
      }
    }

    return response.data;
  },
};