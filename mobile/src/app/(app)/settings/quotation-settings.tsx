import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Binary,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Gavel,
  Hash,
  Info,
  MessageSquare,
  Sliders,
  Tag,
  User,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function QuotationSettingsScreen() {
  const router = useRouter();

  // Replaces current route with '/settings' directly.
  // Guarantees navigation to Settings on Web and Mobile regardless of history stack.
  const navigateToSettings = () => {
    router.replace('/settings');
  };

  // Handle Android Physical Hardware Back Button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      navigateToSettings();
      return true; // Prevents default behavior and stops app from exiting
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  // Form State
  const [prefix, setPrefix] = useState('QT-');
  const [startingNumber, setStartingNumber] = useState('1001');

  const [topMessage, setTopMessage] = useState(
    'Thank you for considering Glacier Corp for your enterprise needs. The following estimate is valid for 30 days.'
  );
  const [bottomMessage, setBottomMessage] = useState(
    'If you have any questions regarding this quotation, please contact our support team at support@glacier.corp.'
  );
  const [terms, setTerms] = useState(
    `1. VALIDITY: This quotation is valid for 30 days from the date of issue.\n2. PAYMENT TERMS: 50% advance along with Purchase Order, 50% prior to delivery.\n3. TAXES: All applicable taxes are exclusive and will be charged extra as per government regulations at the time of billing.\n4. DELIVERY: 4-6 weeks from receipt of firm order and advance payment.`
  );

  const [showHsnCode, setShowHsnCode] = useState(true);
  const [showSku, setShowSku] = useState(false);
  const [displayPersonalName, setDisplayPersonalName] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Number Stepper Handlers
  const handleIncrementNumber = () => {
    clearMessages();
    const currentNum = parseInt(startingNumber, 10) || 0;
    setStartingNumber(String(currentNum + 1));
  };

  const handleDecrementNumber = () => {
    clearMessages();
    const currentNum = parseInt(startingNumber, 10) || 0;
    if (currentNum > 1) {
      setStartingNumber(String(currentNum - 1));
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    clearMessages();
    setPrefix('QT-');
    setStartingNumber('1001');
    setTopMessage(
      'Thank you for considering Glacier Corp for your enterprise needs. The following estimate is valid for 30 days.'
    );
    setBottomMessage(
      'If you have any questions regarding this quotation, please contact our support team at support@glacier.corp.'
    );
    setTerms(
      `1. VALIDITY: This quotation is valid for 30 days from the date of issue.\n2. PAYMENT TERMS: 50% advance along with Purchase Order, 50% prior to delivery.\n3. TAXES: All applicable taxes are exclusive and will be charged extra as per government regulations at the time of billing.\n4. DELIVERY: 4-6 weeks from receipt of firm order and advance payment.`
    );
    setShowHsnCode(true);
    setShowSku(false);
    setDisplayPersonalName(false);

    setSuccessMessage('Changes discarded.');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleSaveConfiguration = () => {
    const cleanPrefix = prefix.trim();
    const cleanNumber = Number(startingNumber);

    clearMessages();

    if (!cleanPrefix) {
      setErrorMessage('Quotation prefix is required.');
      return;
    }

    if (!startingNumber.trim() || Number.isNaN(cleanNumber) || cleanNumber <= 0) {
      setErrorMessage('Starting number must be greater than 0.');
      return;
    }

    const configuration = {
      prefix: cleanPrefix,
      startingNumber: cleanNumber,
      topMessage: topMessage.trim(),
      bottomMessage: bottomMessage.trim(),
      terms: terms.trim(),
      showHsnCode,
      showSku,
      displayPersonalName,
    };

    console.log('Saved configuration:', configuration);
    setSuccessMessage('Configuration saved successfully.');
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable
            onPress={navigateToSettings}
            hitSlop={16}
            style={styles.headerIconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back to settings"
          >
            <ArrowLeft size={22} color={COLORS.primary} />
          </Pressable>

          <Text style={styles.headerTitle}>Quotation Settings</Text>

          <View style={styles.profileButton}>
            <User size={18} color={COLORS.primary} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.content}>
            {/* Breadcrumb Header */}
            <View style={styles.pageHeader}>
              <View style={styles.breadcrumbRow}>
                <Pressable 
                  onPress={navigateToSettings} 
                  hitSlop={12}
                  style={styles.breadcrumbTouchContainer}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Settings"
                >
                  <Text style={styles.breadcrumbMuted}>SETTINGS</Text>
                </Pressable>

                <ChevronRight size={14} color="rgba(148, 163, 184, 0.5)" />
                <Text style={styles.breadcrumbActive}>QUOTATION SETTINGS</Text>
              </View>

              <Text style={styles.mainHeading}>
                Quotation <Text style={styles.mainHeadingGradient}>Settings</Text>
              </Text>
              <Text style={styles.mainDescription}>
                Configure default behaviors, display preferences, and legal messaging for all newly generated quotes.
              </Text>
            </View>

            {/* General Configuration */}
            <View style={styles.card}>
              <PanelHeader icon={<Sliders size={20} color={COLORS.primary} />} title="General Configuration" />

              {/* Quotation Prefix input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quotation Prefix</Text>
                <View style={styles.inputWrapper}>
                  <Hash size={16} color="rgba(103, 232, 249, 0.6)" style={styles.inputLeftIcon} />
                  <TextInput
                    value={prefix}
                    onChangeText={(val) => {
                      clearMessages();
                      setPrefix(val.toUpperCase());
                    }}
                    placeholder="QT-"
                    placeholderTextColor={COLORS.placeholder}
                    style={[styles.input, styles.inputWithLeftIcon]}
                  />
                </View>
                <Text style={styles.fieldHint}>Appears before the quotation number (e.g., QT-001).</Text>
              </View>

              {/* Starting Number input */}
              <View style={[styles.inputGroup, styles.lastInputGroup]}>
                <Text style={styles.label}>Starting Number</Text>
                <View style={styles.inputWrapper}>
                  <Binary size={16} color="rgba(103, 232, 249, 0.6)" style={styles.inputLeftIcon} />
                  <TextInput
                    value={startingNumber}
                    onChangeText={(val) => {
                      clearMessages();
                      setStartingNumber(val.replace(/[^0-9]/g, ''));
                    }}
                    placeholder="1001"
                    placeholderTextColor={COLORS.placeholder}
                    keyboardType="number-pad"
                    style={[styles.input, styles.inputWithLeftIcon, styles.inputWithRightSteppers]}
                  />

                  {/* Stepper Buttons */}
                  <View style={styles.stepperContainer}>
                    <Pressable
                      onPress={handleIncrementNumber}
                      hitSlop={8}
                      style={styles.stepperButton}
                    >
                      <ChevronUp size={14} color={COLORS.primary} />
                    </Pressable>
                    <Pressable
                      onPress={handleDecrementNumber}
                      hitSlop={8}
                      style={styles.stepperButton}
                    >
                      <ChevronDown size={14} color={COLORS.primary} />
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.fieldHint}>The next generated quotation will use this number.</Text>
              </View>
            </View>

            {/* Standard Messaging Panel */}
            <View style={styles.card}>
              <PanelHeader icon={<MessageSquare size={20} color={COLORS.primary} />} title="Standard Messaging" />

              <MultilineInput
                label="Top Message (Header)"
                value={topMessage}
                onChangeText={(val) => {
                  clearMessages();
                  setTopMessage(val);
                }}
                placeholder="Thank you for considering Glacier Corp..."
                height={85}
              />

              <MultilineInput
                label="Bottom Message (Footer)"
                value={bottomMessage}
                onChangeText={(val) => {
                  clearMessages();
                  setBottomMessage(val);
                }}
                placeholder="If you have any questions regarding this quotation..."
                height={85}
                isLast
              />
            </View>

            {/* Legal Panel */}
            <View style={styles.card}>
              <PanelHeader icon={<Gavel size={20} color={COLORS.primary} />} title="Legal" />

              <MultilineInput
                label="Terms & Conditions"
                value={terms}
                onChangeText={(val) => {
                  clearMessages();
                  setTerms(val);
                }}
                placeholder="Enter terms and conditions..."
                height={140}
                isLast
              />
            </View>

            {/* Display Preferences */}
            <View style={styles.card}>
              <PanelHeader icon={<Tag size={20} color={COLORS.primary} />} title="Display Preferences" />

              <PreferenceSwitch
                title="Show HSN Code"
                description="Display HSN codes for items."
                value={showHsnCode}
                onValueChange={setShowHsnCode}
              />

              <Divider />

              <PreferenceSwitch
                title="Show SKU"
                description="Include internal Stock Keeping Unit identifiers."
                value={showSku}
                onValueChange={setShowSku}
              />

              <Divider />

              <PreferenceSwitch
                title="Display Personal Name"
                description="Show the generating agent's name instead of just the company."
                value={displayPersonalName}
                onValueChange={setDisplayPersonalName}
              />

              <View style={styles.infoBox}>
                <Info size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
                <Text style={styles.infoText}>
                  Changes to these display settings will only affect invoices generated after saving. Historical invoices retain their original format.
                </Text>
              </View>
            </View>

            {/* Error / Success Notifications */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionBar}>
              <Pressable
                onPress={handleDiscardChanges}
                style={styles.discardButton}
              >
                <Text style={styles.discardButtonText}>Discard Changes</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveConfiguration}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save Configuration</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.panelHeader}>
      {icon}
      <Text style={styles.panelTitle}>{title}</Text>
    </View>
  );
}

function MultilineInput({
  label,
  value,
  placeholder,
  height = 90,
  isLast = false,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  height?: number;
  isLast?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={[styles.inputGroup, isLast && styles.lastInputGroup]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.textArea, { height }]}
      />
    </View>
  );
}

function PreferenceSwitch({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchTextContainer}>
        <Text style={styles.switchLabel}>{title}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: COLORS.switchOffTrack,
          true: COLORS.switchOnTrack,
        }}
        thumbColor={value ? COLORS.primary : COLORS.switchThumb}
        ios_backgroundColor={COLORS.switchOffTrack}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const COLORS = {
  background: '#07101F',
  header: '#0B1424',
  card: '#10192B',
  input: '#0B1424',
  border: 'rgba(148,163,184,0.22)',
  divider: 'rgba(148,163,184,0.12)',
  primary: '#67E8F9',
  text: '#F8FAFC',
  muted: '#94A3B8',
  placeholder: '#64748B',
  success: '#86EFAC',
  successBg: 'rgba(34,197,94,0.10)',
  successBorder: 'rgba(34,197,94,0.25)',
  error: '#FCA5A5',
  errorBg: 'rgba(239,68,68,0.10)',
  errorBorder: 'rgba(239,68,68,0.25)',
  switchOnTrack: 'rgba(103,232,249,0.35)',
  switchOffTrack: '#CBD5E1',
  switchThumb: '#94A3B8',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.header,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.18)',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  pageHeader: {
    marginBottom: 20,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  breadcrumbTouchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbMuted: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(148, 163, 184, 0.7)',
  },
  breadcrumbActive: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.primary,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  mainHeadingGradient: {
    color: COLORS.primary,
  },
  mainDescription: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  lastInputGroup: {
    marginBottom: 0,
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputLeftIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.input,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  inputWithLeftIcon: {
    paddingLeft: 42,
  },
  inputWithRightSteppers: {
    paddingRight: 40,
  },
  stepperContainer: {
    position: 'absolute',
    right: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  stepperButton: {
    padding: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 6,
    opacity: 0.8,
  },
  textArea: {
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  switchDescription: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  infoBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 20, 36, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.divider,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 8,
  },
  errorBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  successBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    marginBottom: 16,
  },
  successText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  discardButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.45)',
    backgroundColor: 'rgba(103,232,249,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
  },
});