import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { AppHeader } from '../../../components/ui/AppHeader';
import { apiClient } from '../../../api/client';
import { Check, Building2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Branch = {
  id: string;
  name: string;
};

export default function CreateStaffScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await apiClient.get('/branches');
        if (res.data?.branches) {
          setBranches(res.data.branches);
          setSelectedBranches(res.data.branches.map((b: Branch) => b.id));
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      } finally {
        setLoadingBranches(false);
      }
    }
    loadBranches();
  }, []);

  const toggleBranch = (id: string) => {
    setSelectedBranches((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    setError('');
    if (!fullName.trim()) {
      setError('Full Name is required (min 3 chars).');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!phoneNumber.trim() || !/^\d{10}$/.test(phoneNumber.trim())) {
      setError('Phone number must be 10 digits.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/users/create', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password: password,
        role: 'MANAGER',
        branches: selectedBranches,
      });

      Alert.alert('Success', 'Staff member created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error('Create staff error:', err.response?.data || err.message);
      let msg = err.response?.data?.message || 'Failed to create staff member.';
      if (Array.isArray(msg)) msg = msg.join(', ');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Add New Staff" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {!!error && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: colors.error + '1A', borderColor: colors.error + '40' },
              ]}
            >
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '500' }}>{error}</Text>
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
            ]}
          />

          <Text style={[styles.label, { color: colors.text }]}>Email Address *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="john@company.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
            ]}
          />

          <Text style={[styles.label, { color: colors.text }]}>Phone Number (10 Digits) *</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="9876543210"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            maxLength={10}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
            ]}
          />

          <Text style={[styles.label, { color: colors.text }]}>Initial Password *</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Min 6 characters"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Assigned Branches</Text>
          {loadingBranches ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : (
            <View style={{ gap: 8, marginTop: 6 }}>
              {branches.map((b) => {
                const selected = selectedBranches.includes(b.id);
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => toggleBranch(b.id)}
                    style={[
                      styles.branchBtn,
                      {
                        backgroundColor: selected ? colors.primary + '1A' : colors.surfaceVariant + '26',
                        borderColor: selected ? colors.primary + '66' : colors.primary + '1A',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: selected ? colors.primary : 'transparent',
                          borderColor: selected ? colors.primary : colors.textSecondary,
                        },
                      ]}
                    >
                      {selected && <Check color="#ffffff" size={12} />}
                    </View>
                    <Text style={{ color: selected ? colors.primary : colors.text, fontWeight: '600', fontSize: 14 }}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            onPress={handleCreate}
            disabled={submitting}
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary, marginTop: 30 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                Create Staff Account
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  branchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
