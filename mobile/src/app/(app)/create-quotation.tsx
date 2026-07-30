import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MoreVertical, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Calendar as CalendarIcon, 
  Send,
  ChevronDown,
  User,
  Tag,
  FileText,
  Calculator,
  Upload
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useBranch } from "../../components/BranchProvider";
import { apiClient } from '@/api/client';
import { ENV } from '@/config/env';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppHeader } from '../../components/ui/AppHeader';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const getImageUrl = (url?: string) => {
  if (!url || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('/uploads')) {
    const baseUrl = ENV.API_URL.replace('/api/v1', '');
    return `${baseUrl}${url}`;
  }
  if (url.startsWith('uploads/')) {
    const baseUrl = ENV.API_URL.replace('/api/v1', '');
    return `${baseUrl}/${url}`;
  }
  return url;
};

interface LineItem {
  id: string;
  productId?: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  originalDescription: string;
  quantity: number;
  discount: { type: "PERCENTAGE" | "AMOUNT"; value: number };
  tax: number;
  image: string;
  sku: string;
  hsnCode: string;
}

export default function CreateQuotationScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, copyFromId } = useLocalSearchParams<{ id?: string; copyFromId?: string }>();
  const targetQuotationId = id || copyFromId;

  // --- STATE DEFINITIONS ---
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  
  // Backend Active State
  const { selectedBranchId, branches } = useBranch();
  
  const [formData, setFormData] = useState({
    customerId: '',
    quotationDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default +30 days
    shippingSameAsBilling: true,
    discountConfiguration: { mode: 'FIXED', type: 'PERCENTAGE', value: 0 },
    taxConfiguration: { mode: 'FIXED', customTaxActive: false, label: '', value: 0 },
    notes: '',
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    termsAndConditions: '',
  });

  const [showDatePicker, setShowDatePicker] = useState<{show: boolean, mode: 'quotation' | 'expiry' | 'followup'}>({show: false, mode: 'quotation'});

  // Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any>(null);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  // Address State
  const [billingAddress, setBillingAddress] = useState({ address: '', city: '', state: '', pincode: '' });
  const [shippingAddress, setShippingAddress] = useState({ address: '', city: '', state: '', pincode: '' });

  // Items State
  const [items, setItems] = useState<LineItem[]>([
    { id: Math.random().toString(), productId: '', name: '', description: '', price: 0, originalPrice: 0, originalDescription: '', quantity: 1, discount: { type: 'PERCENTAGE', value: 0 }, tax: 0, image: '', sku: '', hsnCode: '' }
  ]);
  const [productSearchRows, setProductSearchRows] = useState<{ [key: string]: { query: string, results: any[], show: boolean } }>({});
  
  const [activeProductSearchIdx, setActiveProductSearchIdx] = useState<string | null>(null);

  // Attachments State (Mobile version usually uses uri)
  const [attachments, setAttachments] = useState<any[]>([]);

  // Branch Taxes
  const [branchTaxConfig, setBranchTaxConfig] = useState({ label: 'GST', tax: 0 });
  const [branchTaxes, setBranchTaxes] = useState<any[]>([]);

  // Preview & Processing State
  const [calculatedTotals, setCalculatedTotals] = useState({ subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 });
  const [calculatedItems, setCalculatedItems] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const initialLoadDone = useRef(false);

  // Fetch document settings
  const fetchDocumentSettings = async (branchId: string) => {
    try {
      const res = await apiClient.get(`/document-settings/${branchId}?type=QUOTATION`);
      const terms = res.data?.terms || res.data?.termsAndConditions?.defaultSnapshot || res.data?.termsAndConditions || res.data?.settings?.terms || res.data?.settings?.termsAndConditions || '';
      if (terms) {
        setFormData(prev => ({ ...prev, termsAndConditions: terms }));
      }
    } catch (e) {
      console.log('Failed to fetch doc settings', e);
    }
  };

  // Setup branch defaults
  useEffect(() => {
    if (selectedBranchId && branches) {
      const branch: any = branches.find(b => String(b.id) === String(selectedBranchId));
      if (branch?.taxes && Array.isArray(branch.taxes) && branch.taxes.length > 0) {
        setBranchTaxes(branch.taxes);
        setBranchTaxConfig({ label: branch.taxes[0].label, tax: branch.taxes[0].percentage ?? branch.taxes[0].value ?? 0 });
      } else if (branch?.taxLabel) {
        setBranchTaxes([{ label: branch.taxLabel, percentage: branch.tax || 0 }]);
        setBranchTaxConfig({ label: branch.taxLabel, tax: branch.tax || 0 });
      } else {
        setBranchTaxes([]);
        setBranchTaxConfig({ label: 'GST', tax: 0 });
      }
    }
  }, [selectedBranchId, branches]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (selectedBranchId && branchTaxConfig.tax > 0) {
      setFormData(prev => ({
        ...prev,
        taxConfiguration: { ...prev.taxConfiguration, label: branchTaxConfig.label, value: branchTaxConfig.tax }
      }));
    }
  }, [branchTaxConfig]);

  // Fetch Quotation details for Edit Mode or Copy Mode
  useEffect(() => {
    if (targetQuotationId) {
      fetchQuotationToCopy(targetQuotationId);
    } else {
      initialLoadDone.current = true;
      if (selectedBranchId) fetchDocumentSettings(selectedBranchId);
    }
  }, [targetQuotationId, selectedBranchId]);

  const fetchQuotationToCopy = async (idToFetch: string) => {
    try {
      setIsLoadingQuotation(true);
      const res = await apiClient.get(`/quotations/${idToFetch}`);
      if (res.status === 200 && res.data) {
        const data = res.data;
        
        setFormData(prev => ({
          ...prev,
          customerId: data.customer?.id || '',
          shippingSameAsBilling: data.shippingSameAsBilling ?? true,
          discountConfiguration: {
            mode: data.discountConfiguration?.mode || 'FIXED',
            type: data.discountConfiguration?.type || 'PERCENTAGE',
            value: data.discountConfiguration?.value || 0,
          },
          taxConfiguration: {
            mode: data.taxConfiguration?.mode || 'FIXED',
            customTaxActive: data.taxConfiguration?.customTaxActive || false,
            label: data.taxConfiguration?.label || '',
            value: data.taxConfiguration?.value || 0,
          },
          notes: data.notes || '',
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          termsAndConditions: typeof data.termsAndConditions === 'object'
            ? (data.termsAndConditions?.text || data.termsAndConditions?.editedSnapshot || data.termsAndConditions?.defaultSnapshot || '')
            : (data.termsAndConditions || ''),
          quotationDate: id ? new Date(data.quotationDate) : new Date(),
          expiryDate: id ? new Date(data.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }));

        if (data.customer) {
          setCustomerSearch(data.customer.customerName || '');
          setSelectedCustomerDetails(data.customer);
        }

        if (data.billingAddress) {
          setBillingAddress({
            address: data.billingAddress.address || (typeof data.billingAddress === 'string' ? data.billingAddress : ''),
            city: data.billingAddress.city || '',
            state: data.billingAddress.state || '',
            pincode: data.billingAddress.pincode || '',
          });
        }
        if (data.shippingAddress && !data.shippingSameAsBilling) {
          setShippingAddress({
            address: data.shippingAddress.address || '',
            city: data.shippingAddress.city || '',
            state: data.shippingAddress.state || '',
            pincode: data.shippingAddress.pincode || '',
          });
        }

        if (data.items && data.items.length > 0) {
          const mappedItems = data.items.map((item: any) => ({
            id: item.id || Math.random().toString(),
            productId: item.productId || '',
            name: item.productSnapshot?.name || item.description || '',
            description: item.description || '',
            price: item.price || 0,
            originalPrice: item.productSnapshot?.price || item.price || 0,
            originalDescription: item.productSnapshot?.description || item.description || '',
            quantity: item.quantity || 1,
            discount: item.discount || { type: 'PERCENTAGE', value: 0 },
            tax: item.tax || 0,
            image: item.image || item.productSnapshot?.image || '',
            sku: item.productSnapshot?.skuNumber || '',
            hsnCode: item.productSnapshot?.hsnNumber || '',
          }));
          setItems(mappedItems);

          const searchRows: any = {};
          mappedItems.forEach((item: any) => {
            searchRows[item.id] = { query: item.name, results: [], show: false };
          });
          setProductSearchRows(searchRows);
        }

        if (data.totals) {
          setCalculatedTotals({
            subtotal: data.totals.subtotal || 0,
            discountAmount: data.totals.discountAmount || 0,
            taxAmount: data.totals.taxAmount || 0,
            grandTotal: data.totals.grandTotal || 0,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quotation details');
    } finally {
      setIsLoadingQuotation(false);
      initialLoadDone.current = true;
    }
  };

  // Preview API Trigger
  useEffect(() => {
    if (!selectedBranchId || !initialLoadDone.current) return;
    const handler = setTimeout(() => { fetchPreview(); }, 500);
    return () => clearTimeout(handler);
  }, [formData.discountConfiguration, formData.taxConfiguration, formData.shippingSameAsBilling, items, selectedBranchId, branchTaxConfig]);

  const fetchPreview = async () => {
    try {
      setIsCalculating(true);
      let effectiveTaxConfig = {
        mode: formData.taxConfiguration.mode,
        label: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.label : branchTaxConfig.label,
        value: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.value : branchTaxConfig.tax
      };

      const payload = {
        branchId: selectedBranchId,
        customerId: formData.customerId || 'preview-customer-id',
        quotationDate: formData.quotationDate.toISOString(),
        billingAddress: billingAddress,
        shippingAddress: formData.shippingSameAsBilling ? billingAddress : shippingAddress,
        shippingSameAsBilling: formData.shippingSameAsBilling,
        discountConfiguration: formData.discountConfiguration,
        taxConfiguration: effectiveTaxConfig,
        items: items.map(i => ({
          productId: i.productId || undefined, price: i.price, description: i.description || '', quantity: i.quantity, discount: i.discount, tax: i.tax
        }))
      };

      const res = await apiClient.post('/quotations/preview', payload);
      if (res.status === 200 && res.data) {
        setCalculatedTotals(res.data.summary);
        setCalculatedItems(res.data.items);
      }
    } catch (err) {
      console.error('Preview Calculation failed', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Customer Lookup
  const fetchCustomers = async (query: string = '') => {
    setIsSearchingCustomers(true);
    try {
      const res = await apiClient.get(`/quotations/customers/search?q=${query}&branchId=${selectedBranchId}`);
      if (res.status === 200) setCustomerResults(res.data);
    } catch (e) {
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  useEffect(() => {
    if (!selectedCustomerDetails || customerSearch !== selectedCustomerDetails.customerName) {
      const delayFn = setTimeout(() => {
        fetchCustomers(customerSearch);
      }, 300);
      return () => clearTimeout(delayFn);
    }
  }, [customerSearch, selectedBranchId]);

  const handleCustomerSelect = (customer: any) => {
    setFormData({ ...formData, customerId: customer.id });
    setCustomerSearch(customer.customerName);
    setSelectedCustomerDetails(customer);
    setBillingAddress({ address: customer.address || '', city: '', state: '', pincode: '' });
    setShowCustomerDropdown(false);
  };

  const handleProductSearch = async (query: string, rowId: string) => {
    setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], query, show: true } }));
    try {
      const res = await apiClient.get(`/quotations/products/search?q=${query}&branchId=${selectedBranchId}`);
      if (res.status === 200) {
        setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], results: res.data } }));
      }
    } catch (e) {}
  };

  const handleProductSelect = (product: any, rowId: string) => {
    setItems(items.map(i => i.id === rowId ? {
      ...i, productId: product.id, name: product.name, description: product.description, price: product.price,
      originalPrice: product.price, originalDescription: product.description, image: product.image || '',
      sku: product.skuNumber || product.sku || '', hsnCode: product.hsnNumber || product.hsnCode || ''
    } : i));
    setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], show: false, query: product.name } }));
    setActiveProductSearchIdx(null);
  };

  const updateItem = (itemId: string, field: string, value: any) => setItems(items.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  const addItem = () => setItems([...items, { id: Math.random().toString(), productId: '', name: '', description: '', price: 0, originalPrice: 0, originalDescription: '', quantity: 1, discount: { type: 'PERCENTAGE', value: 0 }, tax: 0, image: '', sku: '', hsnCode: '' }]);
  const removeItem = (itemId: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== itemId)); };

  const handleImagePick = async (itemId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      updateItem(itemId, 'image', `data:${result.assets[0].mimeType || 'image/jpeg'};base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!formData.customerId || items.length === 0 || !items[0].name) {
      Alert.alert('Required', 'Please select a customer and add at least one item.');
      return;
    }
    
    setIsSaving(true);
    try {
      let effectiveTaxConfig = {
        mode: formData.taxConfiguration.mode,
        label: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.label : branchTaxConfig.label,
        value: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.value : branchTaxConfig.tax
      };

      const payload = {
        branchId: selectedBranchId,
        customerId: formData.customerId,
        quotationDate: formData.quotationDate.toISOString(),
        expiryDate: formData.expiryDate.toISOString(),
        billingAddress,
        shippingAddress: formData.shippingSameAsBilling ? billingAddress : shippingAddress,
        shippingSameAsBilling: formData.shippingSameAsBilling,
        discountConfiguration: formData.discountConfiguration,
        taxConfiguration: effectiveTaxConfig,
        notes: formData.notes,
        followUpDate: formData.followUpDate ? formData.followUpDate.toISOString() : undefined,
        termsAndConditions: { text: formData.termsAndConditions },
        items: items.map(i => ({ 
          productId: i.productId || undefined, 
          price: i.price, 
          description: i.description, 
          quantity: i.quantity, 
          discount: i.discount, 
          tax: i.tax,
          image: i.image.startsWith('data:') ? i.image : undefined // Only send base64 if it's a new upload, otherwise it is handled separately or ignored.
        }))
      };

      const res = id 
        ? await apiClient.put(`/quotations/${id}`, payload)
        : await apiClient.post('/quotations', payload);

      if (res.status === 200 || res.status === 201) {
        Alert.alert(
          "Success",
          id ? "Quotation updated successfully!" : "Quotation created successfully!",
          [{ text: "OK", onPress: () => router.replace('/(app)/quotations') }]
        );
      } else {
        Alert.alert("Error", res.data?.message || `Failed to ${id ? 'update' : 'create'} quotation.`);
      }
    } catch (err: any) {
      console.error(`Error ${id ? 'updating' : 'creating'} quotation:`, err);
      const errMsg = err.response?.data?.message || err.message || "An unknown error occurred.";
      Alert.alert("Error", Array.isArray(errMsg) ? errMsg.join('\n') : errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const mode = showDatePicker.mode;
    setShowDatePicker({ show: false, mode });
    if (selectedDate) {
      if (mode === 'quotation') setFormData({ ...formData, quotationDate: selectedDate });
      if (mode === 'expiry') setFormData({ ...formData, expiryDate: selectedDate });
      if (mode === 'followup') setFormData({ ...formData, followUpDate: selectedDate });
    }
  };

  if (isLoadingQuotation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>Loading quotation details...</Text>
      </View>
    );
  }

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

      {/* Background Glow Blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowCircle1, { backgroundColor: colors.primary, opacity: isDark ? 0.08 : 0.05 }]} />
        <View style={[styles.glowCircle2, { backgroundColor: colors.tertiary, opacity: isDark ? 0.08 : 0.05 }]} />
      </View>

      {/* Header */}
      <AppHeader title={id ? "Edit Quotation" : "New Quotation"} showBackButton />

      {/* Main Canvas ScrollView */}
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingTop: 16, 
            paddingBottom: insets.bottom + 140 
          }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 1. Customer Details Section */}
        <GlassPanel style={[styles.sectionCard, { zIndex: 50 }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <User color={colors.primary} size={18} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Customer Details</Text>
            </View>
            <TouchableOpacity 
              style={styles.addNewBtn} 
              activeOpacity={0.7}
              onPress={() => router.push('/(app)/create-customer')}
            >
              <Plus color={colors.secondary} size={14} style={{ marginRight: 2 }} />
              <Text style={[styles.addNewText, { color: colors.secondary }]}>Add New</Text>
            </TouchableOpacity>
          </View>

          {/* Searchable Dropdown trigger */}
          <View style={styles.dropdownContainer}>
            <View style={[styles.dropdownTrigger, { backgroundColor: colors.background + '66', borderColor: colors.border }]}>
              <Search color={colors.textSecondary} size={16} style={styles.dropdownSearchIcon} />
              <TextInput
                value={customerSearch}
                onChangeText={(text) => {
                  setCustomerSearch(text);
                  setShowCustomerDropdown(true);
                  if (text === '') setSelectedCustomerDetails(null);
                }}
                onFocus={() => {
                  setShowCustomerDropdown(true);
                  if (customerResults.length === 0) fetchCustomers(customerSearch);
                }}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                style={[styles.dropdownTriggerInput, { color: colors.text }]}
                placeholder="Search Customer..."
                placeholderTextColor={colors.textSecondary + '80'}
              />
              {isSearchingCustomers ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <TouchableOpacity onPress={() => setShowCustomerDropdown(!showCustomerDropdown)}>
                  <ChevronDown color={colors.textSecondary} size={18} />
                </TouchableOpacity>
              )}
            </View>
            
            {showCustomerDropdown && (
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={[styles.dropdownList, { backgroundColor: colors.surfaceVariant, borderColor: colors.glassBorder }]}>
                {customerResults.length === 0 ? (
                  <Text style={{ padding: 16, color: colors.textSecondary, textAlign: 'center' }}>No customers found</Text>
                ) : (
                  customerResults.map((customer) => (
                    <TouchableOpacity 
                      key={customer.id} 
                      style={[styles.dropdownItem, { borderBottomColor: colors.border + '33' }]}
                      onPress={() => handleCustomerSelect(customer)}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                        {customer.companyName ? `${customer.companyName} (${customer.customerName})` : customer.customerName}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>

          {selectedCustomerDetails && (
            <View style={styles.readOnlyDetails}>
              <View style={styles.rowInputs}>
                <View style={[styles.readOnlyBlock, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.readOnlyText, { color: colors.text }]}>{selectedCustomerDetails.email || 'N/A'}</Text>
                </View>
                <View style={[styles.readOnlyBlock, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={[styles.readOnlyText, { color: colors.text }]}>{selectedCustomerDetails.mobileNumber || 'N/A'}</Text>
                </View>
              </View>
              
              <View style={styles.rowInputs}>
                <View style={[styles.readOnlyBlock, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Company Name</Text>
                  <Text style={[styles.readOnlyText, { color: colors.text }]}>{selectedCustomerDetails.companyName || 'N/A'}</Text>
                </View>
                <View style={[styles.readOnlyBlock, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{selectedCustomerDetails.businessLabel || 'Label'}</Text>
                  <Text style={[styles.readOnlyText, { color: colors.text }]}>{selectedCustomerDetails.businessLabelValue || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.readOnlyBlock}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Billing Address (Read Only)</Text>
                <Text style={[styles.readOnlyText, { color: colors.text }]}>{billingAddress.address || 'N/A'}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.checkboxRow} 
            activeOpacity={0.8}
            onPress={() => setFormData({ ...formData, shippingSameAsBilling: !formData.shippingSameAsBilling })}
          >
            <View style={[styles.checkbox, { borderColor: formData.shippingSameAsBilling ? colors.primary : colors.border, backgroundColor: formData.shippingSameAsBilling ? colors.primary + '1A' : 'transparent' }]}>
              {formData.shippingSameAsBilling && <View style={[styles.checkboxTick, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Shipping is same as billing</Text>
          </TouchableOpacity>

          {!formData.shippingSameAsBilling && (
            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Shipping Address</Text>
              <TextInput 
                value={shippingAddress.address}
                onChangeText={(val) => setShippingAddress({...shippingAddress, address: val})}
                multiline
                numberOfLines={2}
                style={[
                  styles.input, 
                  styles.textareaGlass,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }
                ]}
                placeholder="Shipping Address..."
                placeholderTextColor={colors.textSecondary + '60'}
              />
            </View>
          )}
        </GlassPanel>

        {/* 2. Discount & Tax Logic */}
        <GlassPanel style={styles.sectionCard}>
          <View style={[styles.sectionHeaderRow, { marginBottom: 16 }]}>
            <View style={styles.sectionTitleGroup}>
              <Tag color={colors.primary} size={18} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Discount & Tax Rules</Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'column', gap: 20 }}>
            {/* Discount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Discount Method</Text>
              <View style={styles.combinedInput}>
                <TouchableOpacity 
                  style={[styles.typeToggleBtn, { flex: 1, backgroundColor: formData.discountConfiguration.mode === "FIXED" ? colors.primary + '20' : colors.surfaceVariant, borderColor: colors.border }]}
                  onPress={() => setFormData({...formData, discountConfiguration: {...formData.discountConfiguration, mode: 'FIXED'}})}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.typeToggleText, { color: formData.discountConfiguration.mode === "FIXED" ? colors.primary : colors.textSecondary }]}>Fixed for all</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeToggleBtn, { flex: 1, backgroundColor: formData.discountConfiguration.mode === "PER_PRODUCT" ? colors.primary + '20' : colors.surfaceVariant, borderColor: colors.border }]}
                  onPress={() => setFormData({...formData, discountConfiguration: {...formData.discountConfiguration, mode: 'PER_PRODUCT'}})}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.typeToggleText, { color: formData.discountConfiguration.mode === "PER_PRODUCT" ? colors.primary : colors.textSecondary }]}>Per Item</Text>
                </TouchableOpacity>
              </View>
              {formData.discountConfiguration.mode === "FIXED" && (
                <View style={[styles.combinedInput, { marginTop: 12 }]}>
                  <TextInput 
                    value={String(formData.discountConfiguration.value)}
                    onChangeText={(val) => setFormData({...formData, discountConfiguration: {...formData.discountConfiguration, value: parseFloat(val) || 0}})}
                    keyboardType="numeric"
                    style={[styles.input, { flex: 1, color: colors.text, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0, borderColor: colors.border }]}
                  />
                  <TouchableOpacity 
                    style={[styles.typeToggleBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, paddingHorizontal: 16 }]}
                    onPress={() => setFormData({...formData, discountConfiguration: {...formData.discountConfiguration, type: formData.discountConfiguration.type === "AMOUNT" ? "PERCENTAGE" : "AMOUNT"}})}
                  >
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.typeToggleText, { color: colors.primary, fontSize: 16 }]}>{formData.discountConfiguration.type === "AMOUNT" ? "₹" : "%"}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Tax */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tax Method</Text>
              <View style={styles.combinedInput}>
                <TouchableOpacity 
                  style={[styles.typeToggleBtn, { flex: 1, backgroundColor: (formData.taxConfiguration.mode === "FIXED" && !formData.taxConfiguration.customTaxActive) ? colors.primary + '20' : colors.surfaceVariant, borderColor: colors.border }]}
                  onPress={() => setFormData({...formData, taxConfiguration: {...formData.taxConfiguration, mode: 'FIXED', customTaxActive: false}})}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.typeToggleText, { color: (formData.taxConfiguration.mode === "FIXED" && !formData.taxConfiguration.customTaxActive) ? colors.primary : colors.textSecondary }]}>Default</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeToggleBtn, { flex: 1, backgroundColor: (formData.taxConfiguration.mode === "FIXED" && formData.taxConfiguration.customTaxActive) ? colors.primary + '20' : colors.surfaceVariant, borderColor: colors.border }]}
                  onPress={() => setFormData({...formData, taxConfiguration: {...formData.taxConfiguration, mode: 'FIXED', customTaxActive: true}})}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.typeToggleText, { color: (formData.taxConfiguration.mode === "FIXED" && formData.taxConfiguration.customTaxActive) ? colors.primary : colors.textSecondary }]}>Custom</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeToggleBtn, { flex: 1, backgroundColor: formData.taxConfiguration.mode === "PER_PRODUCT" ? colors.primary + '20' : colors.surfaceVariant, borderColor: colors.border }]}
                  onPress={() => setFormData({...formData, taxConfiguration: {...formData.taxConfiguration, mode: 'PER_PRODUCT'}})}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.typeToggleText, { color: formData.taxConfiguration.mode === "PER_PRODUCT" ? colors.primary : colors.textSecondary }]}>Per Item</Text>
                </TouchableOpacity>
              </View>
              
              {formData.taxConfiguration.mode === "FIXED" && formData.taxConfiguration.customTaxActive && (
                <View style={[styles.combinedInput, { marginTop: 12, flexDirection: 'column', gap: 12, overflow: 'visible', borderRadius: 0 }]}>
                  <TextInput 
                    value={formData.taxConfiguration.label}
                    onChangeText={(val) => setFormData({...formData, taxConfiguration: {...formData.taxConfiguration, label: val}})}
                    placeholder="Custom Tax Name"
                    placeholderTextColor={colors.textSecondary + '80'}
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  />
                  <View style={[styles.combinedInput, { flex: undefined }]}>
                    <TextInput 
                      value={String(formData.taxConfiguration.value)}
                      onChangeText={(val) => setFormData({...formData, taxConfiguration: {...formData.taxConfiguration, value: parseFloat(val) || 0}})}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary + '80'}
                      style={[styles.input, { flex: 1, color: colors.text, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0, borderColor: colors.border }]}
                    />
                    <View style={[styles.typeToggleBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, paddingHorizontal: 16 }]}>
                      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.typeToggleText, { color: colors.primary }]}>%</Text>
                    </View>
                  </View>
                </View>
              )}
              {formData.taxConfiguration.mode === "FIXED" && !formData.taxConfiguration.customTaxActive && (
                <View style={[styles.combinedInput, { marginTop: 12 }]}>
                   {/* Normally a dropdown, in React Native simulating with a button to open modal or just static display since it selects default branch tax */}
                   <View style={[styles.input, { flex: 1, justifyContent: 'center', borderColor: colors.border, backgroundColor: colors.background + '50' }]}>
                      <Text style={{ color: colors.text }}>{branchTaxConfig.label} ({branchTaxConfig.tax}%)</Text>
                   </View>
                </View>
              )}
            </View>
          </View>
        </GlassPanel>

        {/* 3. Line Items Section */}
        <View style={[styles.lineItemsHeader, { marginBottom: 12 }]}>
          <View style={styles.sectionTitleGroup}>
            <FileText color={colors.primary} size={18} style={styles.sectionTitleIcon} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Quotation Items</Text>
          </View>
        </View>

        {items.map((item, idx) => {
          const calcItem = calculatedItems[idx];
          return (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surfaceVariant + 'B3', borderColor: colors.primary + '33', zIndex: activeProductSearchIdx === item.id ? 30 : 1 }]}>
            {/* Overlay card controls */}
            <View style={styles.itemCardControls}>
              <TouchableOpacity style={styles.cardActionIcon} onPress={() => removeItem(item.id)}>
                <Trash2 color={colors.error} size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.itemMainRow}>
              {/* Product Image */}
              <TouchableOpacity onPress={() => handleImagePick(item.id)} style={[styles.imageContainer, { borderColor: colors.border + '4D' }]}>
                {item.image && item.image !== 'null' && item.image !== 'undefined' ? (
                  <Image source={{ uri: item.image.startsWith('data:') ? item.image : getImageUrl(item.image) }} style={styles.productImage} />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
                     <Upload color={colors.textSecondary} size={20} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Product Selector / Input */}
              <View style={styles.itemDetailsContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Product Search</Text>
                <TextInput
                  value={productSearchRows[item.id]?.query ?? item.name}
                  onChangeText={(val) => handleProductSearch(val, item.id)}
                  onFocus={() => {
                    setActiveProductSearchIdx(item.id);
                    if (!productSearchRows[item.id]?.results?.length) {
                      handleProductSearch(productSearchRows[item.id]?.query ?? item.name, item.id);
                    } else {
                      setProductSearchRows(prev => ({ ...prev, [item.id]: { ...prev[item.id], show: true } }));
                    }
                  }}
                  onBlur={() => setTimeout(() => setActiveProductSearchIdx(null), 200)}
                  style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, height: 40 }]}
                  placeholder="Type to search..."
                  placeholderTextColor={colors.textSecondary + '80'}
                />

                {/* Product Search Dropdown */}
                {activeProductSearchIdx === item.id && productSearchRows[item.id]?.show && (
                  <View style={[styles.productSearchDropdown, { backgroundColor: colors.surfaceVariant, borderColor: colors.glassBorder, elevation: 10 }]}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>
                      {!(productSearchRows[item.id]?.results?.length > 0) ? (
                        <Text style={{ padding: 16, color: colors.textSecondary, textAlign: 'center' }}>No products found</Text>
                      ) : (
                        (productSearchRows[item.id]?.results || []).map((product) => (
                          <TouchableOpacity
                            key={product.id}
                            style={[styles.dropdownItem, { borderBottomColor: colors.border + '33' }]}
                            onPress={() => {
                              handleProductSelect(product, item.id);
                              setProductSearchRows(prev => ({ ...prev, [item.id]: { ...prev[item.id], show: false } }));
                              setActiveProductSearchIdx(null);
                            }}
                          >
                            <Text style={[styles.productSearchItemText, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
                            <Text style={{ fontSize: 12, color: colors.primary }}>₹{product.price}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
                
                {/* SKU / HSN Badges */}
                {(item.sku || item.hsnCode) ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, paddingHorizontal: 4 }}>
                    {item.sku ? <Text style={{ fontSize: 11, color: colors.textSecondary }}>SKU: {item.sku}</Text> : null}
                    {item.hsnCode ? <Text style={{ fontSize: 11, color: colors.textSecondary }}>HSN: {item.hsnCode}</Text> : null}
                  </View>
                ) : null}

                <TextInput
                  value={item.description}
                  onChangeText={(val) => updateItem(item.id, 'description', val)}
                  style={[styles.inputGlass, { color: colors.textSecondary, borderColor: colors.border, height: 60, textAlignVertical: 'top', paddingTop: 8, marginTop: 8 }]}
                  placeholder="Description..."
                  placeholderTextColor={colors.textSecondary + '60'}
                  multiline
                />
              </View>
            </View>

            {/* Calculations Row */}
            <View style={styles.itemCalcRow}>
              <View style={styles.calcInputBlock}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Price (₹)</Text>
                <TextInput
                  value={String(item.price)}
                  onChangeText={(val) => updateItem(item.id, 'price', parseFloat(val) || 0)}
                  keyboardType="numeric"
                  style={[styles.calcInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                />
              </View>

              <View style={styles.calcInputBlock}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Qty</Text>
                <View style={[styles.qtyCounterContainer, { borderColor: colors.primary + '33', backgroundColor: colors.background + '50' }]}>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                  >
                    <Text style={[styles.qtyBtnText, { color: colors.textSecondary }]}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    value={String(item.quantity)}
                    onChangeText={(val) => updateItem(item.id, 'quantity', parseInt(val) || 1)}
                    keyboardType="numeric"
                    style={[styles.qtyInput, { color: colors.text }]}
                  />
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                  >
                    <Text style={[styles.qtyBtnText, { color: colors.textSecondary }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.calcTotalBlock}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.calcTotalText, { color: colors.primary }]}>
                  ₹{calcItem ? calcItem.total?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {(formData.discountConfiguration.mode === "PER_PRODUCT" || formData.taxConfiguration.mode === "PER_PRODUCT") && (
              <View style={[styles.itemCalcRow, { marginTop: 12, borderTopWidth: 0, paddingTop: 0 }]}>
                {formData.discountConfiguration.mode === "PER_PRODUCT" && (
                  <View style={[styles.calcInputBlock, { flex: 2, marginRight: 8 }]}>
                    <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Discount</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        value={String(item.discount.value)}
                        onChangeText={(val) => updateItem(item.id, 'discount', { ...item.discount, value: parseFloat(val) || 0 })}
                        keyboardType="numeric"
                        style={[styles.calcInput, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50', borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
                      />
                      <TouchableOpacity 
                        style={[styles.typeToggleBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, height: 44, paddingHorizontal: 12, justifyContent: 'center' }]}
                        onPress={() => updateItem(item.id, 'discount', { ...item.discount, type: item.discount.type === "AMOUNT" ? "PERCENTAGE" : "AMOUNT" })}
                      >
                        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.typeToggleText, { color: colors.primary }]}>{item.discount.type === "AMOUNT" ? "₹" : "%"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {formData.taxConfiguration.mode === "PER_PRODUCT" && (
                  <View style={[styles.calcInputBlock, { flex: 1 }]}>
                    <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Tax (%)</Text>
                    <TextInput
                      value={String(item.tax)}
                      onChangeText={(val) => updateItem(item.id, 'tax', parseFloat(val) || 0)}
                      keyboardType="numeric"
                      style={[styles.calcInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        )})}

        <TouchableOpacity 
          style={[styles.addItemBtn, { backgroundColor: colors.surfaceVariant + '4D', borderColor: colors.primary + '66' }]}
          activeOpacity={0.7}
          onPress={addItem}
        >
          <Plus color={colors.primary} size={16} />
          <Text style={[styles.addItemBtnText, { color: colors.primary }]}>Add Another Item</Text>
        </TouchableOpacity>

        {/* 4. Summary */}
        <GlassPanel style={styles.sectionCard}>
          <View style={[styles.sectionHeaderRow, { marginBottom: 16 }]}>
            <View style={styles.sectionTitleGroup}>
              <Calculator color={colors.primary} size={18} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Summary</Text>
            </View>
            {isCalculating && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{calculatedTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              -₹{calculatedTotals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tax Amount</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{calculatedTotals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: colors.border + '4D' }]} />

          <View style={[styles.summaryRow, { alignItems: 'flex-end', paddingTop: 4 }]}>
            <Text style={[styles.grandLabel, { color: colors.text }]}>Grand Total</Text>
            <Text style={[styles.grandValue, { color: colors.primary }]}>
              ₹{calculatedTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </GlassPanel>

        {/* 5. Dates Section */}
        <GlassPanel style={styles.sectionCard}>
          <View style={[styles.sectionHeaderRow, { marginBottom: 16 }]}>
            <View style={styles.sectionTitleGroup}>
              <CalendarIcon color={colors.primary} size={18} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Timeline</Text>
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
              <TouchableOpacity style={styles.iconInputWrapper} onPress={() => setShowDatePicker({show: true, mode: 'quotation'})}>
                <CalendarIcon color={colors.textSecondary} size={16} style={styles.inputLeftIcon} />
                <View style={[styles.inputGlass, styles.inputGlassIcon, { justifyContent: 'center', borderColor: colors.border, backgroundColor: colors.background + '50' }]}>
                  <Text style={{ color: colors.text }}>{formData.quotationDate.toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Valid Until</Text>
              <TouchableOpacity style={styles.iconInputWrapper} onPress={() => setShowDatePicker({show: true, mode: 'expiry'})}>
                <CalendarIcon color={colors.textSecondary} size={16} style={styles.inputLeftIcon} />
                <View style={[styles.inputGlass, styles.inputGlassIcon, { justifyContent: 'center', borderColor: colors.border, backgroundColor: colors.background + '50' }]}>
                  <Text style={{ color: colors.text }}>{formData.expiryDate.toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </GlassPanel>

        {/* 6. Notes & Follow Up Card */}
        <GlassPanel style={styles.sectionCard}>
          <View style={[styles.sectionHeaderRow, { marginBottom: 16 }]}>
            <View style={styles.sectionTitleGroup}>
              <FileText color={colors.primary} size={18} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notes & Terms</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Follow Up Date</Text>
            <TouchableOpacity style={styles.iconInputWrapper} onPress={() => setShowDatePicker({show: true, mode: 'followup'})}>
              <CalendarIcon color={colors.textSecondary} size={16} style={styles.inputLeftIcon} />
              <View style={[styles.inputGlass, styles.inputGlassIcon, { justifyContent: 'center', borderColor: colors.border, backgroundColor: colors.background + '50' }]}>
                <Text style={{ color: colors.text }}>{formData.followUpDate.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Notes</Text>
            <TextInput 
              value={formData.notes}
              onChangeText={(text) => setFormData({...formData, notes: text})}
              multiline
              numberOfLines={2}
              style={[
                styles.inputGlass, 
                styles.textareaGlass, 
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }
              ]}
              placeholder="Optional notes for the client..."
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Terms & Conditions</Text>
            <TextInput 
              value={formData.termsAndConditions}
              onChangeText={(text) => setFormData({...formData, termsAndConditions: text})}
              multiline
              numberOfLines={3}
              style={[
                styles.inputGlass, 
                styles.textareaGlass, 
                { color: colors.textSecondary, borderColor: colors.border, backgroundColor: colors.background + '50', height: 100 }
              ]}
            />
          </View>
        </GlassPanel>

        <View style={styles.createBtnContainer}>
          <TouchableOpacity 
            style={[styles.createBtn, { shadowColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={isDark ? ['#7dd3fc', '#0284c7'] : [colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createBtnGradient}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={isDark ? '#001f2e' : '#ffffff'} />
              ) : (
                <>
                  <Send color={isDark ? '#001f2e' : '#ffffff'} size={18} style={{ marginRight: 8 }} />
                  <Text style={[styles.createBtnText, { color: isDark ? '#001f2e' : '#ffffff' }]}>{id ? 'Update Quotation' : 'Create Quotation'}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {showDatePicker.show && (
        <DateTimePicker
          value={
            showDatePicker.mode === 'quotation' ? formData.quotationDate :
            showDatePicker.mode === 'expiry' ? formData.expiryDate : formData.followUpDate
          }
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  combinedInput: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 12,
    overflow: 'hidden',
  },
  typeToggleBtn: {
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  container: {
    flex: 1,
  },
  glowCircle1: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    overflow: 'hidden',
    filter: 'blur(60px)',
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    overflow: 'hidden',
    filter: 'blur(60px)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  addNewText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 40,
    marginBottom: 16,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  dropdownSearchIcon: {
    marginRight: 8,
  },
  dropdownTriggerInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 45,
    elevation: 10,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  readOnlyDetails: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  readOnlyBlock: {
    marginBottom: 4,
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  inputGroup: {
    flexDirection: 'column',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputGlass: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textareaGlass: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxTick: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  lineItemsHeader: {
    marginTop: 12,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
    gap: 12,
  },
  itemCardControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  cardActionIcon: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  itemMainRow: {
    flexDirection: 'row',
    gap: 14,
    paddingRight: 40,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetailsContainer: {
    flex: 1,
    position: 'relative',
  },
  productSearchDropdown: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 150,
    overflow: 'hidden',
    zIndex: 50,
    elevation: 10,
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
  },
  productSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  productSearchItemText: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  productSearchItemPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 234, 255, 0.08)',
    paddingTop: 12,
  },
  calcInputBlock: {
    flex: 1,
    marginRight: 12,
  },
  calcTotalBlock: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  calcLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  calcInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    textAlign: 'center',
    fontSize: 15,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  qtyCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 32,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  qtyInput: {
    flex: 1,
    height: '100%',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  calcTotalText: {
    fontSize: 16,
    fontWeight: '600',
    height: 44,
    textAlignVertical: 'center',
    paddingTop: 6,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  addItemBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 8,
  },
  grandLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  grandValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  iconInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputLeftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 5,
  },
  inputGlassIcon: {
    paddingLeft: 38,
  },
  createBtnContainer: {
    marginTop: 24,
    marginBottom: 16,
    width: '100%',
  },
  createBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
