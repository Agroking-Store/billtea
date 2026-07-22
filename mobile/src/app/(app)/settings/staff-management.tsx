import React, { useState } from 'react';
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
} from 'react-native';
import { Stack, router } from 'expo-router';
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
} from 'lucide-react-native';
import { GlassPanel } from '../../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../../components/ui/AppHeader';

const INITIAL_USERS = [
  {
    id: '1',
    name: 'Robert Sterling',
    email: 'robert.s@billaro.io',
    role: 'Manager',
    location: 'Main HQ, North Sector',
    branches: [
      { name: 'North Sector HQ', quotations: 12, invoices: 34, customers: 58, expenses: 9 },
      { name: 'Downtown Branch', quotations: 4, invoices: 11, customers: 22, expenses: 3 },
      { name: 'Riverside Branch', quotations: 0, invoices: 6, customers: 15, expenses: 0 },
    ],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDngezLLFtEpKS-aadPvNpA-X1a6IbHTsEjQuFDsDZHp0jbiukNqveV3sx5AGCnsmd0NEeev8WJ6JvjZRfiHYSypy0CO3LC3x3fhd_rtMytKfBkFpdvfmiRRO3EyrROM3_4OhElDQQnfPdDSUTBLp74VDSAKRNRPftSgsFJ8T6MK5Z1dMzWyN7aXiBWqm5wJJX_2K3pWjAmEoHVOi4uvJnYwmZBJf_09JAA9KoDOqTkQ17p0oSQnpt5',
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    email: 'sarah.j@billaro.io',
    role: 'Staff',
    location: 'East Sector',
    branches: [
      { name: 'East Sector Branch', quotations: 7, invoices: 19, customers: 33, expenses: 5 },
    ],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSL6NjlvTKtkJT_wucJsBSg0CqS1-Sp8lOTdF4PdZLolCcLx1novp5MYfZvCnzmo1TDMlz1lbpzu0cUgNeeXZGPCrdbsGD-ows_b0WoCFOERZN8EnEXX6xH4UtpBX2BHaNU3PSf5jah62ns9JFSFgLm-PnNb284QTLfqai2lxppiO5WyGvMJIqRkmGvBneWsemLVg43VIBeCKT3OWdWqGXN0lz1Th1dzEaaYjGhq9-uWvmNIcDGvMx',
  },
  {
    id: '3',
    name: 'David Chen',
    email: 'david.c@billaro.io',
    role: 'Staff',
    location: 'Main HQ',
    branches: [
      { name: 'Main HQ Branch', quotations: 15, invoices: 28, customers: 47, expenses: 12 },
      { name: 'West End Branch', quotations: 2, invoices: 8, customers: 14, expenses: 1 },
    ],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB25qAmpwM-uIKGiFmhVhSn3XcSi0FwdlU-CHV_lyWjUOkeeL6yFnMJkjEDRu-q5NUjPZaupewA8e-TDekFaV09HhjONLoipNlz7VmQmixhXDFqvCRemP5ZvSvw8_AKgxUKFwX8iNJgq37lihhEp6qCeB2pBeEE6gsJmIfo7ZqzaGovWxaCisn3Q3KLHtHzCDOEBD5V8SecY1PZU0kDDN5pRtm-qX9mbBB0aUnLGiYY5_s0O2mTaYBj',
  },
];

// Breakpoint used to switch to a stacked / compact layout on narrow phones
const SMALL_SCREEN_WIDTH = 380;

type StaffMember = (typeof INITIAL_USERS)[number];

type FormState = {
  name: string;
  email: string;
  role: 'Manager' | 'Staff';
  location: string;
};

const EMPTY_FORM: FormState = { name: '', email: '', role: 'Staff', location: '' };

export default function UserManagementScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_WIDTH;

  // ── Added: local state for staff list + add/edit modal ──
  const [USERS, setUSERS] = useState<StaffMember[]>(INITIAL_USERS);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUserId(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (user: StaffMember) => {
    setModalMode('edit');
    setSelectedUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role as 'Manager' | 'Staff',
      location: user.location,
    });
    setFormError('');
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.location.trim()) {
      setFormError('Please fill in name, email, and location.');
      return;
    }

    if (modalMode === 'create') {
      const newUser: StaffMember = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        location: formData.location.trim(),
        branches: [],
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.name.trim()),
      };
      setUSERS((prev) => [...prev, newUser]);
    } else if (selectedUserId) {
      setUSERS((prev) =>
        prev.map((u) =>
          u.id === selectedUserId
            ? {
                ...u,
                name: formData.name.trim(),
                email: formData.email.trim(),
                role: formData.role,
                location: formData.location.trim(),
              }
            : u
        )
      );
    }

    setIsModalVisible(false);
  };

  const handleDelete = (user: StaffMember) => {
    Alert.alert(
      'Remove Staff Member',
      `Are you sure you want to remove ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUSERS((prev) => prev.filter((u) => u.id !== user.id));
          },
        },
      ]
    );
  };
  // ── End added state/handlers ──

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

      {/* Global Header */}
      <AppHeader title="Staff Management" />

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 24, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.actionBar, isSmallScreen && styles.actionBarSmall]}>
          <View style={isSmallScreen && styles.actionBarTextSmall}>
            <Text style={[styles.title, { color: colors.text }]}>{USERS.length} Staff configured</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage access and roles</Text>
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

        <View style={styles.userList}>
          {USERS.map((user) => (
            <GlassPanel key={user.id} style={styles.userCard}>
              <View style={styles.cardContent}>

                {/* Avatar and Info */}
                <View style={[styles.userInfo, isSmallScreen && styles.userInfoSmall]}>
                  <View
                    style={[
                      styles.avatarContainer,
                      isSmallScreen && styles.avatarContainerSmall,
                      { borderColor: colors.primary + '33' },
                    ]}
                  >
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                      {user.email}
                    </Text>

                    <View style={styles.roleLocationRow}>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor: user.role === 'Manager' ? colors.primary + '1A' : colors.secondary + '1A',
                            borderColor: user.role === 'Manager' ? colors.primary + '33' : colors.secondary + '33',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleText,
                            { color: user.role === 'Manager' ? colors.primary : colors.secondary },
                          ]}
                        >
                          {user.role}
                        </Text>
                      </View>

                      <View style={styles.locationContainer}>
                        <MapPin color={colors.textSecondary} size={14} />
                        <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {user.location}
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
                    {user.branches.map((branch) => {
                      const stats = [
  { key: 'quotations', label: 'Quotations', value: branch.quotations },
  { key: 'invoices', label: 'Invoices', value: branch.invoices },
  { key: 'customers', label: 'Customers', value: branch.customers },
  { key: 'expenses', label: 'Expenses', value: branch.expenses },
];
                      return (
                        <View
                          key={branch.name}
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
    <Text style={[styles.statValue, { color: colors.text }]}>
      {value}
    </Text>

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
                    })}
                    {user.branches.length === 0 && (
                      <Text style={[styles.noBranchesText, { color: colors.textSecondary }]}>
                        No branches assigned
                      </Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={[styles.actionButtons, { borderTopColor: colors.primary + '1A' }]}>
                  <TouchableOpacity
                    onPress={() => handleOpenEditModal(user)}
                    style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant + '00' }]}
                  >
                    <Edit2 color={colors.textSecondary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(user)}
                    style={[styles.actionBtn, { backgroundColor: colors.error + '1A' }]}
                  >
                    <Trash2 color={colors.error} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassPanel>
          ))}
        </View>
      </ScrollView>

      {/* ── Added: Add / Edit Staff Modal ── */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
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
                  {modalMode === 'create' ? 'Add New Staff' : 'Edit Staff'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {modalMode === 'create'
                    ? 'Create a staff account and assign a role.'
                    : "Update this staff member's details."}
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
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {!!formError && (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '14', borderColor: colors.error + '33' }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{formError}</Text>
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Full Name</Text>
              <TextInput
                value={formData.name}
                onChangeText={(v) => handleFieldChange('name', v)}
                placeholder="e.g. Jane Doe"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                value={formData.email}
                onChangeText={(v) => handleFieldChange('email', v)}
                placeholder="jane@company.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Location</Text>
              <TextInput
                value={formData.location}
                onChangeText={(v) => handleFieldChange('location', v)}
                placeholder="e.g. Main HQ, North Sector"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceVariant + '26', borderColor: colors.primary + '1F' },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Role</Text>
              <View style={styles.roleToggleRow}>
                {(['Manager', 'Staff'] as const).map((roleOption) => {
                  const isSelected = formData.role === roleOption;
                  return (
                    <TouchableOpacity
                      key={roleOption}
                      onPress={() => handleFieldChange('role', roleOption)}
                      style={[
                        styles.roleToggleBtn,
                        {
                          backgroundColor: isSelected ? colors.primary + '1A' : colors.surfaceVariant + '26',
                          borderColor: isSelected ? colors.primary + '66' : colors.primary + '1A',
                        },
                      ]}
                    >
                      {isSelected && <Check color={colors.primary} size={14} />}
                      <Text
                        style={[
                          styles.roleToggleText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {roleOption}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.primary + '1A' }]}>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={[styles.footerBtn, styles.cancelBtn, { borderColor: colors.primary + '26' }]}
              >
                <Text style={[styles.footerBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.footerBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.footerBtnText, { color: colors.background }]}>
                  {modalMode === 'create' ? 'Add Staff' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* ── End added modal ── */}
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
    shadowColor: 'rgba(125, 211, 252, 0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  addButtonSmall: {
    width: '100%',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: '500',
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
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
  },
  // ── Added: modal styles ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  roleToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  roleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleToggleText: {
    fontSize: 13,
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