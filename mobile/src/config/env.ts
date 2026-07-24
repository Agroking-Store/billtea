import Constants from 'expo-constants';

function getApiUrl(): string {
  // If EXPO_PUBLIC_API_URL is set in environment, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Automatically detect the host IP address from Expo bundler
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api/v1`;
    }
  }

  return 'http://192.168.29.199:5000/api/v1';
}

export const ENV = {
  API_URL: getApiUrl(),
};
