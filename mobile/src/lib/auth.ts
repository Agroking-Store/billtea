import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Dynamically determines the backend API URL when scanning via Expo Go.
 */
const getDynamicBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api/v1`;
  }

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api/v1'
    : 'http://localhost:5000/api/v1';
};

export const API_BASE = getDynamicBaseUrl();

let inMemoryToken: string | null = null;
let isStorageInitialized = false;

type AuthListener = (isAuth: boolean) => void;
const listeners: AuthListener[] = [];

export function subscribeAuth(listener: AuthListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

function notifyAuthChange(isAuth: boolean) {
  listeners.forEach((l) => l(isAuth));
}

export async function initAuthStore(): Promise<string | null> {
  if (isStorageInitialized && inMemoryToken) return inMemoryToken;
  try {
    let token = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    }
    if (!token) {
      token = await AsyncStorage.getItem('accessToken');
    }
    inMemoryToken = token;
    isStorageInitialized = true;
    return token;
  } catch (e) {
    isStorageInitialized = true;
    return null;
  }
}

export function getAccessToken(): string | null {
  return inMemoryToken;
}

export function isLoggedIn(): boolean {
  return !!inMemoryToken;
}

export async function saveAuthData(accessToken: string, refreshToken: string, user: any): Promise<void> {
  inMemoryToken = accessToken;
  isStorageInitialized = true;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', accessToken);
  }

  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);
  await AsyncStorage.setItem('user', JSON.stringify(user));

  notifyAuthChange(true);
}

export async function logout(): Promise<void> {
  inMemoryToken = null;
  isStorageInitialized = false;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedBranchId');
  }
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('selectedBranchId');

  notifyAuthChange(false);
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  let refreshToken = Platform.OS === 'web' && typeof window !== 'undefined'
    ? localStorage.getItem('refreshToken')
    : await AsyncStorage.getItem('refreshToken');

  if (!refreshToken) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        await logout();
        return null;
      }

      const data = await res.json();
      const newAccessToken = data.accessToken || data.data?.accessToken;
      const newRefreshToken = data.refreshToken || data.data?.refreshToken || refreshToken;

      if (newAccessToken) {
        await saveAuthData(newAccessToken, newRefreshToken, data.user || data.data?.user || {});
        return newAccessToken;
      }

      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await initAuthStore();
  const isFormData = options.body instanceof FormData;

  let selectedBranchId: string | null = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    selectedBranchId = localStorage.getItem('selectedBranchId');
  }
  if (!selectedBranchId) {
    selectedBranchId = await AsyncStorage.getItem('selectedBranchId');
  }

  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // 1. Extract provided custom headers first
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // 2. Explicitly override Authorization & Branch headers AFTER options merge
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (selectedBranchId) {
    headers['x-branch-id'] = selectedBranchId;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  const fullPath = path.startsWith('/') ? path : `/${path}`;
  let res = await fetch(`${API_BASE}${fullPath}`, fetchOptions);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      fetchOptions.headers = {
        ...(fetchOptions.headers as Record<string, string>),
        Authorization: `Bearer ${newToken}`,
      };
      res = await fetch(`${API_BASE}${fullPath}`, fetchOptions);
    }
  }

  return res;
}