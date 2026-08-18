import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

SplashScreen.preventAutoHideAsync();

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, restoreToken } = useAuthStore();
  const { isInitialized: isThemeInitialized, initTheme, theme } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    restoreToken();
    initTheme();
  }, []);

  useEffect(() => {
    if (isLoading || !isThemeInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !inAppGroup) {
      // Redirect to dashboard
      router.replace('/(app)/dashboard');
    }
    
    // Hide splash screen once we've decided where to route
    if (!isReady) {
      setIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [isAuthenticated, isLoading, isThemeInitialized, segments, isReady]);

  if (isLoading || !isThemeInitialized || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Calculate actual dark/light scheme for Expo Router's ThemeProvider
  const isDark = theme === 'Dark' || (theme === 'System' && colorScheme === 'dark');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Slot />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
