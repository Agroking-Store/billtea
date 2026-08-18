import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Info, MapPin, Building2, FileText, Settings, Plus, Trash2, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { GlassPanel } from '../../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../../components/ui/AppHeader';
import { apiClient } from '../../../api/client';
import { useBranch } from '../../../components/BranchProvider';

type TaxItem = {
  label: string;
  value: number;
};

export default function CreateBranchScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshBranches } = useBranch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    taxes: [{ label: '', value: 0 }] as TaxItem[],
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    signatureValue: '',
    isMainBranch: false,
    isActive: true,
  });

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleTaxChange = (index: number, field: 'label' | 'value', val: any) => {
    const updated = [...formData.taxes];
    updated[index] = {
      ...updated[index],
      [field]: field === 'value' ? (isNaN(parseFloat(val)) ? 0 : parseFloat(val)) : val,
    };
    setFormData((prev) => ({ ...prev, taxes: updated }));
  };

  const addTaxField = () => {
    if (formData.taxes.length < 5) {
      setFormData((prev) => ({
        ...prev,
        taxes: [...prev.taxes, { label: '', value: 0 }],
      }));
    }
  };

  const removeTaxField = (index: number) => {
    const updated = [...formData.taxes];
    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      taxes: updated.length > 0 ? updated : [{ label: '', value: 0 }],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Branch Name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    // Filter valid taxes
    const validTaxes = formData.taxes.filter((t) => t.label.trim() !== '');

    try {
      const res = await apiClient.post('/branches', {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        taxes: validTaxes,
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim(),
        upiId: formData.upiId.trim(),
        signatureValue: formData.signatureValue.trim(),
        isMainBranch: formData.isMainBranch,
        isActive: formData.isActive,
      });

      if (res.status === 201 || res.data?.success) {
        await refreshBranches();
        if (Platform.OS === 'web') {
          window.alert('Branch created successfully!');
        } else {
          Alert.alert('Success', 'Branch created successfully!');
        }
        router.back();
      } else {
        setError(res.data?.message || 'Failed to create branch');
      }
    } catch (err: any) {
      console.error('Create Branch Error:', err);
      const errMsg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Failed to create branch. Please try again.');
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? ['#081326', '#111b2f'] : [colors.background, colors.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <AppHeader title="Create New Branch" showBackButton onBackPress={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
            <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600' }}>{error}</Text>
          </View>
        )}

        {/* SECTION 1: BASIC DETAILS */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
              <Info color={colors.primary} size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>BASIC DETAILS</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Branch Name <Text style={{ color: colors.error }}>*</Text></Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
              placeholder="e.g. Surat Main Branch"
              placeholderTextColor={colors.textSecondary + '80'}
              value={formData.name}
              onChangeText={(val) => handleChange('name', val)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textSecondary + '80'}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(val) => handleChange('phone', val)}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                placeholder="branch@company.com"
                placeholderTextColor={colors.textSecondary + '80'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(val) => handleChange('email', val)}
              />
            </View>
          </View>
        </GlassPanel>

        {/* SECTION 2: LOCATION & TAX */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
              <MapPin color={colors.primary} size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>LOCATION & TAX</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Address Line</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
              placeholder="Shop 101, Building Name, Street..."
              placeholderTextColor={colors.textSecondary + '80'}
              value={formData.address}
              onChangeText={(val) => handleChange('address', val)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>City</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                placeholder="e.g. Surat"
                placeholderTextColor={colors.textSecondary + '80'}
                value={formData.city}
                onChangeText={(val) => handleChange('city', val)}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>State</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                placeholder="e.g. Gujarat"
                placeholderTextColor={colors.textSecondary + '80'}
                value={formData.state}
                onChangeText={(val) => handleChange('state', val)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Pincode</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
              placeholder="e.g. 395007"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="number-pad"
              value={formData.pincode}
              onChangeText={(val) => handleChange('pincode', val)}
            />
          </View>

          {/* DYNAMIC TAX SETTINGS */}
          <View style={styles.taxHeaderRow}>
            <Text style={[styles.label, { color: colors.text, fontWeight: '700' }]}>Tax Settings (Max 5)</Text>
            {formData.taxes.length < 5 && (
              <TouchableOpacity onPress={addTaxField} style={styles.addTaxBtn}>
                <Plus size={14} color={colors.primary} />
                <Text style={[styles.addTaxText, { color: colors.primary }]}>Add Tax</Text>
              </TouchableOpacity>
            )}
          </View>

          {formData.taxes.map((tax, idx) => (
            <View key={idx} style={styles.taxRow}>
              <View style={{ flex: 2 }}>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                  placeholder="e.g. CGST @ 9%"
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={tax.label}
                  onChangeText={(val) => handleTaxChange(idx, 'label', val)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary + '80'}
                  keyboardType="numeric"
                  value={String(tax.value || '')}
                  onChangeText={(val) => handleTaxChange(idx, 'value', val)}
                />
              </View>
              {formData.taxes.length > 1 && (
                <TouchableOpacity onPress={() => removeTaxField(idx)} style={styles.deleteTaxBtn}>
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </GlassPanel>

        {/* SECTION 3: BANK DETAILS (OPTIONAL) */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
              <Building2 color={colors.primary} size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>BANK DETAILS</Text>
            <View style={[styles.optionalBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.optionalText, { color: colors.textSecondary }]}>OPTIONAL</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Bank Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                placeholder="e.g. HDFC Bank"
                placeholderTextColor={colors.textSecondary + '80'}
                value={formData.bankName}
                onChangeText={(val) => handleChange('bankName', val)}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Account Number</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                placeholder="e.g. 50100200..."
                placeholderTextColor={colors.textSecondary + '80'}
                keyboardType="number-pad"
                value={formData.accountNumber}
                onChangeText={(val) => handleChange('accountNumber', val)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>IFSC Code</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                placeholder="e.g. HDFC0001234"
                placeholderTextColor={colors.textSecondary + '80'}
                autoCapitalize="characters"
                value={formData.ifscCode}
                onChangeText={(val) => handleChange('ifscCode', val)}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>UPI ID</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                placeholder="e.g. business@upi"
                placeholderTextColor={colors.textSecondary + '80'}
                autoCapitalize="none"
                value={formData.upiId}
                onChangeText={(val) => handleChange('upiId', val)}
              />
            </View>
          </View>
        </GlassPanel>

        {/* SECTION 4: SIGNATURE (OPTIONAL) */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
              <FileText color={colors.primary} size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>SIGNATURE</Text>
            <View style={[styles.optionalBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.optionalText, { color: colors.textSecondary }]}>OPTIONAL</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Signature Text</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
              placeholder="e.g. For Business Name, Authorized Signatory"
              placeholderTextColor={colors.textSecondary + '80'}
              value={formData.signatureValue}
              onChangeText={(val) => handleChange('signatureValue', val)}
            />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              ⓘ This text will be printed at the bottom of generated invoices/quotations.
            </Text>
          </View>
        </GlassPanel>

        {/* SECTION 5: CONFIGURATION */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
              <Settings color={colors.primary} size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CONFIGURATION</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.toggleBox, { backgroundColor: colors.surfaceVariant + '60', borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Main Branch</Text>
                <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                  Set as primary operating branch.
                </Text>
              </View>
              <Switch
                value={formData.isMainBranch}
                onValueChange={(val) => handleChange('isMainBranch', val)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={formData.isMainBranch ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={[styles.toggleBox, { backgroundColor: colors.surfaceVariant + '60', borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Active Status</Text>
                <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                  Enable branch operations.
                </Text>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(val) => handleChange('isActive', val)}
                trackColor={{ false: colors.border, true: '#4ade8080' }}
                thumbColor={formData.isActive ? '#4ade80' : '#f4f3f4'}
              />
            </View>
          </View>
        </GlassPanel>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
        >
          {loading ? (
            <ActivityIndicator color="#0f172a" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Save Branch</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  helperText: {
    fontSize: 11,
    marginTop: 2,
  },
  taxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  addTaxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTaxText: {
    fontSize: 12,
    fontWeight: '700',
  },
  taxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteTaxBtn: {
    padding: 8,
  },
  toggleBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: 'rgba(125, 211, 252, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
});
