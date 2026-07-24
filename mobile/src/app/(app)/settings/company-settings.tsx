import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform,
  BackHandler,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Building2, 
  Edit2, 
  Store, 
  Users, 
  IdCard, 
  ClipboardList, 
  User, 
  Save 
} from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { GlassPanel } from '../../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

// FIX: moved out of the JSX tree. A `const` statement can't live directly
// inside a component's returned markup — it needs to sit in the function body.
const HEADER_HEIGHT = 56;

export default function CompanySettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Single source of truth for "back" so the on-screen button and the
  // phone's hardware/gesture back button always land in the same place.
  const goBack = useCallback(() => {
    router.push('/settings');
  }, []);

  // Intercept the Android hardware/gesture back button while this screen
  // is focused, since it otherwise pops the native stack (which may skip
  // straight past /settings to the dashboard) instead of using our route.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBack();
        return true; // prevent default behavior (going to dashboard)
      });
      return () => subscription.remove();
    }, [goBack])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? ['#081326', '#111b2f'] : [colors.background, colors.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Ambient Glows */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.glowCircle1}>
          <LinearGradient
            colors={[colors.primary + '14', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        <View style={styles.glowCircle2}>
          <LinearGradient
            colors={[colors.tertiary + '14', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
      </View>

      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.glassBorder }]}>
        <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBackground }]} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={goBack}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.primary + '1A',
                borderColor: colors.primary + '33',
              },
            ]}
            activeOpacity={0.7}
          >
            <ArrowLeft color={colors.primary} size={18} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Company Settings</Text>
        </View>
      </View>

      {/* Content ScrollView */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + HEADER_HEIGHT,
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Company Profile Section */}
        <GlassPanel style={styles.profileCard}>
          <View style={styles.profileAccentLine}>
            <LinearGradient
              colors={[colors.primary + '80', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <TouchableOpacity style={styles.profileEditBtn} activeOpacity={0.7}>
            <Edit2 color={colors.textSecondary} size={18} />
          </TouchableOpacity>

          <View style={styles.profileContent}>
            {/* Avatar image with glow */}
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarGlow, { backgroundColor: colors.primary, opacity: 0.15 }]} />
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDomVgL2a5ZiZgRYKaFu7uX873ViwvEEGmF9TBnIQOYhJApXJb7W4z07hH4p7cvDqaRadY5nq3s4jfr8CqbWLJ6x8kMv-deL-lxhBAr7U4_wv8L4KcbHD3X3uzf-J1Rct4ZSwMwtk9log0-U3GHRnQM-FL1MyUiY5jCbV1gYMDb0haWmY2Vt4K0yGl0LbfM3c3UdnKHCgXNdVVvV91vvtdfNp4yate73hHsPQ_HTAk-3aJa5arWP2p5' }} 
                style={[styles.avatarImage, { borderColor: colors.primary + '4D' }]} 
              />
            </View>

            <Text style={[styles.companyName, { color: colors.text }]}>Indux Tech</Text>
            
            <View style={styles.domainRow}>
              <Building2 color={colors.textSecondary} size={14} style={{ marginRight: 4 }} />
              <Text style={[styles.domainText, { color: colors.textSecondary }]}>Technology & Software</Text>
            </View>

            {/* Active Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '33' }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>ACTIVE</Text>
            </View>
          </View>
        </GlassPanel>

        {/* Stats Bento Grid stacked vertically */}
        <View style={styles.statsGrid}>
          
          <GlassPanel style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL BRANCHES</Text>
              <Store color={colors.primary} size={18} opacity={0.7} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>4</Text>
          </GlassPanel>

          <GlassPanel style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL CUSTOMERS</Text>
              <Users color={colors.primary} size={18} opacity={0.7} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>1,092</Text>
          </GlassPanel>

          <GlassPanel style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL STAFF</Text>
              <IdCard color={colors.primary} size={18} opacity={0.7} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>28</Text>
          </GlassPanel>

        </View>

        {/* Business Details Form Section */}
        <GlassPanel style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <ClipboardList color={colors.primary} size={20} style={{ marginRight: 8 }} />
            <Text style={[styles.detailsTitle, { color: colors.text }]}>Business Details</Text>
          </View>

          <View style={styles.fieldsContainer}>
            
            <BusinessField 
              label="Business Unique ID" 
              value="IDX-9982-BT" 
              isMono={true}
            />
            
            <BusinessField 
              label="Label Name" 
              value="GST No" 
            />
            
            <BusinessField 
              label="Label Value" 
              value="32SAHADDU32" 
              isMono={true}
            />

            <BusinessField 
              label="Owner" 
              value="Sarang Wagh" 
              icon={<User color={colors.tertiary} size={16} style={{ marginRight: 6 }} />}
            />

          </View>
        </GlassPanel>

        {/* Save Button (Placed OUTSIDE the card, centered at the bottom of the scroll view) */}
        <View style={styles.saveBtnContainer}>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={isDark ? ['#7dd3fc', '#0284c7'] : [colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Save color={isDark ? '#001f2e' : '#ffffff'} size={18} style={{ marginRight: 8 }} />
              <Text style={[styles.saveBtnText, { color: isDark ? '#001f2e' : '#ffffff' }]}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// Sub-component for individual read-only static fields
interface BusinessFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  isMono?: boolean;
}

function BusinessField({ label, value, icon, isMono = false }: BusinessFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.fieldRow}>
      <View style={styles.labelRow}>
        {icon}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <View style={[styles.inputGlass, { backgroundColor: colors.surfaceVariant + '22', borderColor: colors.glassBorder }]}>
        <Text
          style={[
            styles.inputText, 
            { color: colors.text },
            isMono && styles.fontMono
          ]}
        >
          {value}
        </Text>
        <View style={styles.inputEditBtn}>
          <Edit2 color={colors.textSecondary} size={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowCircle1: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    overflow: 'hidden',
  },
  glowCircle2: {
    position: 'absolute',
    top: '40%',
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    borderBottomWidth: 1,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  profileCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  profileAccentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  profileEditBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 8,
    borderRadius: 20,
    zIndex: 5,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    transform: [{ scale: 1.15 }],
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
  },
  companyName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  companyNameInput: {
    fontSize: 20,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    textAlign: 'center',
    minWidth: 160,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  domainText: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 6,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ade80',
    letterSpacing: 0.8,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    // inherits GlassPanel styles
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  detailsCard: {
    // inherits GlassPanel styles
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldsContainer: {
    gap: 16,
  },
  fieldRow: {
    flexDirection: 'column',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    textAlignVertical: 'center',
    paddingRight: 28,
  },
  inputEditBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  fontMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.2,
  },
  saveBtnContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  saveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#7dd3fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});