import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Home, ChevronDown, Check, X, Sun, Moon, Laptop } from 'lucide-react-native';
import { router } from 'expo-router';

// Branch & Theme Imports
import { useBranch, Branch } from '../../components/BranchProvider';
import { useTheme } from '../../hooks/useTheme';
import ProfileHeader from '../../components/ProfileHeader';
import SettingsItem from '../../components/SettingsItem';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const { width } = Dimensions.get('window');
const isTablet = width > 600;

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { theme: mode, setTheme: setMode } = useThemeStore();

  const { branches, selectedBranchId, setSelectedBranchId, isLoadingBranches, refreshBranches } = useBranch();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  // Auto-refresh branch data on screen focus
  useEffect(() => {
    refreshBranches();
  }, []);

  // Safe Loose Comparison
  const currentBranch = branches?.find((b: Branch) => String(b.id) === String(selectedBranchId));

  // Dynamic Branch Label Resolver
  const getDisplayBranchName = () => {
    if (currentBranch?.name) {
      return currentBranch.name.toUpperCase();
    }
    if (branches && branches.length > 0 && branches[0]?.name) {
      return branches[0].name.toUpperCase();
    }
    return 'SELECT BRANCH';
  };

  const handleEditProfile = () => {
    console.log('Edit Profile Pressed');
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
    const { logout } = useAuthStore.getState();
    await logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Ambient Glows */}
      <View style={styles.topGlowContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(125, 211, 252, 0.12)', 'rgba(10, 14, 26, 0)']}
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
            {/* Left Action Button */}
            <Pressable
              onPress={() => router.push('/dashboard' as any)}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Home size={24} color={colors.primary} />
            </Pressable>

            {/* Centered Title */}
            <View style={styles.titleContainer} pointerEvents="none">
              <Text style={[styles.headerTitle, { color: colors.primary }]}>BillTea</Text>
            </View>

            {/* Right Action: Theme Switcher */}
            <View style={[styles.themeToggle, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
              {(['System', 'Light', 'Dark'] as const).map((m) => {
                const isActive = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.themeBtn,
                      isActive && [styles.themeBtnActive, { backgroundColor: colors.surfaceVariant, borderColor: colors.primary + '2E' }]
                    ]}
                  >
                    {m === 'System' && <Laptop size={15} color={isActive ? colors.primary : colors.textSecondary} />}
                    {m === 'Dark' && <Moon size={15} color={isActive ? colors.primary : colors.textSecondary} />}
                    {m === 'Light' && <Sun size={15} color={isActive ? colors.primary : colors.textSecondary} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
        >
          {/* Profile Header */}
          <ProfileHeader
            name="Sarang Wagh"
            avatarUri="https://lh3.googleusercontent.com/aida-public/AB6AXuCikZgFX6gEoglH2uQdLP1N5dN8spNucZQ_rb9lPo4yRYB6WWoo1e2d18EGDcdRpyk6rMoyi3kSH0WCvs2TRXMqJzVku5feWeHdAxhHqGZpK1ZVLRIZglACbHPBuVsWGRfoxvgFzav1frnHXFUiZX_jwyC2lsXhGDxVqlqecU4XtdOVVrXugOj6i6D0xaoAkMXIR3mpch0JEZTF_HpJyFioRw8zMBCpEflfUo0cOjDvK-RuLwAtxUsr"
            planName="Premium Plan"
            onEditPress={handleEditProfile}
          />

          {/* Active Branch Picker Section */}
          <View style={styles.branchWrapper}>
            <Text style={[styles.branchLabel, { color: colors.textSecondary }]}>
              ACTIVE BRANCH
            </Text>

            {isLoadingBranches ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
            ) : (
              <Pressable
                onPress={() => setBranchDropdownOpen(true)}
                style={({ pressed }) => [
                  styles.branchBtn,
                  {
                    backgroundColor: colors.glassBackground || 'rgba(15, 21, 36, 0.6)',
                    borderColor: colors.glassBorder || 'rgba(125, 211, 252, 0.15)',
                  },
                  pressed && { backgroundColor: 'rgba(125, 211, 252, 0.08)' },
                ]}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.branchBtnText, { color: colors.primary }]}
                >
                  {getDisplayBranchName()}
                </Text>

                <ChevronDown size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>

          {/* 1. Business Settings */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Business Settings</Text>

            <SettingsItem
              label="Company Settings"
              subLabel="Profile, Tax details"
              iconName="business"
              iconColor={colors.primary}
              borderColor="rgba(125, 211, 252, 0.15)"
              onPress={() => router.push('/settings/company-settings' as any)}
            />
            <SettingsItem
              label="Branch Settings"
              subLabel="Manage multiple locations"
              iconName="store"
              iconColor={colors.textSecondary}
              borderColor="rgba(160, 180, 196, 0.15)"
              onPress={() => router.push('/settings/branch-settings' as any)}
            />
            <SettingsItem
              label="Staff Management"
              subLabel="Team roles, permissions"
              iconName="group-add"
              iconColor={colors.primary}
              borderColor="rgba(125, 211, 252, 0.15)"
              onPress={() => router.push('/settings/staff-management' as any)}
            />
          </View>

          {/* 2. Billing & Invoicing */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Billing & Invoicing</Text>

            <SettingsItem
              label="Invoice Settings"
              subLabel="Templates, Numbering"
              iconName="description"
              iconColor={colors.secondary}
              borderColor="rgba(136, 180, 204, 0.15)"
              onPress={() => router.push('/settings/invoice-settings' as any)}
            />
            <SettingsItem
              label="Quotation Settings"
              subLabel="Templates, numbering"
              iconName="request-quote"
              iconColor={colors.primary}
              borderColor="rgba(125, 211, 252, 0.15)"
              onPress={() => router.push('/settings/quotation-settings' as any)}
            />
          </View>

          {/* 3. Integrations */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Integrations</Text>

            <SettingsItem
              label="WhatsApp Settings"
              subLabel="Notifications, messaging"
              iconName="chat"
              iconColor={colors.secondary}
              borderColor="rgba(136, 180, 204, 0.15)"
              onPress={() => router.push('/settings/whatsapp-settings' as any)}
            />
          </View>

          {/* 4. Account & Security */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Account & Security</Text>

            <SettingsItem
              label="Plan & Subscription"
              subLabel="Manage your premium plan"
              iconName="card-membership"
              iconColor={colors.tertiary}
              borderColor="rgba(200, 160, 240, 0.15)"
              onPress={() => router.push('/settings/plan-subscription' as any)}
            />
            <SettingsItem
              label="Account Security"
              subLabel="Password, 2FA"
              iconName="lock"
              iconColor={colors.error}
              borderColor="rgba(255, 107, 107, 0.15)"
              onPress={() => router.push('/settings/account-security' as any)}
            />
          </View>

          {/* 5. Preferences & Support */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Preferences & Support</Text>

            <SettingsItem
              label="Theme Settings"
              subLabel="Appearance, Dark mode"
              iconName="palette"
              iconColor={colors.tertiary}
              borderColor="rgba(200, 160, 240, 0.15)"
              onPress={() => router.push('/settings/theme-settings' as any)}
            />
            <SettingsItem
              label="Help & Support"
              subLabel="FAQs, Contact us"
              iconName="help"
              iconColor={colors.textSecondary}
              borderColor="rgba(160, 180, 196, 0.15)"
              onPress={() => router.push('/settings/help-support' as any)}
            />

            {/* Logout */}
            <Animated.View style={[styles.logoutWrapper, { transform: [{ scale: logoutScaleAnim }] }]}>
              <Pressable
                onPress={handleLogout}
                onPressIn={handleLogoutPressIn}
                onPressOut={handleLogoutPressOut}
                style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              >
                <MaterialIcons name="logout" size={20} color={colors.error} style={styles.logoutIcon} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Cross-Platform Modal Dropdown */}
      <Modal
        visible={branchDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBranchDropdownOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBranchDropdownOpen(false)}>
          <View style={[styles.modalCard, { backgroundColor: '#0F172A', borderColor: 'rgba(125, 211, 252, 0.25)' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Branch</Text>
              <Pressable onPress={() => setBranchDropdownOpen(false)}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 250 }}>
              {branches?.map((b: Branch) => {
                const isSelected = String(b.id) === String(selectedBranchId || (branches.length > 0 ? branches[0].id : ''));
                return (
                  <Pressable
                    key={b.id}
                    onPress={async () => {
                      await setSelectedBranchId(b.id);
                      setBranchDropdownOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected,
                      pressed && { backgroundColor: 'rgba(125, 211, 252, 0.15)' },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.dropdownItemText, { color: isSelected ? colors.primary : colors.text || '#FFFFFF' }]}
                    >
                      {b.name}
                    </Text>
                    {isSelected && <Check size={16} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  safeArea: { flex: 1 },
  topGlowContainer: {
    position: 'absolute',
    top: -150,
    left: '50%',
    marginLeft: -250,
    width: 500,
    height: 500,
  },
  glowCircle: { width: '100%', height: '100%', borderRadius: 250 },
  header: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerContent: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerButtonPressed: { backgroundColor: 'rgba(125, 211, 252, 0.1)' },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 2,
    gap: 2,
    zIndex: 10,
  },
  themeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeBtnActive: {},
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  scrollContentTablet: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  branchWrapper: {
    marginTop: 16,
    marginBottom: 4,
    width: '100%',
  },
  branchLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  branchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  branchBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  sectionContainer: { marginTop: 20, width: '100%' },
  sectionHeader: {
    fontSize: 12,
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
    marginTop: 24,
  },
  logoutButton: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonPressed: { backgroundColor: 'rgba(255, 107, 107, 0.15)' },
  logoutIcon: { marginRight: 8 },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Modal Specific Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemSelected: { backgroundColor: 'rgba(125, 211, 252, 0.12)' },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
});