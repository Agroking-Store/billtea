import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppHeader } from '../../components/ui/AppHeader';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useBranch } from '../../components/BranchProvider';
import { apiClient } from '@/api/client';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle } from 'lucide-react-native';

export default function CreateCustomerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { selectedBranchId } = useBranch();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    email: '',
    mobileNumber: '',
    businessLabel: '',
    businessLabelValue: '',
    address: '',
    otherInfo: ''
  });

  const handleSave = async () => {
    if (!formData.customerName || !formData.mobileNumber) {
      Alert.alert('Required', 'Customer Name and Mobile Number are required.');
      return;
    }
    if (!selectedBranchId) {
      Alert.alert('Error', 'No branch selected.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, branchId: selectedBranchId };
      const res = await apiClient.post('/customers', payload);
      
      if (res.status === 201 || res.status === 200) {
        Alert.alert('Success', 'Customer created successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to create customer');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'An error occurred';
      Alert.alert('Error', Array.isArray(errMsg) ? errMsg.join('\n') : errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? ['#081326', '#111b2f'] : [colors.background, colors.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Blur Blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowCircle1, { backgroundColor: colors.primary, opacity: isDark ? 0.08 : 0.03 }]} />
        <View style={[styles.glowCircle2, { backgroundColor: colors.tertiary, opacity: isDark ? 0.08 : 0.03 }]} />
      </View>

      <AppHeader title="New Customer" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 16, paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <GlassPanel style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Customer Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Customer Name *</Text>
            <TextInput
              value={formData.customerName}
              onChangeText={(text) => setFormData({ ...formData, customerName: text })}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
              placeholder="e.g. John Doe"
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile Number *</Text>
            <TextInput
              value={formData.mobileNumber}
              onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
              placeholder="+1 234 567 8900"
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
              placeholder="john@example.com"
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Company Name</Text>
            <TextInput
              value={formData.companyName}
              onChangeText={(text) => setFormData({ ...formData, companyName: text })}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
              placeholder="Doe Enterprises"
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Business Label</Text>
              <TextInput
                value={formData.businessLabel}
                onChangeText={(text) => setFormData({ ...formData, businessLabel: text })}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                placeholder="e.g. GST No"
                placeholderTextColor={colors.textSecondary + '60'}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Label Value</Text>
              <TextInput
                value={formData.businessLabelValue}
                onChangeText={(text) => setFormData({ ...formData, businessLabelValue: text })}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                placeholder="Number/Value"
                placeholderTextColor={colors.textSecondary + '60'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Address</Text>
            <TextInput
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={2}
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
              placeholder="Full address"
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Other Info</Text>
            <TextInput
              value={formData.otherInfo}
              onChangeText={(text) => setFormData({ ...formData, otherInfo: text })}
              multiline
              numberOfLines={2}
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
              placeholder="Additional notes"
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>
        </GlassPanel>

        <TouchableOpacity 
          style={[styles.saveBtn, { shadowColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={isDark ? ['#7dd3fc', '#0284c7'] : [colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color={isDark ? '#001f2e' : '#ffffff'} />
            ) : (
              <>
                <CheckCircle color={isDark ? '#001f2e' : '#ffffff'} size={20} style={{ marginRight: 8 }} />
                <Text style={[styles.saveBtnText, { color: isDark ? '#001f2e' : '#ffffff' }]}>Save Customer</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    bottom: -100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
