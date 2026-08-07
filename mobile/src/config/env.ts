import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ----------------------------------------------------------------------------
// 🔧 SET YOUR ACTIVE NGROK URL HERE (or leave empty to use local fallback)
// ----------------------------------------------------------------------------
const ACTIVE_NGROK_URL = 'https://YOUR-ACTUAL-NGROK-SUBDOMAIN.ngrok-free.app/api/v1';

function getApiUrl(): string {
  // 1. Environment variable override from .env (if defined & valid)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (
    envUrl &&
    !envUrl.includes('<IP_ADDR>') &&
    !envUrl.includes('your-ngrok-subdomain')
  ) {
    return envUrl;
  }

  // 2. Active Ngrok URL specified in constant above
  if (
    ACTIVE_NGROK_URL &&
    !ACTIVE_NGROK_URL.includes('your-ngrok-subdomain') &&
    ACTIVE_NGROK_URL !== 'https://YOUR-ACTUAL-NGROK-SUBDOMAIN.ngrok-free.app/api/v1'
  ) {
    return ACTIVE_NGROK_URL;
  }

  // 3. Web Browser Fallback (Expo Web)
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  // 4. Auto-detect physical device host IP via Metro bundler
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api/v1`;
    }
  }

  // 5. Android Emulator Fallback
  return 'http://10.0.2.2:5000/api/v1';
}

export const ENV = {
  API_URL: getApiUrl(),
};