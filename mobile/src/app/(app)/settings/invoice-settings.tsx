import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sliders,
  Eye,
  MessageSquare,
  Gavel,
  Sparkles,
  Code,
  Package,
  CreditCard,
  User,
  Check,
} from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { apiClient } from '@/api/client';
import { useBranch } from '@/components/BranchProvider';

// Custom Animated Switch to match the premium screenshot design
interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function CustomSwitch({ value, onValueChange }: CustomSwitchProps) {
  const { colors, isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 20],
  });

  const uncheckedBg = isDark ? '#1a2438' : '#e2e8f0';
  const checkedBg = isDark ? '#0e4d6e' : '#bae6fd';

  const uncheckedBorder = colors.border;
  const checkedBorder = colors.primary;

  const uncheckedThumb = isDark ? '#0f1524' : '#ffffff';
  const checkedThumb = colors.primary;

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [uncheckedBg, checkedBg],
  });

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [uncheckedBorder, checkedBorder],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [uncheckedThumb, checkedThumb],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.switchContainer, { backgroundColor, borderColor, borderWidth: 1.5 }]}>
        <Animated.View
          style={[
            styles.switchThumb,
            { transform: [{ translateX }], backgroundColor: thumbColor },
          ]}
        >
          {value && <Check size={10} color={colors.background} strokeWidth={4.5} />}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

interface PremiumInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  numberOfLines?: number;
  prefixIcon?: React.ReactNode;
  rightLabelAction?: React.ReactNode;
}

function PremiumInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  prefixIcon,
  rightLabelAction,
}: PremiumInputProps) {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
        {rightLabelAction}
      </View>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? 'rgba(10, 14, 26, 0.4)' : '#f8fafc',
            borderColor: isFocused ? colors.primary : colors.glassBorder,
          },
          isFocused && {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 2,
          },
          multiline && { minHeight: numberOfLines * 24 + 16, alignItems: 'flex-start' },
        ]}
      >
        {prefixIcon && <View style={styles.prefixIconContainer}>{prefixIcon}</View>}
        <TextInput
          style={[
            styles.premiumTextInput,
            {
              color: colors.text,
            },
            multiline && {
              textAlignVertical: 'top',
              paddingTop: 12,
              paddingBottom: 12,
              minHeight: numberOfLines * 24,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary + '80'}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
}

export default function InvoiceSettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { selectedBranchId } = useBranch();

  // Local Form States
  const [prefix, setPrefix] = useState('');
  const [startingNumber, setStartingNumber] = useState('');
  const [showHsnCode, setShowHsnCode] = useState(true);
  const [showSku, setShowSku] = useState(false);
  // NOTE: backend's DocumentSettings table has no field for these two yet —
  // they work in the UI but won't be saved/loaded from the server until
  // the backend adds columns for them.
  const [showPaymentMethod, setShowPaymentMethod] = useState(true);
  const [displayPersonalName, setDisplayPersonalName] = useState(false);
  const [topMessage, setTopMessage] = useState('');
  const [bottomMessage, setBottomMessage] = useState('');
  const [terms, setTerms] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load the real, live settings (including the next invoice number) from the backend
  const fetchSettings = async () => {
    if (!selectedBranchId) return;
    try {
      const res = await apiClient.get(`/document-settings/${selectedBranchId}`, {
        params: { type: 'INVOICE' },
      });
      if (res.status === 200 && res.data?.settings) {
        const s = res.data.settings;
        setPrefix(s.prefix ?? '');
        setStartingNumber(String(s.nextNumber ?? 1));
        setShowHsnCode(!!s.showHsn);
        setShowSku(!!s.showSku);
        setTopMessage(s.topMessage ?? '');
        setBottomMessage(s.bottomMessage ?? '');
        setTerms(s.terms ?? '');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load invoice settings.');
    } finally {
      setIsInitialized(true);
    }
  };

  // Fetch fresh every time this screen is focused, so it always reflects
  // the latest invoice created (nextNumber updates automatically on the backend
  // each time a new invoice is saved).
  useEffect(() => {
    fetchSettings();
  }, [selectedBranchId]);

  const handleGenerateTC = () => {
    setIsGenerating(true);
    // Simulate premium AI T&C generation
    setTimeout(() => {
      const generatedTerms = 
`1. Payment Terms: Payment is due within 15 days of invoice date unless otherwise specified.
2. Late Fees: Interest of 1.5% per month will be charged on all overdue accounts.
3. Disputes: Any discrepancies or disputes regarding this invoice must be reported within 7 business days.
4. Returns: Goods once sold cannot be returned unless verified defective by our team.`;
      setTerms(generatedTerms);
      setIsGenerating(false);
    }, 1200);
  };

  const handleSave = async () => {
    if (!selectedBranchId) {
      Alert.alert('Error', 'No branch selected.');
      return;
    }
    if (!prefix.trim()) {
      Alert.alert('Validation Error', 'Invoice prefix cannot be empty.');
      return;
    }
    const startingNumInt = parseInt(startingNumber, 10);
    if (isNaN(startingNumInt) || startingNumInt < 1) {
      Alert.alert('Validation Error', 'Starting number must be a positive integer.');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put(`/document-settings/${selectedBranchId}`, {
        type: 'INVOICE',
        prefix: prefix.trim(),
        nextNumber: startingNumInt,
        topMessage: topMessage.trim(),
        bottomMessage: bottomMessage.trim(),
        terms: terms.trim(),
        showHsn: showHsnCode,
        showSku,
      });

      // Re-fetch so the screen shows exactly what's now saved (e.g. if the
      // prefix/starting number were adjusted server-side for any reason)
      await fetchSettings();

      Alert.alert('Success', 'Invoice settings saved successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Background Ambient Glows */}
      {isDark && (
        <>
          <View style={styles.topGlowContainer} pointerEvents="none">
            <LinearGradient
              colors={['rgba(125, 211, 252, 0.12)', 'rgba(10, 14, 26, 0)']}
              style={styles.glowCircle}
            />
          </View>
          <View style={styles.bottomGlowContainer} pointerEvents="none">
            <LinearGradient
              colors={['rgba(200, 160, 240, 0.08)', 'rgba(10, 14, 26, 0)']}
              style={styles.glowCircle}
            />
          </View>
        </>
      )}

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Bar */}
        <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.glassBackground }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Invoice Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scrollable Form Panel */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 60 },
          ]}
        >
          {/* Section 1: General Configuration */}
          <GlassPanel style={styles.card}>
            <View style={styles.cardHeader}>
              <Sliders size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>General Configuration</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

            <PremiumInput
              label="Invoice Prefix"
              value={prefix}
              onChangeText={setPrefix}
              placeholder="e.g., INV"
            />

            <PremiumInput
              label={`Next Invoice Number${isInitialized ? ` (currently ${prefix}${startingNumber})` : ''}`}
              value={startingNumber}
              onChangeText={setStartingNumber}
              placeholder="1"
              keyboardType="numeric"
              prefixIcon={<Text style={[styles.prefixHash, { color: colors.textSecondary }]}>#</Text>}
            />
          </GlassPanel>

          {/* Section 2: Display Preferences */}
          <GlassPanel style={styles.card}>
            <View style={styles.cardHeader}>
              <Eye size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Display Preferences</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

            {/* Switch 1: Show HSN Code */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Code size={18} color={colors.textSecondary} style={styles.switchIcon} />
                <Text style={[styles.switchLabel, { color: colors.text }]}>Show HSN Code</Text>
              </View>
              <CustomSwitch value={showHsnCode} onValueChange={setShowHsnCode} />
            </View>

            {/* Switch 2: Show SKU */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Package size={18} color={colors.textSecondary} style={styles.switchIcon} />
                <Text style={[styles.switchLabel, { color: colors.text }]}>Show SKU</Text>
              </View>
              <CustomSwitch value={showSku} onValueChange={setShowSku} />
            </View>

            {/* Switch 3: Show Payment Method */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <CreditCard size={18} color={colors.textSecondary} style={styles.switchIcon} />
                <Text style={[styles.switchLabel, { color: colors.text }]}>Show Payment Method</Text>
              </View>
              <CustomSwitch value={showPaymentMethod} onValueChange={setShowPaymentMethod} />
            </View>

            {/* Switch 4: Display Personal Name */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <User size={18} color={colors.textSecondary} style={styles.switchIcon} />
                <Text style={[styles.switchLabel, { color: colors.text }]}>Display Personal Name</Text>
              </View>
              <CustomSwitch value={displayPersonalName} onValueChange={setDisplayPersonalName} />
            </View>
          </GlassPanel>

          {/* Section 3: Messaging */}
          <GlassPanel style={styles.card}>
            <View style={styles.cardHeader}>
              <MessageSquare size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Messaging</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

            <PremiumInput
              label="Top Message"
              value={topMessage}
              onChangeText={setTopMessage}
              placeholder="e.g., Thank you for your business!"
              multiline
              numberOfLines={2}
            />

            <PremiumInput
              label="Bottom Message"
              value={bottomMessage}
              onChangeText={setBottomMessage}
              placeholder="e.g., Payment is due within 30 days."
              multiline
              numberOfLines={3}
            />
          </GlassPanel>

          {/* Section 4: Legal */}
          <GlassPanel style={styles.card}>
            <View style={styles.cardHeader}>
              <Gavel size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Legal</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

            <PremiumInput
              label="Terms & Conditions"
              value={terms}
              onChangeText={setTerms}
              placeholder="Enter terms and conditions that will appear on all invoices..."
              multiline
              numberOfLines={5}
              rightLabelAction={
                <TouchableOpacity
                  style={styles.generateBtn}
                  onPress={handleGenerateTC}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Sparkles size={13} color={colors.primary} />
                      <Text style={[styles.generateBtnText, { color: colors.primary }]}>Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              }
            />
          </GlassPanel>

          {/* Bottom Save Button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: isDark ? colors.primary + '26' : colors.primary + '1A',
                borderColor: colors.primary + '4D',
                borderWidth: 1.5,
              },
            ]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.primary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 20,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textareaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  startingNumberInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  prefixHash: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  startingNumberInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchIcon: {
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  switchContainer: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  generateBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  premiumTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  prefixIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
