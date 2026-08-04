import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  MoreVertical,
  Wallet,
  CalendarDays,
  Tag,
  CreditCard,
  FileText,
  Paperclip,
  UploadCloud,
  CheckCircle2,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useBranch } from "../../components/BranchProvider";
import { apiClient } from '../../api/client';

// Backend only accepts these exact values for paymentMethod (see CreateExpenseDto)
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

type Branch = {
  id: string;
  name: string;
  isMainBranch: boolean;
};

type ExpenseCategory = {
  id: string;
  name: string;
};

function formatDisplayDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatIsoDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateExpenseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Branch
  const { branches, selectedBranchId, isLoadingBranches: loadingBranches } = useBranch();

  // Categories (depend on branch)
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form fields
  const [amount, setAmount] = useState('');
  const [date] = useState(new Date());
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [note, setNote] = useState('');
  const [attachment, setAttachment] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Matches web's combobox behaviour: filter existing categories as the user types
  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );


  // Load categories whenever the branch changes
  useEffect(() => {
    if (!selectedBranchId) return;

    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const res = await apiClient.get('/expense-categories', {
          params: { branchId: selectedBranchId },
        });
        const loaded: ExpenseCategory[] = Array.isArray(res.data) ? res.data : [];
        setCategories(loaded.map((c) => c.name));
      } catch (err) {
        console.error('Failed to load expense categories:', err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [selectedBranchId]);

  const handlePickAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setAttachment(result.assets[0]);
    }
  };

  const handleLogExpense = async () => {
    setError(null);

    if (!selectedBranchId) {
      setError('No branch found. Please try again later.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!categorySearch.trim()) {
      setError('Please enter a category.');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('branchId', selectedBranchId);
      payload.append('amount', amount);
      payload.append('category', categorySearch.trim());
      payload.append('paymentMethod', paymentMethod);
      payload.append('date', formatIsoDate(date));
      if (note.trim()) payload.append('note', note.trim());

      if (attachment?.uri) {
        payload.append('attachment', {
          uri: attachment.uri,
          name: attachment.fileName || `receipt-${Date.now()}.jpg`,
          type: attachment.mimeType || 'image/jpeg',
        } as any);
      }

      const res = await apiClient.post('/expenses', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 200 || res.status === 201) {
        Alert.alert('Success', 'Expense logged successfully.');
        router.back();
      } else {
        setError('Failed to log expense.');
      }
    } catch (err: any) {
      console.error('Failed to create expense:', err);
      setError(err?.response?.data?.message || 'Failed to log expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: colors.surface + '99',
            borderBottomColor: colors.primary + '1A',
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Create Expense</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MoreVertical size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
            <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {/* Expense Details */}
        <GlassPanel style={styles.section}>
          <View style={[styles.sectionHeaderRow, { borderBottomColor: colors.primary + '1A' }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondary + '30' }]}>
              <Wallet size={18} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Details</Text>
          </View>

          {/* Branch (only show if more than one branch) */}
          {branches.length > 1 && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Branch</Text>
              <View
                style={[styles.selectRow, { backgroundColor: colors.surfaceVariant + '80', borderColor: colors.border }]}
              >
                <Text style={[styles.selectText, { color: colors.text, flex: 1 }]}>
                  {branches.find((b) => b.id === selectedBranchId)?.name ?? 'Select branch'}
                </Text>
              </View>
            </View>
          )}

          {/* Amount */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
            <View
              style={[styles.inputWrap, { backgroundColor: colors.surfaceVariant + '80', borderColor: colors.border }]}
            >
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary + '60'}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: colors.primary }]}
              />
            </View>
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
            <View
              style={[styles.selectRow, { backgroundColor: colors.surfaceVariant + '80', borderColor: colors.border }]}
            >
              <CalendarDays size={18} color={colors.primary} />
              <Text style={[styles.selectText, { color: colors.text }]}>{formatDisplayDate(date)}</Text>
            </View>
          </View>

          {/* Category — free-text with suggestions, same as web */}
          <View style={[styles.field, { zIndex: 20 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <View
              style={[styles.selectRow, { backgroundColor: colors.surfaceVariant + '80', borderColor: colors.border }]}
            >
              <Tag size={18} color={colors.primary} />
              <TextInput
                value={categorySearch}
                onChangeText={(text) => {
                  setCategorySearch(text);
                  setShowCategorySuggestions(true);
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                placeholder={loadingCategories ? 'Loading...' : 'e.g. Travel, Office'}
                placeholderTextColor={colors.textSecondary + '80'}
                style={[styles.selectText, { color: colors.text, flex: 1, padding: 0 }]}
              />
            </View>

            {showCategorySuggestions && (
              <View style={[styles.suggestionsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setCategorySearch(c);
                        setShowCategorySuggestions(false);
                      }}
                    >
                      <Text style={{ color: colors.text, fontSize: 14 }}>{c}</Text>
                    </TouchableOpacity>
                  ))
                ) : categorySearch.trim() ? (
                  <Text style={[styles.suggestionHint, { color: colors.textSecondary }]}>
                    "{categorySearch}" will be created
                  </Text>
                ) : null}
                <TouchableOpacity onPress={() => setShowCategorySuggestions(false)} style={styles.suggestionDone}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Method</Text>
            <TouchableOpacity
              onPress={() => setPaymentModalOpen(true)}
              style={[styles.selectRow, { backgroundColor: colors.surfaceVariant + '80', borderColor: colors.border }]}
            >
              <CreditCard size={18} color={colors.primary} />
              <Text style={[styles.selectText, { color: colors.text, flex: 1 }]}>{paymentMethod}</Text>
              <ChevronDown size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </GlassPanel>

        {/* Payment Note */}
        <GlassPanel style={styles.section}>
          <View style={styles.sectionHeaderRowNoBorder}>
            <View style={[styles.iconCircleSm, { backgroundColor: colors.secondary + '20' }]}>
              <FileText size={16} color={colors.primary} />
            </View>
            <Text style={[styles.sectionSubTitle, { color: colors.text }]}>Payment Note</Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add descriptions or tags here..."
            placeholderTextColor={colors.textSecondary + '80'}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.textarea, { backgroundColor: colors.surfaceVariant + '80', borderColor: colors.border, color: colors.text }]}
          />
        </GlassPanel>

        {/* Receipt & Attachments */}
        <GlassPanel style={styles.section}>
          <View style={styles.sectionHeaderRowNoBorder}>
            <View style={[styles.iconCircleSm, { backgroundColor: colors.secondary + '20' }]}>
              <Paperclip size={16} color={colors.primary} />
            </View>
            <Text style={[styles.sectionSubTitle, { color: colors.text }]}>Receipt &amp; Attachments</Text>
          </View>

          <TouchableOpacity
            onPress={handlePickAttachment}
            style={[styles.uploadBox, { backgroundColor: colors.surfaceVariant + '60', borderColor: colors.primary + '40' }]}
          >
            <View style={[styles.iconCircleSm, { backgroundColor: colors.primary + '1A' }]}>
              <UploadCloud size={18} color={colors.primary} />
            </View>
            <Text style={[styles.uploadText, { color: colors.text }]}>
              {attachment ? 'Receipt attached — tap to change' : 'Tap to upload receipt or PDF'}
            </Text>
          </TouchableOpacity>
        </GlassPanel>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 16, backgroundColor: colors.surface + 'CC', borderTopColor: colors.primary + '1A' },
        ]}
      >
        <TouchableOpacity
          onPress={handleLogExpense}
          disabled={saving || loadingBranches}
          style={[
            styles.logButton,
            { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40', opacity: saving || loadingBranches ? 0.6 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <CheckCircle2 size={20} color={colors.primary} />
              <Text style={[styles.logButtonText, { color: colors.primary }]}>Log Expense</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <SelectModal
        visible={paymentModalOpen}
        title="Select Payment Method"
        options={PAYMENT_METHODS}
        selected={paymentMethod}
        onSelect={(value) => {
          setPaymentMethod(value);
          setPaymentModalOpen(false);
        }}
        onClose={() => setPaymentModalOpen(false)}
      />
    </View>
  );
}

function SelectModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={[styles.modalOption, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>{item}</Text>
                {selected === item && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 64,
    borderBottomWidth: 1,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  errorBanner: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 4 },
  section: { marginBottom: 16, padding: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingBottom: 16, marginBottom: 20 },
  sectionHeaderRowNoBorder: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconCircleSm: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '600' },
  sectionSubTitle: { fontSize: 14, fontWeight: '600' },
  field: { marginBottom: 18 },
  label: { fontSize: 13, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14 },
  currencySymbol: { fontSize: 24, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '700', textAlign: 'right', padding: 0 },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  selectText: { fontSize: 15 },
  suggestionsBox: { borderWidth: 1, borderRadius: 10, marginTop: 6, overflow: 'hidden' },
  suggestionItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  suggestionHint: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, fontStyle: 'italic' },
  suggestionDone: { paddingVertical: 10, alignItems: 'center' },
  textarea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 90 },
  uploadBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 20 },
  uploadText: { fontSize: 13, fontWeight: '500' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 16 },
  logButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 16 },
  logButtonText: { fontSize: 17, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingHorizontal: 16, maxHeight: '60%' },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  modalOptionText: { fontSize: 15 },
});