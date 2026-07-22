import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Home } from 'lucide-react-native';
import { router } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Laptop } from 'lucide-react-native';
import ProfileHeader from '../../components/ProfileHeader';
import SettingsItem from '../../components/SettingsItem';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const { width } = Dimensions.get('window');
const isTablet = width > 600;

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { theme: mode, setTheme: setMode } = useThemeStore();
  const handleEditProfile = () => {
    console.log('Edit Profile Pressed');
    // Placeholder handler
    // router.push(('/settings/profile-edit' as any));
  };

  const logoutScaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleLogoutPressIn = () => {
    Animated.spring(logoutScaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handleLogoutPressOut = () => {
    Animated.spring(logoutScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handleLogout = async () => {
    console.log('Logout Pressed');
    const { logout } = useAuthStore.getState();
    await logout();
    router.replace(('/(auth)/login' as any)); // Navigate to login/auth screen
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Background Ambient Glows */}
      {/* Top Blue Glow */}
      <View style={styles.topGlowContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(125, 211, 252, 0.12)', 'rgba(10, 14, 26, 0)']}
          style={styles.glowCircle}
        />
      </View>

      {/* Bottom Purple Glow */}
      <View style={styles.bottomGlowContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(200, 160, 240, 0.08)', 'rgba(10, 14, 26, 0)']}
          style={styles.glowCircle}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Custom Header Bar */}
        <View
  style={[
    styles.header,
    {
      backgroundColor: isDark
        ? 'rgba(15,21,36,0.65)'
        : 'rgba(255,255,255,0.95)',
      borderBottomColor: isDark
        ? 'rgba(125,211,252,0.12)'
        : 'rgba(0,0,0,0.08)',
    },
  ]}
>
  {Platform.OS === 'ios' && (
    <BlurView
      intensity={35}
      tint={isDark ? 'dark' : 'light'}
      style={StyleSheet.absoluteFill}
    />
  )}
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.push(('/dashboard' as any))}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
            >
             <Home size={24} color={colors.primary} />
            </Pressable>

            <Text style={[styles.headerTitle, { color:colors.primary }]}>BillTea</Text>

            <View style={[styles.themeToggle, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
              {(['System', 'Light', 'Dark'] as const).map((m) => {
                const isActive = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.themeBtn,
                      isActive && [styles.themeBtnActive, { backgroundColor: colors.surfaceVariant, borderColor: colors.primary + "2E" }]
                    ]}
                  >
                    {m === 'System' && <Laptop size={16} color={isActive ? colors.primary : colors.textSecondary} />}
                    {m === 'Dark' && <Moon size={16} color={isActive ? colors.primary : colors.textSecondary} />}
                    {m === 'Light' && <Sun size={16} color={isActive ? colors.primary : colors.textSecondary} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Scrollable Settings Panel */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet
          ]}
        >
          {/* Profile Header */}
          <ProfileHeader
            name="Sarang Wagh"
            role="Business Administrator"
            avatarUri="https://lh3.googleusercontent.com/aida-public/AB6AXuCikZgFX6gEoglH2uQdLP1N5dN8spNucZQ_rb9lPo4yRYB6WWoo1e2d18EGDcdRpyk6rMoyi3kSH0WCvs2TRXMqJzVku5feWeHdAxhHqGZpK1ZVLRIZglACbHPBuVsWGRfoxvgFzav1frnHXFUiZX_jwyC2lsXhGDxVqlqecU4XtdOVVrXugOj6i6D0xaoAkMXIR3mpch0JEZTF_HpJyFioRw8zMBCpEflfUo0cOjDvK-RuLwAtxUsr"
            planName="Premium Plan"
            onEditPress={handleEditProfile}
          />

          {/* Business Settings Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Business Settings</Text>

            {/* Company Settings */}
            <SettingsItem
              label="Company Settings"
              subLabel="Profile, Tax details"
              iconName="business"
              iconColor={colors.primary}
              borderColor="rgba(125, 211, 252, 0.15)"
              onPress={() => router.push(('/settings/company-settings' as any))}
            />

            {/* Branch Settings */}
            <SettingsItem
              label="Branch Settings"
              subLabel="Manage multiple locations"
              iconName="store"
              iconColor={colors.textSecondary}
              borderColor="rgba(160, 180, 196, 0.15)"
              onPress={() => router.push(('/settings/branch-settings' as any))}
            />

            {/* User Management */}
            <SettingsItem
              label="Staff Management"
              subLabel="Team roles, permissions"
              iconName="group-add"
              iconColor={colors.primary}
              borderColor="rgba(125, 211, 252, 0.15)"
              onPress={() => router.push(('/settings/staff-management' as any))}
            />
          </View>

          {/* Billing & Invoicing Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Billing & Invoicing</Text>

            {/* Invoice Settings */}
            <SettingsItem
              label="Invoice Settings"
              subLabel="Templates, Numbering"
              iconName="description"
              iconColor={colors.secondary}
              borderColor="rgba(136, 180, 204, 0.15)"
              onPress={() => router.push(('/settings/invoice-settings' as any))}
            />

            {/* Quotation Settings */}
            <SettingsItem
              label="Quotation Settings"
              subLabel="Templates, numbering"
              iconName="request-quote"
              iconColor={colors.primary}
              borderColor="rgba(125, 211, 252, 0.15)"
              onPress={() => router.push(('/settings/quotation-settings' as any))}
            />
          </View>

          {/* Integrations Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Integrations</Text>

            {/* WhatsApp Settings */}
            <SettingsItem
              label="WhatsApp Settings"
              subLabel="Notifications, messaging"
              iconName="chat"
              iconColor={colors.secondary}
              borderColor="rgba(136, 180, 204, 0.15)"
              onPress={() => router.push(('/settings/whatsapp-settings' as any))}
            />
          </View>

          {/* Account & Security Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Account & Security</Text>

            {/* Plan & Subscription */}
            <SettingsItem
              label="Plan & Subscription"
              subLabel="Manage your premium plan"
              iconName="card-membership"
              iconColor={colors.tertiary}
              borderColor="rgba(200, 160, 240, 0.15)"
              onPress={() => router.push(('/settings/plan-subscription' as any))}
            />

            {/* Account Security */}
            <SettingsItem
              label="Account Security"
              subLabel="Password, 2FA"
              iconName="lock"
              iconColor={colors.error}
              borderColor="rgba(255, 107, 107, 0.15)"
              onPress={() => router.push(('/settings/account-security' as any))}
            />
          </View>

          {/* Preferences & Support Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Preferences & Support</Text>

            {/* Theme Settings */}
            <SettingsItem
              label="Theme Settings"
              subLabel="Appearance, Dark mode"
              iconName="palette"
              iconColor={colors.tertiary}
              borderColor="rgba(200, 160, 240, 0.15)"
              onPress={() => router.push(('/settings/theme-settings' as any))}
            />

            {/* Help & Support */}
            <SettingsItem
              label="Help & Support"
              subLabel="FAQs, Contact us"
              iconName="help"
              iconColor={colors.textSecondary}
              borderColor="rgba(160, 180, 196, 0.15)"
              onPress={() => router.push(('/settings/help-support' as any))}
            />

            {/* Logout Button */}
            <Animated.View
              style={[
                styles.logoutWrapper,
                { transform: [{ scale: logoutScaleAnim }] },
              ]}
            >
              <Pressable
                onPress={handleLogout}
                onPressIn={handleLogoutPressIn}
                onPressOut={handleLogoutPressOut}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.logoutButtonPressed,
                ]}
              >
                <MaterialIcons
                  name="logout"
                  size={20}
                  color={colors.error}
                  style={styles.logoutIcon}
                />
                <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E1A",
  },
  safeArea: {
    flex: 1,
  },
  topGlowContainer: {
    position: 'absolute',
    top: -150,
    left: '50%',
    marginLeft: -250,
    width: 500,
    height: 500,
    zIndex: 0,
  },
  bottomGlowContainer: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 400,
    height: 400,
    zIndex: 0,
  },
  glowCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 250,
  },
 header: {
  width: '100%',
  borderBottomWidth: 1,
  zIndex: 10,
},
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: "#7DD3FC",
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(125, 211, 252, 0.1)',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeBtnActive: {
    // Styling handled dynamically via inline styles
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110, // Margin to allow scrolling above custom floating tab bar
    zIndex: 1,
  },
  scrollContentTablet: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  sectionContainer: {
    marginTop: 20,
    width: '100%',
  },
  sectionHeader: {
    fontSize: 12,
    color: "#A0B4C4",
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 8,
    marginBottom: 12,
    opacity: 0.6,
  },
  logoutWrapper: {
    width: '100%',
    minHeight: 60,

    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.25)',

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'transparent',

    marginTop: 24,
  },
  logoutButton: {
    paddingVertical: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    alignSelf: 'center',

    backgroundColor: 'transparent',
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: "#FF6B6B",
    letterSpacing: 0.5,
  },
});
