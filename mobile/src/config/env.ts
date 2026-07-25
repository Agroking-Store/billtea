import Constants from 'expo-constants';

function getApiUrl(): string {
  // 1. Auto-detect host IP from Expo Metro bundler (works automatically on any Wi-Fi)
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

  // 2. Environment variable override if specified
  if (process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('<IP_ADDR>')) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 3. Fallback for Android Emulator / Local host
  return 'http://10.0.2.2:5000/api/v1';
}

export const ENV = {
  API_URL: getApiUrl(),
};

