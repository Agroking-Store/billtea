import React, { useState, useMemo, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  MoreVertical, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Calendar, 
  Send,
  ChevronDown
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useBranch } from "../../components/BranchProvider";
import { apiClient } from '@/api/client';

const { width } = Dimensions.get('window');

interface LineItem {
  id: string;
  productName: string;
  description: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  productId?: string;
}

export default function CreateQuotationScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, copyFromId } = useLocalSearchParams<{ id?: string; copyFromId?: string }>();
  const targetQuotationId = id || copyFromId;

  // --- STATE DEFINITIONS ---
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  
  // Backend Active State
  const { selectedBranchId } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Section 1: Customer Details & Search
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  
  const [contactName, setContactName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingIsDifferent, setShippingIsDifferent] = useState(false);

  // Section 2: Discount & Tax Logic
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [discountValue, setDiscountValue] = useState("0.00");
  const [taxLogic, setTaxLogic] = useState<"FIXED_SLAB" | "PER_PRODUCT">("PER_PRODUCT");
  const [taxPercentage, setTaxPercentage] = useState("8"); // Default 8%

  // Section 3: Line Items (Dynamic List)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "item-1",
      productName: "",
      description: "",
      unitPrice: 0,
      quantity: 1,
    }
  ]);

  // Product Search Suggestions State
  const [productList, setProductList] = useState<any[]>([]);
  const [activeProductSearchIdx, setActiveProductSearchIdx] = useState<number | null>(null);

  // Section 5: Timeline & Terms
  const formatDateString = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const [quotationDate, setQuotationDate] = useState(formatDateString(new Date()));
  
  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 30); // 30 days default
  const [validUntil, setValidUntil] = useState(formatDateString(defaultExpiry));
  
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment is due within 30 days. Standard warranty applies to all hardware items.");


  // Fetch Quotation details for Edit Mode or Copy Mode
  useEffect(() => {
    if (!targetQuotationId) return;

    async function fetchQuotation() {
      setIsLoadingQuotation(true);
      try {
        const res = await apiClient.get(`/quotations/${targetQuotationId}`);
        if (res.status === 200 && res.data) {
          const q = res.data;
          
          // Note: When editing, the original branch is saved on the quotation itself.
          // The API will reject if we edit a quotation that belongs to another branch,
          // but we still pass the currently selected Branch.

          // Prefill customer details
          if (q.customer) {
            setSelectedCustomerId(q.customer.id || '');
            setSelectedClient(q.customer.companyName || q.customer.customerName || '');
            setContactName(q.customer.customerName || '');
            setMobile(q.customer.mobileNumber || '');
            setEmail(q.customer.email || '');
          }

          // Prefill address
          if (q.billingAddress) {
            setBillingAddress(q.billingAddress.street || q.billingAddress.address || (typeof q.billingAddress === 'string' ? q.billingAddress : ''));
          }
          setShippingIsDifferent(!q.shippingSameAsBilling);

          // Prefill configuration (discounts and taxes)
          if (q.discountConfiguration) {
            setDiscountType(q.discountConfiguration.type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED');
            setDiscountValue(String(q.discountConfiguration.value ?? 0));
          }
          if (q.taxConfiguration) {
            setTaxLogic(q.taxConfiguration.mode === 'FIXED' ? 'FIXED_SLAB' : 'PER_PRODUCT');
            setTaxPercentage(String(q.taxConfiguration.value ?? 8));
          }

          // Prefill items
          if (Array.isArray(q.items)) {
            const mappedItems = q.items.map((item: any) => ({
              id: item.id || `item-${Math.random()}`,
              productId: item.productId || undefined,
              productName: item.productSnapshot?.name || item.description || '',
              description: item.description || '',
              unitPrice: item.price || 0,
              quantity: item.quantity || 1,
              image: item.image || undefined,
            }));
            setLineItems(mappedItems);
          }

          // Prefill dates only when editing (id is present).
          // When copying, keep quotationDate as TODAY and validUntil as +30 days.
          if (id) {
            if (q.quotationDate) {
              setQuotationDate(formatDateString(new Date(q.quotationDate)));
            }
            if (q.expiryDate) {
              setValidUntil(formatDateString(new Date(q.expiryDate)));
            }
          }

          // Prefill notes & terms
          setNotes(q.notes || '');
          if (q.termsAndConditions) {
            setTerms(q.termsAndConditions.editedSnapshot || q.termsAndConditions.defaultSnapshot || q.termsAndConditions || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch quotation details:', err);
        Alert.alert('Error', 'Could not load quotation details.');
      } finally {
        setIsLoadingQuotation(false);
      }
    }

    fetchQuotation();
  }, [targetQuotationId]);

  // --- SEARCH HANDLERS ---
  
  const handleCustomerSearch = async (text: string) => {
    setSelectedClient(text);
    setIsSearchingCustomers(true);
    try {
      const res = await apiClient.get(`/quotations/customers/search?q=${encodeURIComponent(text)}`, { params: { branchId: selectedBranchId } });
      if (res.status === 200 && Array.isArray(res.data)) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const handleSelectCustomer = (customer: any) => {
    setSelectedClient(customer.companyName || customer.customerName);
    setSelectedCustomerId(customer.id);
    setContactName(customer.customerName || "");
    setMobile(customer.mobileNumber || "");
    setEmail(customer.email || "");
    
    // Address handling
    const addr = customer.address;
    if (addr) {
      if (typeof addr === 'object') {
        setBillingAddress(addr.street || addr.address || JSON.stringify(addr));
      } else {
        setBillingAddress(addr);
      }
    } else {
      setBillingAddress("");
    }
    
    setShowClientDropdown(false);
  };

  const handleProductSearch = async (text: string, index: number) => {
    handleItemChange(lineItems[index].id, 'productName', text);
    setActiveProductSearchIdx(index);
    
    try {
      const res = await apiClient.get(`/quotations/products/search?q=${encodeURIComponent(text)}`, { params: { branchId: selectedBranchId } });
      if (res.status === 200 && Array.isArray(res.data)) {
        setProductList(res.data);
      }
    } catch (err) {
      console.error('Error searching products:', err);
    }
  };

  const handleSelectProduct = (product: any, index: number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      productId: product.id,
      productName: product.name,
      description: product.description || "",
      unitPrice: product.price || 0,
      image: product.image || undefined,
    };
    setLineItems(updatedItems);
    setActiveProductSearchIdx(null);
  };

  // --- FORM HANDLERS ---
  
  const handleAddNewCustomer = () => {
    setContactName("");
    setMobile("");
    setEmail("");
    setBillingAddress("");
    setSelectedClient("");
    setSelectedCustomerId("");
    Alert.alert("New Customer", "Please enter details for the new customer.");
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      productName: "",
      description: "",
      unitPrice: 0,
      quantity: 1,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    if (lineItems.length === 1) {
      Alert.alert("Warning", "A quotation must have at least one line item.");
      return;
    }
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleDuplicateItem = (id: string) => {
    const itemToDuplicate = lineItems.find(item => item.id === id);
    if (itemToDuplicate) {
      const duplicatedItem: LineItem = {
        ...itemToDuplicate,
        id: `item-${Date.now()}`,
      };
      const index = lineItems.findIndex(item => item.id === id);
      const updated = [...lineItems];
      updated.splice(index + 1, 0, duplicatedItem);
      setLineItems(updated);
    }
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        let parsedVal = value;
        if (field === 'unitPrice' || field === 'quantity') {
          parsedVal = value === '' ? 0 : parseFloat(value);
          if (isNaN(parsedVal)) parsedVal = 0;
        }
        return { ...item, [field]: parsedVal };
      }
      return item;
    }));
  };

  // --- CALCULATION LOGIC ---
  
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [lineItems]);

  const discountAmount = useMemo(() => {
    const value = parseFloat(discountValue) || 0;
    if (discountType === "FIXED") {
      return Math.min(value, subtotal);
    } else {
      return subtotal * (value / 100);
    }
  }, [subtotal, discountType, discountValue]);

  const taxAmount = useMemo(() => {
    const percentage = parseFloat(taxPercentage) || 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    
    if (taxLogic === "PER_PRODUCT") {
      return taxableAmount * (percentage / 100);
    } else {
      return 192.00; // Fixed slab default representation
    }
  }, [subtotal, discountAmount, taxLogic, taxPercentage]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  const parseDateString = (str: string) => {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch (e) {}
    return new Date().toISOString();
  };

  const handleCreateQuotation = async () => {
    if (!selectedCustomerId) {
      Alert.alert("Required", "Please search and select a customer first.");
      return;
    }
    if (!selectedBranchId) {
      Alert.alert("Required", "No active branch found. Please verify your settings.");
      return;
    }
    if (lineItems.length === 0 || !lineItems[0].productName) {
      Alert.alert("Required", "Quotation must have at least one valid product.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        branchId: selectedBranchId,
        customerId: selectedCustomerId,
        quotationDate: parseDateString(quotationDate),
        expiryDate: parseDateString(validUntil),
        billingAddress: { street: billingAddress },
        shippingAddress: { street: billingAddress },
        shippingSameAsBilling: !shippingIsDifferent,
        discountConfiguration: {
          mode: discountType === "FIXED" ? "FIXED" : "PER_PRODUCT",
          type: discountType === "FIXED" ? "AMOUNT" : "PERCENTAGE",
          value: parseFloat(discountValue) || 0
        },
        taxConfiguration: {
          mode: taxLogic === "FIXED_SLAB" ? "FIXED" : "PER_PRODUCT",
          value: parseFloat(taxPercentage) || 0,
          label: "GST"
        },
        notes: notes,
        termsAndConditions: terms,
        items: lineItems.map(item => ({
          productId: item.productId || undefined,
          price: item.unitPrice,
          description: item.description,
          image: item.image,
          quantity: item.quantity
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
      setIsSubmitting(false);
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
        <View style={[styles.glowCircle1, { backgroundColor: colors.primary, opacity: isDark ? 0.08 : 0.03 }]} />
        <View style={[styles.glowCircle2, { backgroundColor: colors.tertiary, opacity: isDark ? 0.08 : 0.03 }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.glassBorder }]}>
        <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBackground }]} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.headerBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}
            activeOpacity={0.7}
          >
            <ArrowLeft color={colors.primary} size={18} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>{id ? 'Edit Quotation' : 'New Quotation'}</Text>
          <TouchableOpacity 
            style={[styles.headerBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}
            activeOpacity={0.7}
            onPress={() => Alert.alert("Actions", "Extra settings menu placeholder.")}
          >
            <MoreVertical color={colors.primary} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Canvas ScrollView */}
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingTop: insets.top + 72, 
            paddingBottom: insets.bottom + 140 
          }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 1. Customer Details Section */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Customer Details</Text>
            <TouchableOpacity 
              style={styles.addNewBtn} 
              activeOpacity={0.7}
              onPress={handleAddNewCustomer}
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
                value={selectedClient}
                onChangeText={(text) => {
                  handleCustomerSearch(text);
                  setShowClientDropdown(true);
                }}
                onFocus={() => {
                  setShowClientDropdown(true);
                  if (customers.length === 0) {
                    handleCustomerSearch("");
                  }
                }}
                style={[styles.dropdownTriggerInput, { color: colors.text }]}
                placeholder="Search Customer..."
                placeholderTextColor={colors.textSecondary + '80'}
              />
              {isSearchingCustomers ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <TouchableOpacity onPress={() => setShowClientDropdown(!showClientDropdown)}>
                  <ChevronDown color={colors.textSecondary} size={18} />
                </TouchableOpacity>
              )}
            </View>
            
            {showClientDropdown && customers.length > 0 && (
              <View style={[styles.dropdownList, { backgroundColor: colors.surfaceVariant, borderColor: colors.glassBorder }]}>
                {customers.map((customer) => (
                  <TouchableOpacity 
                    key={customer.id} 
                    style={[styles.dropdownItem, { borderBottomColor: colors.border + '33' }]}
                    onPress={() => handleSelectCustomer(customer)}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                      {customer.companyName ? `${customer.companyName} (${customer.customerName})` : customer.customerName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Contact Name</Text>
              <TextInput 
                value={contactName}
                onChangeText={setContactName}
                style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                placeholder="Elena Rostova"
                placeholderTextColor={colors.textSecondary + '60'}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mobile</Text>
                <TextInput 
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  placeholder="+1 555-0198"
                  placeholderTextColor={colors.textSecondary + '60'}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
                <TextInput 
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  placeholder="elena@aurora.com"
                  placeholderTextColor={colors.textSecondary + '60'}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Billing Address</Text>
              <TextInput 
                value={billingAddress}
                onChangeText={setBillingAddress}
                multiline
                numberOfLines={2}
                style={[
                  styles.inputGlass, 
                  styles.textareaGlass, 
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }
                ]}
                placeholder="Billing Address..."
                placeholderTextColor={colors.textSecondary + '60'}
              />
            </View>

            {/* Checkbox Shipping */}
            <TouchableOpacity 
              style={styles.checkboxRow} 
              activeOpacity={0.8}
              onPress={() => setShippingIsDifferent(!shippingIsDifferent)}
            >
              <View style={[styles.checkbox, { borderColor: shippingIsDifferent ? colors.primary : colors.border, backgroundColor: shippingIsDifferent ? colors.primary + '1A' : 'transparent' }]}>
                {shippingIsDifferent && <View style={[styles.checkboxTick, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>Shipping is Different</Text>
            </TouchableOpacity>
          </View>
        </GlassPanel>

        {/* 2. Discount & Tax Logic */}
        <GlassPanel style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 12 }]}>Discount & Tax Setup</Text>
          
          <View style={styles.radioSetupContainer}>
            {/* Discount Type Radio */}
            <View style={styles.radioBlock}>
              <Text style={[styles.radioBlockTitle, { color: colors.textSecondary }]}>Discount Type</Text>
              <TouchableOpacity 
                style={styles.radioRow} 
                activeOpacity={0.8}
                onPress={() => setDiscountType("FIXED")}
              >
                <View style={[styles.radioOuter, { borderColor: discountType === 'FIXED' ? colors.primary : colors.border }]}>
                  {discountType === 'FIXED' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
                <Text style={[styles.radioLabel, { color: colors.text }]}>Fixed Amount</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.radioRow} 
                activeOpacity={0.8}
                onPress={() => setDiscountType("PERCENTAGE")}
              >
                <View style={[styles.radioOuter, { borderColor: discountType === 'PERCENTAGE' ? colors.primary : colors.border }]}>
                  {discountType === 'PERCENTAGE' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
                <Text style={[styles.radioLabel, { color: colors.text }]}>Percentage (%)</Text>
              </TouchableOpacity>
            </View>

            {/* Tax Logic Radio */}
            <View style={styles.radioBlock}>
              <Text style={[styles.radioBlockTitle, { color: colors.textSecondary }]}>Tax Logic</Text>
              <TouchableOpacity 
                style={styles.radioRow} 
                activeOpacity={0.8}
                onPress={() => setTaxLogic("FIXED_SLAB")}
              >
                <View style={[styles.radioOuter, { borderColor: taxLogic === 'FIXED_SLAB' ? colors.primary : colors.border }]}>
                  {taxLogic === 'FIXED_SLAB' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
                <Text style={[styles.radioLabel, { color: colors.text }]}>Fixed Slab</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.radioRow} 
                activeOpacity={0.8}
                onPress={() => setTaxLogic("PER_PRODUCT")}
              >
                <View style={[styles.radioOuter, { borderColor: taxLogic === 'PER_PRODUCT' ? colors.primary : colors.border }]}>
                  {taxLogic === 'PER_PRODUCT' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
                <Text style={[styles.radioLabel, { color: colors.text }]}>Per Product</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Discount & Tax input values */}
          <View style={[styles.rowInputs, { marginTop: 12 }]}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Discount Value ({discountType === 'FIXED' ? '$' : '%'})</Text>
              <TextInput 
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
                style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tax Percentage (%)</Text>
              <TextInput 
                value={taxPercentage}
                onChangeText={setTaxPercentage}
                keyboardType="numeric"
                style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
              />
            </View>
          </View>
        </GlassPanel>

        {/* 3. Line Items Section */}
        <View style={styles.lineItemsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary, paddingLeft: 4 }]}>Line Items</Text>
        </View>

        {lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surfaceVariant + 'B3', borderColor: colors.primary + '33', zIndex: activeProductSearchIdx === idx ? 30 : 1 }]}>
            {/* Overlay card controls */}
            <View style={styles.itemCardControls}>
              <TouchableOpacity 
                style={styles.cardActionIcon}
                onPress={() => handleDuplicateItem(item.id)}
              >
                <Copy color={colors.textSecondary} size={16} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cardActionIcon}
                onPress={() => handleDeleteItem(item.id)}
              >
                <Trash2 color={colors.error} size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.itemMainRow}>
              {/* Product Image */}
              <View style={[styles.imageContainer, { borderColor: colors.border + '4D' }]}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]} />
                )}
              </View>

              {/* Product Selector / Input */}
              <View style={styles.itemDetailsContainer}>
                <TextInput
                  value={item.productName}
                  onChangeText={(val) => handleProductSearch(val, idx)}
                  onFocus={() => {
                    setActiveProductSearchIdx(idx);
                    handleProductSearch(item.productName, idx);
                  }}
                  style={[styles.itemProductInput, { color: colors.text, borderBottomColor: colors.border + '80' }]}
                  placeholder="Product Name..."
                  placeholderTextColor={colors.textSecondary + '80'}
                />

                {/* Product search suggestions */}
                {activeProductSearchIdx === idx && productList.length > 0 && (
                  <View style={[styles.productSearchDropdown, { backgroundColor: colors.surfaceVariant, borderColor: colors.glassBorder }]}>
                    {productList.map((product) => (
                      <TouchableOpacity 
                        key={product.id} 
                        style={[styles.productSearchItem, { borderBottomColor: colors.border + '33' }]}
                        onPress={() => handleSelectProduct(product, idx)}
                      >
                        <Text style={[styles.productSearchItemText, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
                        <Text style={[styles.productSearchItemPrice, { color: colors.primary }]}>${product.price}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <TextInput
                  value={item.description}
                  onChangeText={(val) => handleItemChange(item.id, 'description', val)}
                  style={[styles.itemDescInput, { color: colors.textSecondary }]}
                  placeholder="Description..."
                  placeholderTextColor={colors.textSecondary + '60'}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Calculations Row */}
            <View style={styles.itemCalcRow}>
              <View style={styles.calcInputBlock}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Unit Price ($)</Text>
                <TextInput
                  value={item.unitPrice === 0 ? "" : String(item.unitPrice)}
                  onChangeText={(val) => handleItemChange(item.id, 'unitPrice', val)}
                  keyboardType="numeric"
                  style={[styles.calcInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary + '60'}
                />
              </View>

              <View style={styles.calcInputBlock}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Qty</Text>
                <TextInput
                  value={String(item.quantity)}
                  onChangeText={(val) => handleItemChange(item.id, 'quantity', val)}
                  keyboardType="numeric"
                  style={[styles.calcInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                />
              </View>

              <View style={styles.calcTotalBlock}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.calcTotalText, { color: colors.primary }]}>
                  ${(item.unitPrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Add Another Item Button */}
        <TouchableOpacity 
          style={[styles.addItemBtn, { backgroundColor: colors.surfaceVariant + '4D', borderColor: colors.primary + '66' }]}
          activeOpacity={0.7}
          onPress={handleAddItem}
        >
          <Plus color={colors.primary} size={16} />
          <Text style={[styles.addItemBtnText, { color: colors.primary }]}>Add Another Item</Text>
        </TouchableOpacity>

        {/* 4. Summary */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              -${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tax ({taxLogic === 'PER_PRODUCT' ? `${taxPercentage}%` : 'Slab'})</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: colors.border + '4D' }]} />

          <View style={[styles.summaryRow, { alignItems: 'flex-end', paddingTop: 4 }]}>
            <Text style={[styles.grandLabel, { color: colors.text }]}>Grand Total</Text>
            <Text style={[styles.grandValue, { color: colors.primary }]}>
              ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </GlassPanel>

        {/* 5. Timeline & Terms */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
              <View style={styles.iconInputWrapper}>
                <Calendar color={colors.textSecondary} size={16} style={styles.inputLeftIcon} />
                <TextInput 
                  value={quotationDate}
                  onChangeText={setQuotationDate}
                  style={[styles.inputGlass, styles.inputGlassIcon, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Valid Until</Text>
              <View style={styles.iconInputWrapper}>
                <Calendar color={colors.textSecondary} size={16} style={styles.inputLeftIcon} />
                <TextInput 
                  value={validUntil}
                  onChangeText={setValidUntil}
                  style={[styles.inputGlass, styles.inputGlassIcon, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Notes</Text>
            <TextInput 
              value={notes}
              onChangeText={setNotes}
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
              value={terms}
              onChangeText={setTerms}
              multiline
              numberOfLines={3}
              style={[
                styles.inputGlass, 
                styles.textareaGlass, 
                { color: colors.textSecondary, borderColor: colors.border, backgroundColor: colors.background + '50' }
              ]}
            />
          </View>
        </GlassPanel>

        {/* Bottom Action Button (Placed inside ScrollView to clear tab bar) */}
        <View style={styles.createBtnContainer}>
          <TouchableOpacity 
            style={[styles.createBtn, { shadowColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={handleCreateQuotation}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isDark ? ['#7dd3fc', '#0284c7'] : [colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createBtnGradient}
            >
              {isSubmitting ? (
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
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
    borderRadius: 10,
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
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 45,
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
  formContainer: {
    gap: 14,
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
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textareaGlass: {
    height: 64,
    paddingTop: 10,
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
  radioSetupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  radioBlock: {
    flex: 1,
    flexDirection: 'column',
    gap: 10,
  },
  radioBlockTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
  },
  lineItemsHeader: {
    marginTop: 8,
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
    paddingRight: 60,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  itemDetailsContainer: {
    flex: 1,
    gap: 6,
    position: 'relative',
  },
  itemProductInput: {
    fontSize: 15,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingBottom: 4,
    paddingTop: 0,
  },
  productSearchDropdown: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 150,
    overflow: 'hidden',
    zIndex: 50,
    position: 'absolute',
    top: 32,
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
  itemDescInput: {
    fontSize: 12,
    textAlignVertical: 'top',
    padding: 0,
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
    width: width * 0.22,
  },
  calcLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  calcInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 36,
    textAlign: 'center',
    fontSize: 13,
    padding: 0,
  },
  calcTotalBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  calcTotalText: {
    fontSize: 15,
    fontWeight: '600',
    height: 36,
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
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
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
