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
  ChevronDown,
  User as UserIcon,
  Receipt,
  FileText,
  Clock,
  Briefcase,
  Upload,
  Info
} from 'lucide-react-native';
import { useTheme } from "../../hooks/useTheme";
import { useBranch } from "../../components/BranchProvider";
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { apiClient } from '@/api/client';
import * as ImagePicker from 'expo-image-picker';

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

export default function CreateInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedBranchId } = useBranch();

  // --- STATE DEFINITIONS ---
  
  // Backend Configuration
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quotation Selection
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotationNo, setSelectedQuotationNo] = useState("");
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [showQuotationDropdown, setShowQuotationDropdown] = useState(false);
  const [quotationSearchQuery, setQuotationSearchQuery] = useState("");

  // Customer Details & Search
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

  // Rules Settings
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("PERCENTAGE");
  const [discountTypeMode, setDiscountTypeMode] = useState<"GLOBAL" | "PER_PRODUCT">("GLOBAL");
  const [discountValue, setDiscountValue] = useState("0.00");
  
  const [taxLogic, setTaxLogic] = useState<"FIXED_SLAB" | "CUSTOM" | "PER_PRODUCT">("FIXED_SLAB");
  const [taxPercentage, setTaxPercentage] = useState("12"); // Default 12%
  const [taxLabel, setTaxLabel] = useState("GST 12%");

  // Invoice Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "item-1",
      productName: "",
      description: "",
      unitPrice: 0,
      quantity: 1,
    }
  ]);

  // Product Search Suggestions
  const [productList, setProductList] = useState<any[]>([]);
  const [activeProductSearchIdx, setActiveProductSearchIdx] = useState<number | null>(null);

  const [showTaxDropdown, setShowTaxDropdown] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);

  // Payment Collection
  const [addPaymentDuringCreation, setAddPaymentDuringCreation] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "UPI" | "CASH" | "CHEQUE">("BANK_TRANSFER");
  const [paymentNote, setPaymentNote] = useState("");
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<any>(null);

  // Timeline
  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const [invoiceDate, setInvoiceDate] = useState(formatDateString(new Date()));
  
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 30); // 30 days due
  const [dueDate, setDueDate] = useState(formatDateString(defaultDue));

  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment is due within 30 days. Late payments are subject to a 1.5% monthly fee.");

  // --- API MOUNT RETRIEVAL ---
  
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Load Quotations
        const quoRes = await apiClient.get('/quotations', { params: { branchId: selectedBranchId } });
        if (quoRes.status === 200 && Array.isArray(quoRes.data)) {
          setQuotations(quoRes.data);
        }

        // If editing an existing invoice, pre-fill all details
        if (id) {
          const invRes = await apiClient.get(`/invoices/${id}`);
          if (invRes.status === 200 && invRes.data) {
            const inv = invRes.data;
            if (inv.customer) {
              setSelectedClient(inv.customer.companyName || inv.customer.customerName);
              setSelectedCustomerId(inv.customerId || inv.customer.id);
              setContactName(inv.customerSnapshot?.customerName || inv.customer.customerName || "");
              setMobile(inv.customerSnapshot?.mobileNumber || inv.customer.mobileNumber || "");
              setEmail(inv.customerSnapshot?.email || inv.customer.email || "");
              if (inv.billingAddress) {
                setBillingAddress(typeof inv.billingAddress === 'object' ? inv.billingAddress.street || '' : inv.billingAddress);
              }
            }
            if (inv.items && Array.isArray(inv.items)) {
              setLineItems(inv.items.map((item: any) => ({
                id: item.id || `item-${Date.now()}-${Math.random()}`,
                productId: item.productId,
                productName: item.productSnapshot?.name || item.description || "",
                description: item.description || "",
                unitPrice: item.price || 0,
                quantity: item.quantity || 1,
                image: item.image || undefined,
              })));
            }
            if (inv.notes) setNotes(inv.notes);
            if (inv.termsAndConditions) setTerms(inv.termsAndConditions);
            if (inv.invoiceDate) setInvoiceDate(formatDateString(new Date(inv.invoiceDate)));
            if (inv.dueDate) setDueDate(formatDateString(new Date(inv.dueDate)));
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    loadInitialData();
  }, [id, selectedBranchId]);

  // --- SEARCH HANDLERS ---
  
  const handleCustomerSearch = async (text: string) => {
    setSelectedClient(text);
    setIsSearchingCustomers(true);
    try {
      const res = await apiClient.get(`/invoices/customers/search?q=${encodeURIComponent(text)}`, { params: { branchId: selectedBranchId } });
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

  const handleSelectQuotation = (quotation: any) => {
    setSelectedQuotationNo(quotation.quotationNumber);
    setSelectedQuotationId(quotation.id);
    
    // Auto-fill customer
    if (quotation.customer) {
      setSelectedClient(quotation.customer.companyName || quotation.customer.customerName);
      setSelectedCustomerId(quotation.customerId);
      setContactName(quotation.customerSnapshot?.customerName || quotation.customer.customerName || "");
      setMobile(quotation.customerSnapshot?.mobileNumber || quotation.customer.mobileNumber || "");
      setEmail(quotation.customerSnapshot?.email || quotation.customer.email || "");
      
      const addr = quotation.billingAddressSnapshot || quotation.customer.address;
      if (addr) {
        if (typeof addr === 'object') {
          setBillingAddress(addr.street || addr.address || JSON.stringify(addr));
        } else {
          setBillingAddress(addr);
        }
      }
    }

    // Auto-fill Rules
    if (quotation.discountConfiguration) {
      setDiscountTypeMode(quotation.discountConfiguration.mode === 'FIXED' ? 'GLOBAL' : 'PER_PRODUCT'); // simple map
      setDiscountType(quotation.discountConfiguration.type === 'AMOUNT' ? 'FIXED' : 'PERCENTAGE');
      setDiscountValue(String(quotation.discountConfiguration.value || "0.00"));
    }

    if (quotation.taxConfiguration) {
      const mode = quotation.taxConfiguration.mode;
      if (mode === 'FIXED') {
        setTaxLogic("FIXED_SLAB");
        setTaxPercentage(String(quotation.taxConfiguration.value || "12"));
      } else {
        setTaxLogic("PER_PRODUCT");
      }
    }

    // Auto-fill Items
    if (quotation.items && Array.isArray(quotation.items)) {
      const mapped = quotation.items.map((item: any) => ({
        id: item.id || `item-${Date.now()}-${Math.random()}`,
        productId: item.productId,
        productName: item.productSnapshot?.name || item.editedDescription || "",
        description: item.editedDescription || "",
        unitPrice: item.editedPrice || 0,
        quantity: item.quantity || 1,
        image: item.editedImage || item.productSnapshot?.image || undefined
      }));
      setLineItems(mapped);
    }

    setShowQuotationDropdown(false);
  };

  const handleProductSearch = async (text: string, index: number) => {
    handleItemChange(lineItems[index].id, 'productName', text);
    setActiveProductSearchIdx(index);
    
    try {
      const res = await apiClient.get(`/invoices/products/search?q=${encodeURIComponent(text)}`, { params: { branchId: selectedBranchId } });
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

  // --- ITEM CONTROLS ---

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
      Alert.alert("Warning", "An invoice must have at least one item.");
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

  // --- IMAGE PICKER ---
  
  const handlePickReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Please allow gallery permissions to upload a receipt.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedReceiptFile(result.assets[0]);
      }
    } catch (e) {
      console.error("Error picking receipt:", e);
      Alert.alert("Error", "Could not pick payment attachment.");
    }
  };

  // --- CALCULATIONS ---

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
      return taxableAmount * (percentage / 100); // fixed slab / custom mapping
    }
  }, [subtotal, discountAmount, taxLogic, taxPercentage]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  // Set default payment amount to matches grandTotal
  useEffect(() => {
    setPaymentAmount(grandTotal.toFixed(2));
  }, [grandTotal]);

  const remainingBalance = useMemo(() => {
    if (!addPaymentDuringCreation) return grandTotal;
    const paid = parseFloat(paymentAmount) || 0;
    return Math.max(0, grandTotal - paid);
  }, [grandTotal, addPaymentDuringCreation, paymentAmount]);

  // --- SUBMISSION ---

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId) {
      Alert.alert("Required", "Please search and select a customer first.");
      return;
    }
    if (!selectedBranchId) {
      Alert.alert("Required", "No active branch config found.");
      return;
    }
    if (lineItems.length === 0 || !lineItems[0].productName) {
      Alert.alert("Required", "Please add at least one line item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        branchId: selectedBranchId,
        customerId: selectedCustomerId,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        billingAddress: { street: billingAddress },
        shippingAddress: { street: billingAddress },
        shippingSameAsBilling: !shippingIsDifferent,
        discountConfiguration: {
          mode: discountTypeMode === 'GLOBAL' ? 'FIXED' : 'PER_PRODUCT',
          type: discountType === 'FIXED' ? 'AMOUNT' : 'PERCENTAGE',
          value: parseFloat(discountValue) || 0
        },
        taxConfiguration: {
          mode: taxLogic === 'PER_PRODUCT' ? 'PER_PRODUCT' : 'FIXED',
          value: parseFloat(taxPercentage) || 0,
          label: taxLogic === 'FIXED_SLAB' ? taxLabel : 'GST'
        },
        notes: notes,
        termsAndConditions: terms,
        linkedQuotationId: selectedQuotationId || undefined,
        items: lineItems.map(item => ({
          productId: item.productId || undefined,
          price: item.unitPrice,
          description: item.description,
          image: item.image,
          quantity: item.quantity
        })),
        paymentConfiguration: addPaymentDuringCreation ? {
          addPayment: true,
          amount: parseFloat(paymentAmount) || 0,
          method: paymentMethod,
          date: new Date().toISOString(),
          note: paymentNote
        } : undefined
      };

      const res = id 
        ? await apiClient.put(`/invoices/${id}`, payload)
        : await apiClient.post('/invoices', payload);
      
      if (res.status === 200 || res.status === 201) {
        const createdInvoice = res.data;
        
        // Handle Payment Attachment Upload if exists
        if (selectedReceiptFile && addPaymentDuringCreation && createdInvoice.payments && createdInvoice.payments.length > 0) {
          const paymentId = createdInvoice.payments[0].id;
          const invoiceId = createdInvoice.id;
          
          const formData = new FormData();
          const fileUri = selectedReceiptFile.uri;
          const fileName = selectedReceiptFile.fileName || fileUri.split('/').pop() || 'payment_receipt.jpg';
          const fileType = selectedReceiptFile.mimeType || 'image/jpeg';
          
          formData.append('file', {
            uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
            name: fileName,
            type: fileType,
          } as any);

          await apiClient.post(`/invoices/${invoiceId}/payments/${paymentId}/attachment`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }

        Alert.alert(
          "Success",
          id ? "Invoice updated successfully!" : "Invoice created successfully!",
          [{ text: "OK", onPress: () => router.replace('/(app)/quotations') }]
        );
      } else {
        Alert.alert("Error", res.data?.message || "Failed to create invoice.");
      }
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      const errMsg = err.response?.data?.message || err.message || "An unknown error occurred.";
      Alert.alert("Error", Array.isArray(errMsg) ? errMsg.join('\n') : errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuotations = quotations.filter(q => 
    q.quotationNumber.toLowerCase().includes(quotationSearchQuery.toLowerCase())
  );

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
        <View style={[styles.glowCircle1, { backgroundColor: colors.primary, opacity: isDark ? 0.08 : 0.03 }]} />
        <View style={[styles.glowCircle2, { backgroundColor: colors.secondary, opacity: isDark ? 0.08 : 0.03 }]} />
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
          <Text style={[styles.headerTitle, { color: colors.primary }]}>{id ? "Edit Invoice" : "New Invoice"}</Text>
          <TouchableOpacity 
            style={[styles.headerBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}
            activeOpacity={0.7}
            onPress={() => Alert.alert("Actions", "Invoice actions menu")}
          >
            <MoreVertical color={colors.primary} size={18} />
          </TouchableOpacity>
        </View>
      </View>

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
        
        {/* Quotation Selection - Only for NEW Invoices */}
        {!id && (
          <View style={{ position: 'relative', zIndex: 50, marginBottom: 12 }}>
            <GlassPanel style={styles.sectionCard}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Quotation</Text>
              <View style={styles.dropdownContainer}>
                <View style={[styles.dropdownTrigger, { backgroundColor: colors.background + '66', borderColor: colors.border }]}>
                  <Search color={colors.textSecondary} size={16} style={styles.dropdownSearchIcon} />
                  <TextInput
                    value={selectedQuotationNo}
                    onChangeText={(text) => {
                      setSelectedQuotationNo(text);
                      setQuotationSearchQuery(text);
                      setShowQuotationDropdown(true);
                    }}
                    onFocus={() => {
                      setShowQuotationDropdown(true);
                    }}
                    style={[styles.dropdownTriggerInput, { color: colors.text }]}
                    placeholder="Search quotations..."
                    placeholderTextColor={colors.textSecondary + '80'}
                  />
                  <TouchableOpacity onPress={() => setShowQuotationDropdown(!showQuotationDropdown)}>
                    <ChevronDown color={colors.textSecondary} size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              {selectedQuotationId !== "" && (
                <View style={[styles.linkedQuotationRow, { backgroundColor: colors.surfaceVariant + '33', borderColor: colors.primary + '1A' }]}>
                  <View style={[styles.avatarWrapper, { borderColor: colors.primary + '33' }]}>
                    <Image 
                      source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDomVgL2a5ZiZgRYKaFu7uX873ViwvEEGmF9TBnIQOYhJApXJb7W4z07hH4p7cvDqaRadY5nq3s4jfr8CqbWLJ6x8kMv-deL-lxhBAr7U4_wv8L4KcbHD3X3uzf-J1Rct4ZSwMwtk9log0-U3GHRnQM-FL1MyUiY5jCbV1gYMDb0haWmY2Vt4K0yGl0LbfM3c3UdnKHCgXNdVVvV91vvtdfNp4yate73hHsPQ_HTAk-3aJa5arWP2p5' }} 
                      style={styles.avatar} 
                    />
                  </View>
                  <View>
                    <Text style={[styles.avatarName, { color: colors.text }]}>{contactName}</Text>
                    <Text style={[styles.avatarPhone, { color: colors.textSecondary }]}>{mobile}</Text>
                  </View>
                </View>
              )}
            </GlassPanel>

            {/* Rendered OUTSIDE GlassPanel so it isn't clipped by the card's overflow:hidden */}
            {showQuotationDropdown && filteredQuotations.length > 0 && (
              <View
                style={[
                  styles.dropdownList,
                  styles.dropdownListFloating,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.glassBorder },
                ]}
              >
                {filteredQuotations.map((q) => (
                  <TouchableOpacity
                    key={q.id}
                    style={[styles.dropdownItem, { borderBottomColor: colors.border + '33' }]}
                    onPress={() => {
                      handleSelectQuotation(q);
                      setShowQuotationDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                      {q.quotationNumber} - {q.customer?.customerName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Customer Details */}
        <GlassPanel style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <UserIcon color={colors.primary} size={18} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Customer Details</Text>
          </View>

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
                {customers.map((c) => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.dropdownItem, { borderBottomColor: colors.border + '33' }]}
                    onPress={() => handleSelectCustomer(c)}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                      {c.companyName ? `${c.companyName} (${c.customerName})` : c.customerName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Customer Name</Text>
              <TextInput 
                value={contactName}
                onChangeText={setContactName}
                style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                placeholder="Elena Rostova"
                placeholderTextColor={colors.textSecondary + '60'}
              />
            </View>

            <View style={styles.inputGroup}>
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

            <TouchableOpacity 
              style={styles.checkboxRow} 
              activeOpacity={0.8}
              onPress={() => setShippingIsDifferent(!shippingIsDifferent)}
            >
              <View style={[styles.checkbox, { borderColor: shippingIsDifferent ? colors.primary : colors.border, backgroundColor: shippingIsDifferent ? colors.primary + '1A' : 'transparent' }]}>
                {shippingIsDifferent && <View style={[styles.checkboxTick, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>Shipping Address is Different</Text>
            </TouchableOpacity>
          </View>
        </GlassPanel>

        {/* Rules */}
        <GlassPanel style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Receipt color={colors.primary} size={18} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Rules</Text>
          </View>

          <View style={styles.rulesContainer}>
            {/* Discount Section */}
            <View style={styles.ruleGroup}>
              <Text style={[styles.ruleGroupTitle, { color: colors.textSecondary }]}>Discount Type</Text>
              <View style={styles.radioTogglesContainer}>
                <TouchableOpacity 
                  style={[styles.radioToggleBtn, discountTypeMode === 'GLOBAL' && { backgroundColor: colors.surfaceVariant, borderColor: colors.primary + '4D' }]}
                  onPress={() => setDiscountTypeMode('GLOBAL')}
                >
                  <View style={[styles.radioOuter, { borderColor: discountTypeMode === 'GLOBAL' ? colors.primary : colors.border }]}>
                    {discountTypeMode === 'GLOBAL' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.radioToggleText, { color: colors.text }]}>Global</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.radioToggleBtn, discountTypeMode === 'PER_PRODUCT' && { backgroundColor: colors.surfaceVariant, borderColor: colors.primary + '4D' }]}
                  onPress={() => setDiscountTypeMode('PER_PRODUCT')}
                >
                  <View style={[styles.radioOuter, { borderColor: discountTypeMode === 'PER_PRODUCT' ? colors.primary : colors.border }]}>
                    {discountTypeMode === 'PER_PRODUCT' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.radioToggleText, { color: colors.text }]}>Per Product</Text>
                </TouchableOpacity>
              </View>

              {/* Percent vs Currency */}
              <View style={[styles.radioTogglesContainer, { marginTop: 10 }]}>
                <TouchableOpacity 
                  style={[styles.radioToggleBtn, discountType === 'PERCENTAGE' && { backgroundColor: colors.surfaceVariant, borderColor: colors.primary + '4D' }]}
                  onPress={() => setDiscountType('PERCENTAGE')}
                >
                  <View style={[styles.radioOuter, { borderColor: discountType === 'PERCENTAGE' ? colors.primary : colors.border }]}>
                    {discountType === 'PERCENTAGE' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.radioToggleText, { color: colors.text }]}>%</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.radioToggleBtn, discountType === 'FIXED' && { backgroundColor: colors.surfaceVariant, borderColor: colors.primary + '4D' }]}
                  onPress={() => setDiscountType('FIXED')}
                >
                  <View style={[styles.radioOuter, { borderColor: discountType === 'FIXED' ? colors.primary : colors.border }]}>
                    {discountType === 'FIXED' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.radioToggleText, { color: colors.text }]}>₹ / $</Text>
                </TouchableOpacity>
              </View>

              {discountTypeMode === 'GLOBAL' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Discount Value</Text>
                  <TextInput 
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="numeric"
                    style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  />
                </View>
              )}
            </View>

            {/* Tax Settings */}
            <View style={styles.ruleGroup}>
              <Text style={[styles.ruleGroupTitle, { color: colors.textSecondary }]}>Tax Rule</Text>
              <View style={styles.taxRadioWrap}>
                <TouchableOpacity 
                  style={[styles.taxRadioItem, taxLogic === 'FIXED_SLAB' && styles.taxRadioActive]} 
                  onPress={() => { setTaxLogic('FIXED_SLAB'); setTaxPercentage("12"); setTaxLabel("GST 12%"); }}
                >
                  <View style={[styles.radioOuter, { borderColor: taxLogic === 'FIXED_SLAB' ? colors.primary : colors.border }]}>
                    {taxLogic === 'FIXED_SLAB' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={styles.taxRadioText}>Fixed</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.taxRadioItem, taxLogic === 'CUSTOM' && styles.taxRadioActive]}
                  onPress={() => { setTaxLogic('CUSTOM'); setTaxPercentage("18"); setTaxLabel("Custom"); }}
                >
                  <View style={[styles.radioOuter, { borderColor: taxLogic === 'CUSTOM' ? colors.primary : colors.border }]}>
                    {taxLogic === 'CUSTOM' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={styles.taxRadioText}>Custom</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.taxRadioItem, taxLogic === 'PER_PRODUCT' && styles.taxRadioActive]}
                  onPress={() => { setTaxLogic('PER_PRODUCT'); setTaxPercentage("0"); }}
                >
                  <View style={[styles.radioOuter, { borderColor: taxLogic === 'PER_PRODUCT' ? colors.primary : colors.border }]}>
                    {taxLogic === 'PER_PRODUCT' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={styles.taxRadioText}>Per Product</Text>
                </TouchableOpacity>
              </View>

              {taxLogic === 'FIXED_SLAB' && (
                <View style={{ zIndex: 60, position: 'relative', width: '100%' }}>
                  <TouchableOpacity 
                    style={[styles.selectWrapper, { marginTop: 12, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                    onPress={() => setShowTaxDropdown(!showTaxDropdown)}
                  >
                    <Text style={[styles.selectValue, { color: colors.text }]}>{taxLabel}</Text>
                    <ChevronDown color={colors.primary} size={16} />
                  </TouchableOpacity>
                  
                  {showTaxDropdown && (
                    <View style={[styles.methodDropdownList, { top: 60, backgroundColor: colors.surfaceVariant, borderColor: colors.glassBorder }]}>
                      <TouchableOpacity onPress={() => { setTaxPercentage("12"); setTaxLabel("GST 12%"); setShowTaxDropdown(false); }} style={styles.methodDropdownItem}><Text style={[styles.methodDropdownText, { color: colors.text }]}>GST 12%</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setTaxPercentage("18"); setTaxLabel("GST 18%"); setShowTaxDropdown(false); }} style={styles.methodDropdownItem}><Text style={[styles.methodDropdownText, { color: colors.text }]}>GST 18%</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setTaxPercentage("0"); setTaxLabel("No Tax"); setShowTaxDropdown(false); }} style={styles.methodDropdownItem}><Text style={[styles.methodDropdownText, { color: colors.text }]}>No Tax</Text></TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {taxLogic === 'CUSTOM' && (
                <View style={styles.customTaxRow}>
                  <TextInput
                    value={taxLabel}
                    onChangeText={setTaxLabel}
                    placeholder="Tax Label (e.g. VAT)"
                    placeholderTextColor={colors.textSecondary + '60'}
                    style={[styles.inputGlass, { flex: 2, marginRight: 8, color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  />
                  <TextInput
                    value={taxPercentage}
                    onChangeText={setTaxPercentage}
                    placeholder="%"
                    keyboardType="numeric"
                    style={[styles.inputGlass, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  />
                </View>
              )}

              {taxLogic === 'PER_PRODUCT' && (
                <View style={[styles.infoBanner, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '1A' }]}>
                  <Info color={colors.primary} size={16} style={{ marginRight: 8 }} />
                  <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>Tax fields will be enabled for each individual item in the list below.</Text>
                </View>
              )}
            </View>
          </View>
        </GlassPanel>

        {/* Invoice Items */}
        <View style={styles.lineItemsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary, paddingLeft: 4 }]}>Items</Text>
        </View>

        {lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surfaceVariant + 'B3', borderColor: colors.primary + '33', zIndex: activeProductSearchIdx === idx ? 30 : 1 }]}>
            {/* Controls */}
            <View style={styles.itemCardControls}>
              <TouchableOpacity style={styles.cardActionIcon} onPress={() => handleDuplicateItem(item.id)}>
                <Copy color={colors.textSecondary} size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardActionIcon} onPress={() => handleDeleteItem(item.id)}>
                <Trash2 color={colors.error} size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.itemMainRow}>
              {/* Product Image Placeholder */}
              <View style={[styles.imageContainer, { borderColor: colors.border + '4D' }]}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]} />
                )}
              </View>

              {/* Product Info */}
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

                {/* Suggestions Dropdown */}
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

              {/* Quantity Counter with Buttons */}
              <View style={styles.calcInputBlock}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Quantity</Text>
                <View style={[styles.qtyCounterContainer, { borderColor: colors.primary + '33', backgroundColor: colors.background + '50' }]}>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => handleItemChange(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                  >
                    <Text style={[styles.qtyBtnText, { color: colors.textSecondary }]}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    value={String(item.quantity)}
                    onChangeText={(val) => handleItemChange(item.id, 'quantity', val)}
                    keyboardType="numeric"
                    style={[styles.qtyInput, { color: colors.text }]}
                  />
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => handleItemChange(item.id, 'quantity', item.quantity + 1)}
                  >
                    <Text style={[styles.qtyBtnText, { color: colors.textSecondary }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.calcTotalBlock}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Line Total</Text>
                <Text style={[styles.calcTotalText, { color: colors.primary }]}>
                  ${(item.unitPrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.addItemBtn, { backgroundColor: colors.surfaceVariant + '4D', borderColor: colors.primary + '66' }]}
          activeOpacity={0.7}
          onPress={handleAddItem}
        >
          <Plus color={colors.primary} size={16} />
          <Text style={[styles.addItemBtnText, { color: colors.primary }]}>Add Another Item</Text>
        </TouchableOpacity>

        {/* Payments Section */}
        <GlassPanel style={[styles.sectionCard, { borderLeftWidth: 4, borderLeftColor: colors.secondary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Briefcase color={colors.primary} size={18} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Payment Collection</Text>
          </View>

          <View style={[styles.paymentStatsGrid, { backgroundColor: colors.background + '40', borderColor: colors.border + '1A' }]}>
            <View style={styles.paymentStatCol}>
              <Text style={[styles.paymentStatLabel, { color: colors.textSecondary }]}>Grand Total</Text>
              <Text style={[styles.paymentStatVal, { color: colors.text }]}>${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
            
            <View style={[styles.paymentStatCol, styles.paymentStatBorder, { borderColor: colors.border + '1A' }]}>
              <Text style={[styles.paymentStatLabel, { color: colors.textSecondary }]}>Already Paid</Text>
              <Text style={[styles.paymentStatVal, { color: colors.secondary }]}>
                ${addPaymentDuringCreation ? (parseFloat(paymentAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </Text>
            </View>

            <View style={[styles.paymentStatCol, styles.paymentStatBorder, { borderColor: colors.border + '1A' }]}>
              <Text style={[styles.paymentStatLabel, { color: colors.textSecondary }]}>Balance</Text>
              <Text style={[styles.paymentStatVal, { color: colors.error }]}>${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.checkboxRow, { marginBottom: 12 }]}
            activeOpacity={0.8}
            onPress={() => setAddPaymentDuringCreation(!addPaymentDuringCreation)}
          >
            <View style={[styles.checkbox, { borderColor: addPaymentDuringCreation ? colors.primary : colors.border, backgroundColor: addPaymentDuringCreation ? colors.primary + '1A' : 'transparent' }]}>
              {addPaymentDuringCreation && <View style={[styles.checkboxTick, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text, fontWeight: '500' }]}>Add Payment During Creation</Text>
          </TouchableOpacity>

          {addPaymentDuringCreation && (
            <View style={styles.paymentSubForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount ($)</Text>
                <TextInput 
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8, zIndex: 10 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Method</Text>
                  <TouchableOpacity 
                    style={[styles.selectWrapper, { borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                    onPress={() => setShowMethodDropdown(!showMethodDropdown)}
                  >
                    <Text style={[styles.selectValue, { color: colors.text }]}>
                      {paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : paymentMethod === 'UPI' ? 'UPI / Wallet' : paymentMethod === 'CASH' ? 'Cash' : 'Cheque'}
                    </Text>
                    <ChevronDown color={colors.primary} size={16} />
                  </TouchableOpacity>
                  
                  {showMethodDropdown && (
                    <View style={[styles.methodDropdownList, { backgroundColor: colors.surfaceVariant, borderColor: colors.glassBorder }]}>
                      <TouchableOpacity onPress={() => { setPaymentMethod("BANK_TRANSFER"); setShowMethodDropdown(false); }} style={styles.methodDropdownItem}><Text style={[styles.methodDropdownText, { color: colors.text }]}>Bank Transfer</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setPaymentMethod("UPI"); setShowMethodDropdown(false); }} style={styles.methodDropdownItem}><Text style={[styles.methodDropdownText, { color: colors.text }]}>UPI / Wallet</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setPaymentMethod("CASH"); setShowMethodDropdown(false); }} style={styles.methodDropdownItem}><Text style={[styles.methodDropdownText, { color: colors.text }]}>Cash</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setPaymentMethod("CHEQUE"); setShowMethodDropdown(false); }} style={styles.methodDropdownItem}><Text style={[styles.methodDropdownText, { color: colors.text }]}>Cheque</Text></TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Note (Optional)</Text>
                  <TextInput 
                    value={paymentNote}
                    onChangeText={setPaymentNote}
                    placeholder="e.g. Advance payment"
                    placeholderTextColor={colors.textSecondary + '60'}
                    style={[styles.inputGlass, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Payment Attachment</Text>
                <TouchableOpacity 
                  style={[styles.fileUploadBtn, { backgroundColor: colors.background + '40', borderColor: colors.border }]} 
                  activeOpacity={0.7}
                  onPress={handlePickReceipt}
                >
                  <View style={styles.fileUploadLeft}>
                    <Upload color={colors.primary} size={18} style={{ marginRight: 8 }} />
                    <Text style={[styles.fileUploadText, { color: colors.textSecondary }]}>
                      {selectedReceiptFile ? selectedReceiptFile.fileName || 'Selected Receipt Image' : 'Upload receipt or PDF'}
                    </Text>
                  </View>
                  <Text style={[styles.fileSelectText, { color: colors.primary }]}>Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassPanel>

        {/* Timeline & Summary Grid */}
        <View style={styles.gridContainer}>
          {/* Timeline */}
          <GlassPanel style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Clock color={colors.primary} size={18} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Timeline</Text>
            </View>
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Invoice Date</Text>
                <View style={styles.iconInputWrapper}>
                  <Calendar color={colors.textSecondary} size={16} style={styles.inputLeftIcon} />
                  <TextInput 
                    value={invoiceDate}
                    onChangeText={setInvoiceDate}
                    style={[styles.inputGlass, styles.inputGlassIcon, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Due Date</Text>
                <View style={styles.iconInputWrapper}>
                  <Calendar color={colors.textSecondary} size={16} style={styles.inputLeftIcon} />
                  <TextInput 
                    value={dueDate}
                    onChangeText={setDueDate}
                    style={[styles.inputGlass, styles.inputGlassIcon, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background + '50' }]}
                  />
                </View>
              </View>
            </View>
          </GlassPanel>

          {/* Invoice Summary */}
          <GlassPanel style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 16 }]}>Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.error }]}>
                  -${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tax ({taxLogic === 'PER_PRODUCT' ? `${taxPercentage}%` : taxLabel})</Text>
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
            </View>
          </GlassPanel>
        </View>

        {/* Notes & Terms */}
        <GlassPanel style={styles.sectionCard}>
          <View style={styles.formContainer}>
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
                placeholder="Add a note for this invoice..."
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
          </View>
        </GlassPanel>

        {/* Create Invoice Action Button */}
        <View style={styles.createBtnContainer}>
          <TouchableOpacity 
            style={[styles.createBtn, { shadowColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={handleCreateInvoice}
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
                  <Text style={[styles.createBtnText, { color: isDark ? '#001f2e' : '#ffffff' }]}>Create Invoice</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 40,
    marginBottom: 12,
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
  dropdownListFloating: {
    top: 90,
    left: 20,
    right: 20,
    zIndex: 60,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  linkedQuotationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    gap: 12,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarName: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarPhone: {
    fontSize: 12,
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    flexDirection: 'column',
    marginBottom: 10,
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
    marginBottom: 6,
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
  rulesContainer: {
    gap: 16,
  },
  ruleGroup: {
    marginBottom: 6,
  },
  ruleGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  radioTogglesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  radioToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  radioToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taxRadioWrap: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  taxRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 234, 255, 0.1)',
  },
  taxRadioActive: {
    backgroundColor: 'rgba(197, 234, 255, 0.08)',
    borderColor: 'rgba(197, 234, 255, 0.3)',
  },
  taxRadioText: {
    fontSize: 13,
    color: '#d8e2fd',
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    position: 'relative',
  },
  selectValue: {
    fontSize: 14,
  },
  selectOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    right: 32,
    top: 6,
  },
  selectOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  selectOptionText: {
    fontSize: 12,
    color: '#7dd3fc',
  },
  customTaxRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  infoBannerText: {
    fontSize: 12,
    flex: 1,
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
    flex: 1,
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
  qtyCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 36,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 28,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  qtyInput: {
    flex: 1,
    height: '100%',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  calcTotalBlock: {
    alignItems: 'flex-end',
    width: width * 0.26,
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
  paymentStatsGrid: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
  },
  paymentStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  paymentStatBorder: {
    borderLeftWidth: 1,
  },
  paymentStatLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  paymentStatVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentSubForm: {
    gap: 12,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 234, 255, 0.08)',
  },
  fileUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 16,
  },
  fileUploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileUploadText: {
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  fileSelectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridContainer: {
    gap: 16,
  },
  summaryContainer: {
    gap: 6,
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
  methodDropdownList: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 100,
    overflow: 'hidden',
  },
  methodDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  methodDropdownText: {
    fontSize: 13,
  },
});
