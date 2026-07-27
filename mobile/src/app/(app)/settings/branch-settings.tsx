import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Phone, Eye, Edit2, Trash2, Plus, X, Building2, Mail, CreditCard, CheckCircle2 } from 'lucide-react-native';
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

type Branch = {
  id: string;
  name: string;
  isMainBranch: boolean;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  signatureValue?: string;
  taxes?: TaxItem[];
  isActive?: boolean;
};

export default function BranchSettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshBranches: refreshGlobalBranches } = useBranch();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [viewBranch, setViewBranch] = useState<Branch | null>(null);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [editFormData, setEditFormData] = useState({
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

  const loadBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/branches?all=true');
      if (res.status === 200 && res.data?.success) {
        setBranches(Array.isArray(res.data.branches) ? res.data.branches : []);
      } else {
        setError('Could not load branches.');
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError('Could not load branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const openEditModal = (branch: Branch) => {
    setEditBranch(branch);
    setEditFormData({
      name: branch.name || '',
      phone: branch.phone || '',
      email: branch.email || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      pincode: branch.pincode || '',
      taxes: Array.isArray(branch.taxes) && branch.taxes.length > 0 ? branch.taxes : [{ label: '', value: 0 }],
      bankName: branch.bankName || '',
      accountNumber: branch.accountNumber || '',
      ifscCode: branch.ifscCode || '',
      upiId: branch.upiId || '',
      signatureValue: branch.signatureValue || '',
      isMainBranch: !!branch.isMainBranch,
      isActive: branch.isActive !== false,
    });
  };

  const handleUpdateBranch = async () => {
    if (!editBranch) return;
    if (!editFormData.name.trim()) {
      Alert.alert('Error', 'Branch name cannot be empty.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const validTaxes = editFormData.taxes.filter((t) => t.label.trim() !== '');

      const res = await apiClient.put(`/branches/${editBranch.id}`, {
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
        email: editFormData.email.trim(),
        address: editFormData.address.trim(),
        city: editFormData.city.trim(),
        state: editFormData.state.trim(),
        pincode: editFormData.pincode.trim(),
        taxes: validTaxes,
        bankName: editFormData.bankName.trim(),
        accountNumber: editFormData.accountNumber.trim(),
        ifscCode: editFormData.ifscCode.trim(),
        upiId: editFormData.upiId.trim(),
        signatureValue: editFormData.signatureValue.trim(),
        isMainBranch: editFormData.isMainBranch,
        isActive: editFormData.isActive,
      });

      if (res.status === 200 || res.data?.success) {
        setEditBranch(null);
        await loadBranches();
        await refreshGlobalBranches();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to update branch.');
      }
    } catch (err: any) {
      console.error('Update Branch Error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update branch.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteBranch = (branch: Branch) => {
    if (branch.isMainBranch) {
      Alert.alert('Action Denied', 'Main branch cannot be deleted.');
      return;
    }

    const performDelete = async () => {
      try {
        const res = await apiClient.delete(`/branches/${branch.id}`);
        if (res.status === 200 || res.data?.success) {
          await loadBranches();
          await refreshGlobalBranches();
        } else {
          Alert.alert('Error', res.data?.message || 'Failed to delete branch.');
        }
      } catch (err: any) {
        console.error('Delete Branch Error:', err);
        Alert.alert('Error', err?.response?.data?.message || 'Failed to delete branch.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${branch.name}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Branch',
        `Are you sure you want to delete "${branch.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
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
      <AppHeader title="Branch Management" showBackButton onBackPress={() => router.back()} />

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 24, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionBar}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              {loading ? 'Loading branches...' : `${branches.length} Branches configured`}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your business locations</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings/create-branch')}
            style={[styles.addButton, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '4D' }]}
          >
            <Plus color={colors.primary} size={20} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Branch</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
            <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : branches.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No branches yet.</Text>
        ) : (
          <View style={styles.branchList}>
            {branches.map((branch) => (
              <GlassPanel key={branch.id} style={styles.branchCard}>
                {branch.isMainBranch && (
                  <LinearGradient
                    colors={[colors.primary, colors.tertiary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.mainHighlight}
                  />
                )}

                <View style={styles.cardHeader}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.branchName, { color: colors.text }]}>{branch.name}</Text>
                    {branch.isMainBranch && (
                      <View style={[styles.mainBadge, { backgroundColor: colors.primary + '4D', borderColor: colors.primary + '33' }]}>
                        <Text style={[styles.mainBadgeText, { color: colors.primary }]}>MAIN</Text>
                      </View>
                    )}
                    {!branch.isActive && (
                      <View style={[styles.mainBadge, { backgroundColor: colors.error + '33', borderColor: colors.error + '4D' }]}>
                        <Text style={[styles.mainBadgeText, { color: colors.error }]}>INACTIVE</Text>
                      </View>
                    )}
                  </View>

                  {(branch.city || branch.phone || branch.address) ? (
                    <View style={styles.infoRow}>
                      {branch.city ? (
                        <View style={styles.infoItem}>
                          <MapPin color={colors.primary} size={14} />
                          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{branch.city}</Text>
                        </View>
                      ) : null}
                      {branch.phone ? (
                        <View style={styles.infoItem}>
                          <Phone color={colors.primary} size={14} />
                          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{branch.phone}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.primary + '1A' }]}>
                  <View style={styles.actionButtons}>
                    {/* View Details */}
                    <TouchableOpacity
                      onPress={() => setViewBranch(branch)}
                      style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant + '80' }]}
                    >
                      <Eye color={colors.primary} size={18} />
                    </TouchableOpacity>

                    {/* Edit Branch */}
                    <TouchableOpacity
                      onPress={() => openEditModal(branch)}
                      style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant + '80' }]}
                    >
                      <Edit2 color={colors.textSecondary} size={18} />
                    </TouchableOpacity>

                    {/* Delete Branch */}
                    {!branch.isMainBranch && (
                      <TouchableOpacity
                        onPress={() => handleDeleteBranch(branch)}
                        style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant + '80' }]}
                      >
                        <Trash2 color={colors.error} size={18} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </GlassPanel>
            ))}
          </View>
        )}
      </ScrollView>

      {/* VIEW BRANCH MODAL */}
      <Modal visible={!!viewBranch} transparent animationType="fade" onRequestClose={() => setViewBranch(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setViewBranch(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: '#0F172A', borderColor: 'rgba(125, 211, 252, 0.25)' }]} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{viewBranch?.name}</Text>
              <Pressable onPress={() => setViewBranch(null)}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {viewBranch && (
              <ScrollView style={{ maxHeight: 350 }}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Address:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{viewBranch.address || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>City / State:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {[viewBranch.city, viewBranch.state, viewBranch.pincode].filter(Boolean).join(', ') || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{viewBranch.phone || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Email:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{viewBranch.email || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Bank Name:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{viewBranch.bankName || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Account No:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{viewBranch.accountNumber || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>IFSC Code:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{viewBranch.ifscCode || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>UPI ID:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{viewBranch.upiId || 'N/A'}</Text>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* EDIT BRANCH MODAL */}
      <Modal visible={!!editBranch} transparent animationType="fade" onRequestClose={() => setEditBranch(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditBranch(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: '#0F172A', borderColor: 'rgba(125, 211, 252, 0.25)' }]} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Branch</Text>
              <Pressable onPress={() => setEditBranch(null)}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Branch Name *</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                  value={editFormData.name}
                  onChangeText={(val) => setEditFormData((prev) => ({ ...prev, name: val }))}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                    value={editFormData.phone}
                    onChangeText={(val) => setEditFormData((prev) => ({ ...prev, phone: val }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                    value={editFormData.email}
                    onChangeText={(val) => setEditFormData((prev) => ({ ...prev, email: val }))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Address</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                  value={editFormData.address}
                  onChangeText={(val) => setEditFormData((prev) => ({ ...prev, address: val }))}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>City</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                    value={editFormData.city}
                    onChangeText={(val) => setEditFormData((prev) => ({ ...prev, city: val }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>State</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                    value={editFormData.state}
                    onChangeText={(val) => setEditFormData((prev) => ({ ...prev, state: val }))}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Main Branch</Text>
                  <Switch
                    value={editFormData.isMainBranch}
                    onValueChange={(val) => setEditFormData((prev) => ({ ...prev, isMainBranch: val }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Active Status</Text>
                  <Switch
                    value={editFormData.isActive}
                    onValueChange={(val) => setEditFormData((prev) => ({ ...prev, isActive: val }))}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleUpdateBranch}
                disabled={isSubmittingEdit}
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              >
                {isSubmittingEdit ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
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
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
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
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
  branchList: {
    gap: 16,
  },
  branchCard: {
    padding: 16,
  },
  mainHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  branchName: {
    fontSize: 18,
    fontWeight: '600',
  },
  mainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  inputGroup: {
    gap: 6,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  submitBtn: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
});
