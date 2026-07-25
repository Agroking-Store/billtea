import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import {
  MapPin,
  Edit2,
  Trash2,
  Plus,
  Building2,
  X,
  Check,
  Phone,
  User as UserIcon,
} from 'lucide-react-native';
import { GlassPanel } from '../../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../../components/ui/AppHeader';
import { apiClient } from '../../../api/client';
import { ENV } from '../../../config/env';

type Branch = {
  id: string;
  name: string;
  isMainBranch?: boolean;
};

type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  role: 'OWNER' | 'MANAGER' | string;
  isActive: boolean;
  branches: Branch[];
  _count?: {
    quotationsCreated?: number;
    invoicesCreated?: number;
    customersCreated?: number;
    expensesCreated?: number;
    productsCreated?: number;
  };
};

type FormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  selectedBranches: string[];
};

const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  selectedBranches: [],
};

const SMALL_SCREEN_WIDTH = 380;

export default function UserManagementScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_WIDTH;

  const [users, setUsers] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [userRes, branchRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/branches'),
      ]);

      if (userRes.data?.users) {
        setUsers(userRes.data.users);
      }
      if (branchRes.data?.branches) {
        setBranches(branchRes.data.branches);
      }
    } catch (err: any) {
      console.error('Failed to load staff management data:', err);
      setError(err.response?.data?.message || 'Failed to load staff list from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getAvatarUrl = (user: StaffMember) => {
    if (user.profilePicture && user.profilePicture.trim() !== '') {
      if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
        return user.profilePicture;
      }
      const baseUrl = ENV.API_URL.replace('/api/v1', '');
      return user.profilePicture.startsWith('/')
        ? `${baseUrl}${user.profilePicture}`
        : `${baseUrl}/${user.profilePicture}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0284c7&color=ffffff&bold=true`;
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUserId(null);
    setFormData({
      ...EMPTY_FORM,
      selectedBranches: branches.map((b) => b.id),
    });
    setFormError('');
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (user: StaffMember) => {
    setModalMode('edit');
    setSelectedUserId(user.id);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      password: '',
      selectedBranches: user.branches?.map((b) => b.id) || [],
    });
    setFormError('');
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalVisible(false);
  };

  const handleBranchToggle = (branchId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedBranches.includes(branchId);
      if (exists) {
        return { ...prev, selectedBranches: prev.selectedBranches.filter((id) => id !== branchId) };
      } else {
        return { ...prev, selectedBranches: [...prev.selectedBranches, branchId] };
      }
    });
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!formData.fullName.trim()) {
      setFormError('Full Name is required (at least 3 characters).');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Valid Email address is required.');
      return;
    }
    if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber.trim())) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    if (modalMode === 'create') {
      if (!formData.password || formData.password.length < 6) {
        setFormError('Password is required (minimum 6 characters).');
        return;
      }
    } else {
      if (formData.password && formData.password.length < 6) {
        setFormError('New password must be at least 6 characters.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const payload = {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phoneNumber: formData.phoneNumber.trim(),
          password: formData.password,
          role: 'MANAGER',
          branches: formData.selectedBranches,
        };
        await apiClient.post('/users/create', payload);
        Alert.alert('Success', 'Staff member created successfully!');
      } else if (selectedUserId) {
        const payload: any = {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phoneNumber: formData.phoneNumber.trim(),
          role: 'MANAGER',
          branches: formData.selectedBranches,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await apiClient.put(`/users/${selectedUserId}`, payload);
        Alert.alert('Success', 'Staff member updated successfully!');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (err: any) {
      console.error('Submit staff error:', err.response?.data || err.message);
      let msg = err.response?.data?.message || 'Failed to save staff member details.';
      if (Array.isArray(msg)) msg = msg.join(', ');
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (user: StaffMember) => {
    if (user.role === 'OWNER') {
      Alert.alert('Action Restricted', 'Owner accounts cannot be deleted from staff management.');
      return;
    }

    Alert.alert(
      'Remove Staff Member',
      `Are you sure you want to remove ${user.fullName}? This action will deactivate their account access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/users/${user.id}`);
              Alert.alert('Success', 'Staff member deactivated successfully.');
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to remove staff member.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <LinearGradient
        colors={isDark ? ['#030712', '#0f172a', '#030712'] : ['#f8fafc', '#f1f5f9', '#e2e8f0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <AppHeader title="Staff Management" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 24, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Action Header */}
        <View style={[styles.actionBar, isSmallScreen && styles.actionBarSmall]}>
          <View style={isSmallScreen && styles.actionBarTextSmall}>
            <Text style={[styles.title, { color: colors.text }]}>
              {loading ? 'Loading...' : `${users.length} Staff configured`}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage team access and assigned branches
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenCreateModal}
            style={[
              styles.addButton,
              isSmallScreen && styles.addButtonSmall,
              { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '4D' },
            ]}
          >
            <Plus color={colors.primary} size={20} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Staff</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
            <Text style={{ color: colors.error, fontSize: 13, fontWeight: '500' }}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
              Fetching staff details from database...
            </Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UserIcon size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Staff Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You haven't added any staff members to your company yet.
            </Text>
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              style={[styles.addButton, { backgroundColor: colors.primary, marginTop: 16 }]}
            >
              <Plus color="#ffffff" size={18} />
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>Add First Staff</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.userList}>
            {users.map((user) => {
              const counts = user._count || {};
              return (
                <GlassPanel key={user.id} style={styles.userCard}>
                  <View style={styles.cardContent}>
                    {/* User Profile Header */}
                    <View style={[styles.userInfo, isSmallScreen && styles.userInfoSmall]}>
                      <View
                        style={[
                          styles.avatarContainer,
                          isSmallScreen && styles.avatarContainerSmall,
                          { borderColor: colors.primary + '33' },
                        ]}
                      >
                        <Image source={{ uri: getAvatarUrl(user) }} style={styles.avatar} />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                          {user.fullName}
                        </Text>
                        <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                          {user.email}
                        </Text>

                        <View style={styles.roleLocationRow}>
                          <View
                            style={[
                              styles.roleBadge,
                              {
                                backgroundColor:
                                  user.role === 'OWNER'
                                    ? colors.secondary + '26'
                                    : colors.primary + '1A',
                                borderColor:
                                  user.role === 'OWNER'
                                    ? colors.secondary + '4D'
                                    : colors.primary + '33',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleText,
                                { color: user.role === 'OWNER' ? colors.secondary : colors.primary },
                              ]}
                            >
                              {user.role}
                            </Text>
                          </View>

                          <View style={styles.locationContainer}>
                            <Phone color={colors.textSecondary} size={13} />
                            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                              {user.phoneNumber}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Assigned Branches */}
                    <View style={[styles.branchesSection, { borderTopColor: colors.primary + '1A' }]}>
                      <View style={styles.branchesHeader}>
                        <Building2 color={colors.textSecondary} size={16} />
                        <Text style={[styles.branchesLabel, { color: colors.text }]}>Assigned Branches</Text>
                      </View>

                      <View style={styles.branchList}>
                        {user.branches && user.branches.length > 0 ? (
                          user.branches.map((branch) => {
                            const stats = [
                              { key: 'quotations', label: 'Quotations', value: counts.quotationsCreated || 0 },
                              { key: 'invoices', label: 'Invoices', value: counts.invoicesCreated || 0 },
                              { key: 'customers', label: 'Customers', value: counts.customersCreated || 0 },
                              { key: 'expenses', label: 'Expenses', value: counts.expensesCreated || 0 },
                            ];
                            return (
                              <View
                                key={branch.id || branch.name}
                                style={[
                                  styles.branchCard,
                                  { backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
                                ]}
                              >
                                <Text style={[styles.branchName, { color: colors.text }]} numberOfLines={1}>
                                  {branch.name}
                                </Text>

                                <View style={[styles.statGrid, isSmallScreen && styles.statGridSmall]}>
                                  {stats.map(({ key, label, value }) => (
                                    <View
                                      key={key}
                                      style={[styles.statItem, isSmallScreen && styles.statItemSmall]}
                                    >
                                      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                                      <Text
                                        style={[styles.statLabel, { color: colors.textSecondary }]}
                                        numberOfLines={1}
                                      >
                                        {label}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={[styles.noBranchesText, { color: colors.textSecondary }]}>
                            No branches assigned
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Card Actions */}
                    <View style={[styles.actionButtons, { borderTopColor: colors.primary + '1A' }]}>
                      <TouchableOpacity
                        onPress={() => handleOpenEditModal(user)}
                        style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant + '40' }]}
                      >
                        <Edit2 color={colors.primary} size={18} />
                      </TouchableOpacity>
                      {user.role !== 'OWNER' && (
                        <TouchableOpacity
                          onPress={() => handleDelete(user)}
                          style={[styles.actionBtn, { backgroundColor: colors.error + '1A' }]}
                        >
                          <Trash2 color={colors.error} size={18} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </GlassPanel>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Staff Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal} />

          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.primary + '26' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.primary + '1A' }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {modalMode === 'create' ? 'Add New Staff' : 'Edit Staff Profile'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {modalMode === 'create'
                    ? 'Create a manager account and assign branch access.'
                    : 'Update account info, password or branch permissions.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceVariant + '40' }]}
              >
                <X color={colors.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {!!formError && (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '14', borderColor: colors.error + '33' }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{formError}</Text>
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                value={formData.fullName}
                onChangeText={(v) => setFormData((prev) => ({ ...prev, fullName: v }))}
                placeholder="e.g. Robert Sterling"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Email Address *</Text>
              <TextInput
                value={formData.email}
                onChangeText={(v) => setFormData((prev) => ({ ...prev, email: v }))}
                placeholder="robert@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Phone Number (10 Digits) *</Text>
              <TextInput
                value={formData.phoneNumber}
                onChangeText={(v) => setFormData((prev) => ({ ...prev, phoneNumber: v }))}
                placeholder="9876543210"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {modalMode === 'create' ? 'Password *' : 'New Password (Leave blank to keep existing)'}
              </Text>
              <TextInput
                value={formData.password}
                onChangeText={(v) => setFormData((prev) => ({ ...prev, password: v }))}
                placeholder={modalMode === 'create' ? 'Minimum 6 characters' : 'Enter new password'}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16 }]}>Branch Access Permissions</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
                Select branches this staff member can access:
              </Text>
              <View style={styles.branchCheckboxGroup}>
                {branches.map((b) => {
                  const isSelected = formData.selectedBranches.includes(b.id);
                  return (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => handleBranchToggle(b.id)}
                      style={[
                        styles.branchCheckboxBtn,
                        {
                          backgroundColor: isSelected ? colors.primary + '1A' : colors.surfaceVariant + '26',
                          borderColor: isSelected ? colors.primary + '66' : colors.primary + '1A',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.checkboxIcon,
                          {
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderColor: isSelected ? colors.primary : colors.textSecondary,
                          },
                        ]}
                      >
                        {isSelected && <Check color="#ffffff" size={12} />}
                      </View>
                      <Text style={[styles.branchCheckboxText, { color: isSelected ? colors.primary : colors.text }]}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {branches.length === 0 && (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
                    No branches configured. Add branches first.
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.primary + '1A' }]}>
              <TouchableOpacity
                onPress={handleCloseModal}
                disabled={isSubmitting}
                style={[styles.footerBtn, styles.cancelBtn, { borderColor: colors.primary + '26' }]}
              >
                <Text style={[styles.footerBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={[styles.footerBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={[styles.footerBtnText, { color: '#ffffff' }]}>
                    {modalMode === 'create' ? 'Save Staff' : 'Update Staff'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actionBarSmall: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  actionBarTextSmall: {
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  addButtonSmall: {
    width: '100%',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  userList: {
    gap: 16,
  },
  userCard: {},
  cardContent: {
    flexDirection: 'column',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  userInfoSmall: {
    gap: 12,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarContainerSmall: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.8,
    flexShrink: 1,
  },
  locationText: {
    fontSize: 12,
    flexShrink: 1,
  },
  branchesSection: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  branchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  branchesLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  branchList: {
    gap: 12,
  },
  branchCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  branchName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statGridSmall: {
    gap: 8,
  },
  statItem: {
    flexGrow: 1,
    flexBasis: '18%',
    minWidth: 60,
    alignItems: 'center',
  },
  statItemSmall: {
    flexBasis: '30%',
    minWidth: 72,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  noBranchesText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 14,
  },
  actionBtn: {
    padding: 10,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    maxWidth: 260,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  branchCheckboxGroup: {
    gap: 8,
    marginTop: 4,
  },
  branchCheckboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkboxIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchCheckboxText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  saveBtn: {},
  footerBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});