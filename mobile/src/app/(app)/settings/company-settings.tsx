import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Building2,
  Edit2,
  X,
  Store,
  Users,
  IdCard,
  Package,
  ClipboardList,
  User,
  Save,
  Lock,
  Camera,
  MapPin,
  Briefcase,
} from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { GlassPanel } from '../../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '@/api/client';
import { ENV } from '@/config/env';

// Same logic as web's getImageUrl — turns a relative "/uploads/..." path
// into a full URL pointing at the backend server.
function getImageUrl(url?: string | null) {
  if (!url || url === 'null' || url === 'undefined') return '';
  const baseUrl = ENV.API_URL.replace('/api/v1', '');
  if (url.startsWith('/uploads')) return `${baseUrl}${url}`;
  if (url.startsWith('uploads/')) return `${baseUrl}/${url}`;
  return url;
}

interface Identifier {
  label?: string;
  key?: string;
  value: string;
}

interface Company {
  id: string;
  name: string;
  logo?: string;
  identifiers?: Identifier[];
  createdBy?: { fullName: string };
  branches?: { city: string; state: string }[];
  _count?: { branches: number; customers: number; users: number; products: number };
  subscription?: { status: string };
}

export default function CompanySettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editLogo, setEditLogo] = useState<string | null>(null); // base64 data URI, or "" to remove
  const [editTagline, setEditTagline] = useState('');
  const [editUniqueIdName, setEditUniqueIdName] = useState('');
  const [editUniqueIdValue, setEditUniqueIdValue] = useState('');

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/company');
      if (res.status === 200 && res.data?.company) {
        const c: Company = res.data.company;
        setCompany(c);
        setEditName(c.name || '');

        const ids = c.identifiers || [];
        const taglineObj = ids.find((i) => i.label === 'TAGLINE' || i.key === 'TAGLINE');
        setEditTagline(taglineObj ? taglineObj.value : '');

        const uniqueIdObj = ids.find(
          (i) => (i.label || i.key) && i.label !== 'TAGLINE' && i.key !== 'TAGLINE'
        );
        if (uniqueIdObj) {
          setEditUniqueIdName(uniqueIdObj.label || uniqueIdObj.key || '');
          setEditUniqueIdValue(uniqueIdObj.value || '');
        } else {
          setEditUniqueIdName('');
          setEditUniqueIdValue('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch company:', err);
      Alert.alert('Error', 'Could not load company details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      setEditLogo(`data:${mime};base64,${asset.base64}`);
    }
  };

  const handleRemoveLogo = () => {
    setEditLogo('');
    if (company) setCompany({ ...company, logo: '' });
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Cancelling — reset back to the last loaded values
      setEditName(company?.name || '');
    }
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Company name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const newIdentifiers: Identifier[] = [];
      if (editTagline.trim()) {
        newIdentifiers.push({ label: 'TAGLINE', value: editTagline.trim() });
      }
      if (editUniqueIdName.trim() && editUniqueIdValue.trim()) {
        newIdentifiers.push({ label: editUniqueIdName.trim(), value: editUniqueIdValue.trim() });
      }

      const payload: any = { name: editName, identifiers: newIdentifiers };
      if (editLogo !== null) payload.logo = editLogo;

      const res = await apiClient.put('/company', payload);

      if (res.status === 200) {
        setIsEditing(false);
        setEditLogo(null);
        fetchCompany();
        Alert.alert('Success', 'Company details updated.');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        Alert.alert(
          'Permission Denied',
          'Only the company Owner can update these details.'
        );
      } else if (status === 413) {
        Alert.alert('Image Too Large', 'Please choose a smaller logo image.');
      } else {
        Alert.alert(
          'Error',
          err?.response?.data?.message || 'Failed to save changes.'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const location = company?.branches?.[0]
    ? `${company.branches[0].city}, ${company.branches[0].state}`
    : 'Location Not Set';

  const displayTagline =
    company?.identifiers?.find((i) => i.label === 'TAGLINE' || i.key === 'TAGLINE')?.value || '';
  const displayIdentifiers =
    company?.identifiers?.filter((i) => i.label !== 'TAGLINE' && i.key !== 'TAGLINE') || [];

  const isActive =
    company?.subscription?.status === 'ACTIVE' || company?.subscription?.status === 'TRIAL';

  const logoSource = editLogo || (company?.logo ? getImageUrl(company.logo) : '');

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
        <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBackground }]} />

        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '33' }]}
            activeOpacity={0.7}
          >
            <ArrowLeft color={colors.primary} size={18} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Company Settings</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 76, paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Company Profile Section */}
          <GlassPanel style={styles.profileCard}>
            <View style={styles.profileAccentLine}>
              <LinearGradient colors={[colors.primary + '80', 'transparent']} style={StyleSheet.absoluteFill} />
            </View>

            <TouchableOpacity style={styles.profileEditBtn} activeOpacity={0.7} onPress={handleToggleEdit}>
              {isEditing ? (
                <X color={colors.textSecondary} size={18} />
              ) : (
                <Edit2 color={colors.textSecondary} size={18} />
              )}
            </TouchableOpacity>

            <View style={styles.profileContent}>
              {/* Avatar image with glow + upload */}
              <TouchableOpacity
                style={styles.avatarWrapper}
                activeOpacity={0.8}
                onPress={handlePickLogo}
              >
                <View style={[styles.avatarGlow, { backgroundColor: colors.primary, opacity: 0.15 }]} />
                {logoSource ? (
                  <Image
                    source={{ uri: logoSource }}
                    style={[styles.avatarImage, { borderColor: colors.primary + '4D' }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarImage,
                      styles.avatarPlaceholder,
                      { borderColor: colors.primary + '4D', backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Building2 color={colors.primary} size={32} opacity={0.5} />
                  </View>
                )}
                <View style={[styles.avatarCameraBadge, { backgroundColor: colors.primary }]}>
                  <Camera color={isDark ? '#001f2e' : '#ffffff'} size={12} />
                </View>
                {logoSource ? (
                  <TouchableOpacity
                    style={styles.avatarRemoveBadge}
                    onPress={handleRemoveLogo}
                  >
                    <X color="#ffffff" size={12} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>

              <View style={styles.nameRow}>
                {isEditing ? (
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[
                      styles.companyNameInput,
                      { color: colors.text, borderColor: colors.primary + '66', backgroundColor: colors.surfaceVariant + '40' },
                    ]}
                    autoFocus
                  />
                ) : (
                  <Text style={[styles.companyName, { color: colors.text }]}>{company?.name || 'Company Name'}</Text>
                )}

                {/* Active Status Badge — same row as the name, matching web */}
                <View
                  style={[
                    styles.statusBadge,
                    isActive
                      ? { backgroundColor: '#4ade8022', borderColor: '#4ade8044' }
                      : { backgroundColor: colors.error + '22', borderColor: colors.error + '44' },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: isActive ? '#4ade80' : colors.error }]} />
                  <Text style={[styles.statusBadgeText, { color: isActive ? '#4ade80' : colors.error }]}>
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>

              {isEditing ? (
                <View style={styles.taglineEditWrap}>
                  <TextInput
                    value={editTagline}
                    onChangeText={setEditTagline}
                    maxLength={100}
                    placeholder="Company Tagline (e.g. Smart Billing Solutions)"
                    placeholderTextColor={colors.textSecondary + '80'}
                    style={[
                      styles.taglineInput,
                      { color: colors.text, borderColor: colors.primary + '66', backgroundColor: colors.surfaceVariant + '40' },
                    ]}
                  />
                  <Text style={[styles.taglineCounter, { color: colors.textSecondary }]}>
                    {editTagline.length}/100 characters
                  </Text>
                </View>
              ) : (
                displayTagline ? (
                  <Text style={[styles.domainText, { color: colors.textSecondary, fontStyle: 'italic', marginBottom: 8 }]}>
                    "{displayTagline}"
                  </Text>
                ) : null
              )}

              {/* Location + Business Account — combined row matching web */}
              <View style={styles.domainRow}>
                <MapPin color={colors.primary} size={14} style={{ marginRight: 4 }} />
                <Text style={[styles.domainText, { color: colors.textSecondary }]}>{location}</Text>
                <View style={[styles.domainDot, { backgroundColor: colors.border }]} />
                <Briefcase color={colors.secondary} size={14} style={{ marginRight: 4 }} />
                <Text style={[styles.domainText, { color: colors.textSecondary }]}>Business Account</Text>
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
              <Text style={[styles.statValue, { color: colors.text }]}>{company?._count?.branches ?? 0}</Text>
            </GlassPanel>

            <GlassPanel style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL CUSTOMERS</Text>
                <Users color={colors.primary} size={18} opacity={0.7} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{company?._count?.customers ?? 0}</Text>
            </GlassPanel>

            <GlassPanel style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL STAFF</Text>
                <IdCard color={colors.primary} size={18} opacity={0.7} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{company?._count?.users ?? 0}</Text>
            </GlassPanel>

            <GlassPanel style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL PRODUCTS</Text>
                <Package color={colors.primary} size={18} opacity={0.7} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{company?._count?.products ?? 0}</Text>
            </GlassPanel>
          </View>

          {/* Business Details Form Section */}
          <GlassPanel style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <ClipboardList color={colors.primary} size={20} style={{ marginRight: 8 }} />
              <Text style={[styles.detailsTitle, { color: colors.text }]}>Business Details</Text>
            </View>

            <View style={styles.fieldsContainer}>
              <BusinessField label="Company ID" value={company?.id || ''} isMono locked />

              <BusinessField
                label="Created By"
                value={company?.createdBy?.fullName || ''}
                rightIcon={<User color={colors.textSecondary} size={14} opacity={0.6} />}
              />

              {isEditing ? (
                <>
                  <EditableField
                    label="Unique ID Name"
                    value={editUniqueIdName}
                    onChangeText={setEditUniqueIdName}
                    placeholder="e.g. GSTIN, Registration No."
                  />
                  <EditableField
                    label="Unique ID Number"
                    value={editUniqueIdValue}
                    onChangeText={setEditUniqueIdValue}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    isMono
                  />
                </>
              ) : (
                displayIdentifiers.length > 0 ? (
                  displayIdentifiers.map((ident, idx) => (
                    <BusinessField
                      key={idx}
                      label={(ident.label || ident.key || '').replace(/_/g, ' ')}
                      value={ident.value}
                      isMono
                      locked
                    />
                  ))
                ) : (
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    No business identifiers added yet.
                  </Text>
                )
              )}
            </View>
          </GlassPanel>

          {/* Save Button */}
          <View style={styles.saveBtnContainer}>
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={isSaving || (!isEditing && editLogo === null)}
            >
              <LinearGradient
                colors={isDark ? ['#7dd3fc', '#0284c7'] : [colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.saveBtnGradient,
                  isSaving || (!isEditing && editLogo === null) ? { opacity: 0.6 } : null,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={isDark ? '#001f2e' : '#ffffff'} />
                ) : (
                  <>
                    <Save color={isDark ? '#001f2e' : '#ffffff'} size={18} style={{ marginRight: 8 }} />
                    <Text style={[styles.saveBtnText, { color: isDark ? '#001f2e' : '#ffffff' }]}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Read-only field (Company ID, Created By, saved identifiers)
interface BusinessFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  isMono?: boolean;
  locked?: boolean;
  rightIcon?: React.ReactNode;
}

function BusinessField({ label, value, icon, isMono = false, locked = false, rightIcon }: BusinessFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.fieldRow}>
      <View style={styles.labelRow}>
        {icon}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <View style={[styles.inputGlass, { backgroundColor: colors.surfaceVariant + '22', borderColor: colors.glassBorder }]}>
        <Text
          style={[styles.inputText, { color: colors.text }, isMono && styles.fontMono]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {rightIcon ? (
          <View style={styles.inputEditBtn}>{rightIcon}</View>
        ) : (
          locked && (
            <View style={styles.inputEditBtn}>
              <Lock color={colors.textSecondary} size={14} opacity={0.5} />
            </View>
          )
        )}
      </View>
    </View>
  );
}

// Editable field, used only while isEditing is true
interface EditableFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isMono?: boolean;
}

function EditableField({ label, value, onChangeText, placeholder, isMono = false }: EditableFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.fieldRow}>
      <View style={styles.labelRow}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary + '80'}
        autoCapitalize={isMono ? 'characters' : 'sentences'}
        style={[
          styles.inputGlass,
          styles.editableInput,
          { color: colors.text, backgroundColor: colors.surfaceVariant + '40', borderColor: colors.primary + '66' },
          isMono && styles.fontMono,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00000000',
  },
  avatarRemoveBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
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
    minWidth: 200,
  },
  taglineEditWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  taglineInput: {
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 320,
    textAlign: 'center',
  },
  taglineCounter: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  domainDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
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
    marginRight: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
  editableInput: {
    fontSize: 14,
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
