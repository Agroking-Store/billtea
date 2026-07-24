import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import {
  Building2,
  Filter,
  House,
  Mail,
  Package,
  PencilLine,
  Phone,
  Plus,
  Search,
  Store,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react-native";

import { AppHeader } from "../../components/ui/AppHeader";
import { useTheme } from "../../hooks/useTheme";

import { ENV } from "@/config/env";
import { apiClient } from "@/api/client";

import { create } from "zustand";

type Section = "customers" | "products";
type FilterMode = "all" | "active" | "inactive";

type Branch = {
  id: string;
  name: string;
  isMainBranch: boolean;
};

type CustomerRecord = {
  id: string;
  customerName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  businessLabel: string;
  businessLabelValue: string;
  address: string;
  otherInfo: string;
  isActive: boolean;
  quotationCount?: number;
  invoiceCount?: number;
};

type ProductRecord = {
  id: string;
  name: string;
  description: string;
  price: number;
  hsnNumber: string;
  skuNumber: string;
  image: string;
  isActive: boolean;
};

type CustomerForm = {
  customerName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  businessLabel: string;
  businessLabelValue: string;
  address: string;
  otherInfo: string;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  hsnNumber: string;
  skuNumber: string;
};

type QuickAddRequest = {
  route: string;
  timestamp: number;
  section?: Section;
} | null;

interface UiState {
  quickAddRequest: QuickAddRequest;
  productsSection: Section;
  setProductsSection: (section: Section) => void;
  requestQuickAdd: (route: string, section?: Section) => void;
  clearQuickAddRequest: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  quickAddRequest: null,
  productsSection: "products",
  setProductsSection: (section) =>
    set({
      productsSection: section,
    }),
  requestQuickAdd: (route, section = "products") =>
    set({
      quickAddRequest: {
        route,
        timestamp: Date.now(),
        section,
      },
    }),
  clearQuickAddRequest: () =>
    set({
      quickAddRequest: null,
    }),
}));

const EMPTY_CUSTOMER_FORM: CustomerForm = {
  customerName: "",
  companyName: "",
  email: "",
  mobileNumber: "",
  businessLabel: "",
  businessLabelValue: "",
  address: "",
  otherInfo: "",
};

const EMPTY_PRODUCT_FORM: ProductForm = {
  name: "",
  description: "",
  price: "",
  hsnNumber: "",
  skuNumber: "",
};

function getCustomerIcon(companyName: string) {
  const normalized = companyName.toLowerCase();
  if (
    normalized.includes("solution") ||
    normalized.includes("creative") ||
    normalized.includes("agency")
  ) {
    return Users;
  }
  if (
    normalized.includes("infra") ||
    normalized.includes("construction") ||
    normalized.includes("industrial")
  ) {
    return Store;
  }
  if (
    normalized.includes("global") ||
    normalized.includes("group") ||
    normalized.includes("corp") ||
    normalized.includes("ltd")
  ) {
    return Building2;
  }
  return UserRound;
}

function getImageUrl(imagePath: string) {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;

  const baseUrl = ENV.API_URL.replace(/\/api\/v1$/, "");
  const normalizedPath = imagePath.replace(/\\/g, "/");
  const path = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;
  return `${baseUrl}${path}`;
}

function normalizeCustomerText(customer: CustomerRecord) {
  return [
    customer.customerName,
    customer.companyName,
    customer.email,
    customer.mobileNumber,
    customer.businessLabel,
    customer.businessLabelValue,
    customer.address,
    customer.otherInfo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizeProductText(product: ProductRecord) {
  return [
    product.name,
    product.description,
    product.skuNumber,
    product.hsnNumber,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function SegmentButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        isActive && [
          styles.segmentButtonActive,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.primary + "2E",
          },
        ],
        pressed && styles.segmentButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.segmentText,
          { color: isActive ? colors.primary : colors.textSecondary },
          isActive && { fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const CustomerCard = React.memo(function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: {
  customer: CustomerRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = getCustomerIcon(customer.companyName);
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.glassBorder }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIdentity}>
          <View style={[styles.customerIconWrap, { borderColor: colors.primary + "33" }]}>
            <Icon color={colors.primary} size={20} strokeWidth={2.2} />
          </View>

          <View style={styles.cardTitleWrap}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {customer.customerName}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {customer.companyName || "Individual"}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={onEdit}
          >
            <PencilLine size={18} color="#FBBF24" strokeWidth={2.2} />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={onDelete}
          >
            <Trash2 size={18} color={colors.error} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.innerDivider, { backgroundColor: colors.primary + "1A" }]} />

      <View style={styles.detailRow}>
        {/* <View style={styles.detailItem}></View> */}

        <View style={styles.detailItem}>
          <Phone size={15} color={colors.primary} strokeWidth={2.1} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
            {customer.mobileNumber}
          </Text>
          <Mail size={15} color={colors.primary} strokeWidth={2.1} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
            {customer.email}
          </Text>
        </View>
      </View>

      <View style={styles.gstRow}>
        <Text style={[styles.gstLabel, { color: colors.primary }]}>GST</Text>
        <Text style={[styles.gstValue, { color: colors.text }]} numberOfLines={1}>
          {customer.businessLabelValue || "—"}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: colors.primary + "14" }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>QUOTATIONS</Text>
          <Text style={[styles.statValuePrimary, { color: colors.primary }]}>
            {String(customer.quotationCount ?? 0).padStart(2, "0")}
          </Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.primary + "14" }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>INVOICES</Text>
          <Text style={[styles.statValueSecondary, { color: colors.secondary }]}>
            {String(customer.invoiceCount ?? 0)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const ProductCard = React.memo(function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: ProductRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const imageUrl = getImageUrl(product.image);
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.glassBorder }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIdentity}>
          <View style={[styles.productIconWrap, { borderColor: colors.primary + "33" }]}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.productImage}
                contentFit="cover"
                pointerEvents="none"
              />
            ) : (
              <Package color={colors.primary} size={20} strokeWidth={2.2} />
            )}
          </View>

          <View style={styles.cardTitleWrap}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.description || "No description provided"}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={onEdit}
          >
            <PencilLine size={18} color="#FBBF24" strokeWidth={2.2} />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={onDelete}
          >
            <Trash2 size={18} color={colors.error} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.innerDivider, { backgroundColor: colors.primary + "1A" }]} />

      <View style={styles.productMetaRow}>
        <View style={[styles.metaPill, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "14" }]}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>SKU</Text>
          <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
            {product.skuNumber || "N/A"}
          </Text>
        </View>

        <View style={[styles.metaPill, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "14" }]}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>HSN</Text>
          <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
            {product.hsnNumber || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.productFooterRow}>
        <View style={styles.priceRow}>
          <Text style={[styles.priceCurrency, { color: colors.primary }]}>₹</Text>
          <Text style={[styles.priceValue, { color: colors.primary }]}>
            {product.price.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            product.isActive ? styles.statusActive : styles.statusInactive,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              product.isActive
                ? styles.statusDotActive
                : styles.statusDotInactive,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              product.isActive
                ? styles.statusTextActive
                : styles.statusTextInactive,
            ]}
          >
            {product.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>
    </View>
  );
});

function ModalField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  multiline?: boolean;
  required?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.primary }]}>
        {label}
        {required ? " *" : ""}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.fieldInput, { borderColor: colors.glassBorder, backgroundColor: colors.surface, color: colors.text }, multiline && styles.fieldInputMultiline]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

export default function ProductsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const searchInputRef = useRef<TextInput>(null);
  const quickAddRequest = useUiStore((state) => state.quickAddRequest);
  const clearQuickAddRequest = useUiStore(
    (state) => state.clearQuickAddRequest,
  );

  const [activeSection, setActiveSection] = useState<Section>("customers");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState<Section>("customers");
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] =
    useState<CustomerForm>(EMPTY_CUSTOMER_FORM);
  const [productForm, setProductForm] =
    useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [productImage, setProductImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const setProductsSection = useUiStore((state) => state.setProductsSection);

  const title = useMemo(
    () => (activeSection === "customers" ? "Customers" : "Products"),
    [activeSection],
  );

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await apiClient.get("/branches");
        if (res.status === 200 && res.data?.success) {
          const loadedBranches = Array.isArray(res.data.branches)
            ? res.data.branches
            : [];
          setBranches(loadedBranches);
          const mainBranch = loadedBranches.find(
            (branch: Branch) => branch.isMainBranch,
          );
          setSelectedBranchId(mainBranch?.id ?? loadedBranches[0]?.id ?? null);
        } else {
          setBranches([]);
          setSelectedBranchId(null);
        }
      } catch (err: any) {
        console.error("Failed to load branches:", err);
        setBranches([]);
        setSelectedBranchId(null);
        setError(err?.message || "Failed to load branches.");
      } finally {
        setLoadingBranches(false);
      }
    }

    loadBranches();
  }, []);

  useEffect(() => {
    if (!selectedBranchId) {
      setLoadingRecords(false);
      return;
    }

    let mounted = true;

    async function loadRecords() {
      setLoadingRecords(true);
      setError(null);

      try {
        const [customersRes, productsRes] = await Promise.all([
          apiClient.get(`/customers?branchId=${selectedBranchId}`),
          apiClient.get(`/products?branchId=${selectedBranchId}`),
        ]);

        if (!mounted) return;

        if (customersRes.status === 200 && customersRes.data?.success) {
          setCustomers(
            Array.isArray(customersRes.data.customers)
              ? customersRes.data.customers
              : [],
          );
        } else {
          setCustomers([]);
        }

        if (productsRes.status === 200 && productsRes.data?.success) {
          setProducts(
            Array.isArray(productsRes.data.products)
              ? productsRes.data.products
              : [],
          );
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        console.error("Failed to load records:", err);
        if (mounted) {
          setError(err?.message || "Failed to load records.");
          setCustomers([]);
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoadingRecords(false);
        }
      }
    }

    loadRecords();

    return () => {
      mounted = false;
    };
  }, [selectedBranchId]);

  useEffect(() => {
    if (quickAddRequest?.route !== "products") return;
    openCreateModal(quickAddRequest.section ?? activeSection);
    clearQuickAddRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAddRequest]);

  useEffect(() => {
    setProductsSection(activeSection);
  }, [activeSection, setProductsSection]);

  const openCreateModal = (section: Section) => {
    setModalSection(section);
    setEditCustomerId(null);
    setEditProductId(null);
    setCustomerForm(EMPTY_CUSTOMER_FORM);
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductImage(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditCustomer = (customer: CustomerRecord) => {
    setModalSection("customers");
    setEditCustomerId(customer.id);
    setEditProductId(null);
    setCustomerForm({
      customerName: customer.customerName || "",
      companyName: customer.companyName || "",
      email: customer.email || "",
      mobileNumber: customer.mobileNumber || "",
      businessLabel: customer.businessLabel || "",
      businessLabelValue: customer.businessLabelValue || "",
      address: customer.address || "",
      otherInfo: customer.otherInfo || "",
    });
    setProductImage(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditProduct = (product: ProductRecord) => {
    setModalSection("products");
    setEditCustomerId(null);
    setEditProductId(product.id);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price ? product.price.toString() : "",
      hsnNumber: product.hsnNumber || "",
      skuNumber: product.skuNumber || "",
    });
    setProductImage(null);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditCustomerId(null);
    setEditProductId(null);
    setProductImage(null);
    setError(null);
  };

  const collapseSearch = () => {
    setSearchActive(false);
    searchInputRef.current?.blur();
  };

  const handleSearchIconPress = () => {
    setSearchActive((current) => {
      const next = !current;
      if (next) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      } else {
        searchInputRef.current?.blur();
      }
      return next;
    });
  };

  const handleFilterPress = () => {
    setFilterMode((current) =>
      current === "all" ? "active" : current === "active" ? "inactive" : "all",
    );
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow photo access to select a product image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProductImage(result.assets[0]);
    }
  };

  const filteredCustomers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return customers.filter((customer) => {
      if (filterMode === "active" && !customer.isActive) return false;
      if (filterMode === "inactive" && customer.isActive) return false;
      if (!query) return true;
      return normalizeCustomerText(customer).includes(query);
    });
  }, [customers, filterMode, searchText]);

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return products.filter((product) => {
      if (filterMode === "active" && !product.isActive) return false;
      if (filterMode === "inactive" && product.isActive) return false;
      if (!query) return true;
      return normalizeProductText(product).includes(query);
    });
  }, [filterMode, products, searchText]);

  const visibleCustomers = filteredCustomers;
  const visibleProducts = filteredProducts;

  const handleDeleteCustomer = async (id: string) => {
    Alert.alert(
      "Delete customer",
      "Are you sure you want to delete this customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/customers/${id}`);
              if (res.status === 200 && res.data?.success) {
                setCustomers((current) =>
                  current.filter((customer) => customer.id !== id),
                );
              } else {
                Alert.alert(
                  "Delete failed",
                  res.data?.message || "Failed to delete customer.",
                );
              }
            } catch (err) {
              Alert.alert("Delete failed", "Error deleting customer.");
            }
          },
        },
      ],
    );
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert(
      "Delete product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/products/${id}`);
              if (res.status === 200 && res.data?.success) {
                setProducts((current) =>
                  current.filter((product) => product.id !== id),
                );
              } else {
                Alert.alert(
                  "Delete failed",
                  res.data?.message || "Failed to delete product.",
                );
              }
            } catch (err) {
              Alert.alert("Delete failed", "Error deleting product.");
            }
          },
        },
      ],
    );
  };

  const handleSaveCustomer = async () => {
    if (!selectedBranchId) {
      setError("No branch available for saving.");
      return;
    }

    if (
      !customerForm.customerName.trim() ||
      !customerForm.mobileNumber.trim()
    ) {
      setError("Customer name and mobile number are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = editCustomerId
        ? customerForm
        : { ...customerForm, branchId: selectedBranchId };

      const res = editCustomerId
        ? await apiClient.put(`/customers/${editCustomerId}`, payload)
        : await apiClient.post("/customers", payload);

      if (res.status === 200 || res.status === 201) {
        const savedCustomer = res.data.customer;
        if (editCustomerId) {
          setCustomers((current) =>
            current.map((item) =>
              item.id === editCustomerId ? savedCustomer : item,
            ),
          );
        } else {
          setCustomers((current) => [savedCustomer, ...current]);
        }
        closeModal();
      } else {
        setError(res.data?.message || "Failed to save customer.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedBranchId) {
      setError("No branch available for saving.");
      return;
    }

    if (!productForm.name.trim() || !productForm.price.trim()) {
      setError("Product name and price are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.append("branchId", selectedBranchId);
      payload.append("name", productForm.name);
      payload.append("price", productForm.price);
      if (productForm.description.trim())
        payload.append("description", productForm.description);
      if (productForm.skuNumber.trim())
        payload.append("skuNumber", productForm.skuNumber);
      if (productForm.hsnNumber.trim())
        payload.append("hsnNumber", productForm.hsnNumber);

      if (productImage?.uri) {
        payload.append("image", {
          uri: productImage.uri,
          name: productImage.fileName || `product-${Date.now()}.jpg`,
          type: productImage.mimeType || "image/jpeg",
        } as any);
      }

      const res = editProductId
        ? await apiClient.put(`/products/${editProductId}`, payload, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await apiClient.post("/products", payload, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      if (res.status === 200 || res.status === 201) {
        const savedProduct = res.data.product;
        if (editProductId) {
          setProducts((current) =>
            current.map((item) =>
              item.id === editProductId ? savedProduct : item,
            ),
          );
        } else {
          setProducts((current) => [savedProduct, ...current]);
        }
        closeModal();
      } else {
        setError(res.data?.message || "Failed to save product.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (modalSection === "customers") {
      handleSaveCustomer();
      return;
    }
    handleSaveProduct();
  };

  const renderModalFields = () => {
    if (modalSection === "customers") {
      return (
        <>
          <View style={styles.formGrid}>
            <ModalField
              label="Customer Name"
              required
              value={customerForm.customerName}
              onChangeText={(value) =>
                setCustomerForm((current) => ({
                  ...current,
                  customerName: value,
                }))
              }
              placeholder="e.g. John Doe"
            />
            <ModalField
              label="Mobile Number"
              required
              value={customerForm.mobileNumber}
              onChangeText={(value) =>
                setCustomerForm((current) => ({
                  ...current,
                  mobileNumber: value,
                }))
              }
              placeholder="+1 234 567 8900"
            />
            <ModalField
              label="Email"
              value={customerForm.email}
              onChangeText={(value) =>
                setCustomerForm((current) => ({ ...current, email: value }))
              }
              placeholder="john@example.com"
              keyboardType="email-address"
            />
            <ModalField
              label="Company Name"
              value={customerForm.companyName}
              onChangeText={(value) =>
                setCustomerForm((current) => ({
                  ...current,
                  companyName: value,
                }))
              }
              placeholder="Doe Enterprises"
            />
            <ModalField
              label="Business Label"
              value={customerForm.businessLabel}
              onChangeText={(value) =>
                setCustomerForm((current) => ({
                  ...current,
                  businessLabel: value,
                }))
              }
              placeholder="e.g., GST No, VAT No"
            />
            <ModalField
              label="Label Value"
              value={customerForm.businessLabelValue}
              onChangeText={(value) =>
                setCustomerForm((current) => ({
                  ...current,
                  businessLabelValue: value,
                }))
              }
              placeholder="Number / Value"
            />
          </View>
          <ModalField
            label="Address"
            value={customerForm.address}
            onChangeText={(value) =>
              setCustomerForm((current) => ({ ...current, address: value }))
            }
            placeholder="Full address"
            multiline
          />
          <ModalField
            label="Other Info"
            value={customerForm.otherInfo}
            onChangeText={(value) =>
              setCustomerForm((current) => ({ ...current, otherInfo: value }))
            }
            placeholder="Additional notes or info"
            multiline
          />
        </>
      );
    }

    return (
      <>
        <ModalField
          label="Product Name"
          required
          value={productForm.name}
          onChangeText={(value) =>
            setProductForm((current) => ({ ...current, name: value }))
          }
          placeholder="e.g. Premium Widget"
        />
        <View style={styles.formGrid}>
          <ModalField
            label="Selling Price"
            required
            value={productForm.price}
            onChangeText={(value) =>
              setProductForm((current) => ({ ...current, price: value }))
            }
            placeholder="0.00"
            keyboardType="numeric"
          />
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.primary }]}>Default Product Image</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.imagePickerButton, { borderColor: colors.primary + "2E", backgroundColor: colors.surface }]}
              onPress={handlePickImage}
            >
              <Upload size={18} color={colors.primary} strokeWidth={2.2} />
              <Text style={[styles.imagePickerText, { color: colors.text }]}>
                {productImage ? "Change Image" : "Select Image"}
              </Text>
            </TouchableOpacity>
            {productImage ? (
              <View style={[styles.imagePreviewRow, { borderColor: colors.primary + "1A", backgroundColor: colors.surface }]}>
                <Image
                  source={{ uri: productImage.uri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
                <View style={styles.imagePreviewText}>
                  <Text style={[styles.imagePreviewTitle, { color: colors.text }]} numberOfLines={1}>
                    {productImage.fileName || "Selected image"}
                  </Text>
                  <Text style={[styles.imagePreviewSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                    Image will be uploaded with the product.
                  </Text>
                </View>
              </View>
            ) : editProductId &&
              products.find((product) => product.id === editProductId)
                ?.image ? (
              <View style={[styles.imagePreviewRow, { borderColor: colors.primary + "1A", backgroundColor: colors.surface }]}>
                <Image
                  source={{
                    uri:
                      getImageUrl(
                        products.find((product) => product.id === editProductId)
                          ?.image || "",
                      ) || "",
                  }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
                <View style={styles.imagePreviewText}>
                  <Text style={[styles.imagePreviewTitle, { color: colors.text }]} numberOfLines={1}>
                    Current image
                  </Text>
                  <Text style={[styles.imagePreviewSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                    Selecting a new image will replace this one.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
          <ModalField
            label="SKU Number"
            value={productForm.skuNumber}
            onChangeText={(value) =>
              setProductForm((current) => ({ ...current, skuNumber: value }))
            }
            placeholder="e.g. WDGT-001"
          />
          <ModalField
            label="HSN / SAC Code"
            value={productForm.hsnNumber}
            onChangeText={(value) =>
              setProductForm((current) => ({ ...current, hsnNumber: value }))
            }
            placeholder="e.g. 84439990"
          />
        </View>
        <ModalField
          label="Description"
          value={productForm.description}
          onChangeText={(value) =>
            setProductForm((current) => ({ ...current, description: value }))
          }
          placeholder="Detailed product description..."
          multiline
        />
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <AppHeader
        title={title}
        onSearchPress={handleSearchIconPress}
        onFilterPress={handleFilterPress}
        searchActive={searchActive}
        filterActive={filterMode !== "all"}
        showSearchInput={searchActive}
        searchInputRef={searchInputRef}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        searchPlaceholder={
          activeSection === "customers"
            ? "Search customers..."
            : "Search products..."
        }
        onSearchBlur={() => setSearchActive(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={collapseSearch}
        keyboardShouldPersistTaps="handled"
      >
          <View style={[styles.segment, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
            <SegmentButton
              label="Customers"
              isActive={activeSection === "customers"}
              onPress={() => setActiveSection("customers")}
            />
            <SegmentButton
              label="Products"
              isActive={activeSection === "products"}
              onPress={() => setActiveSection("products")}
            />
          </View>

          {loadingBranches || loadingRecords ? (
            <View style={[styles.stateCard, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading records...</Text>
            </View>
          ) : error ? (
            <View style={[styles.stateCard, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>{error}</Text>
            </View>
          ) : activeSection === "customers" ? (
            <View style={styles.list}>
              {visibleCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={() => openEditCustomer(customer)}
                  onDelete={() => handleDeleteCustomer(customer.id)}
                />
              ))}
              {visibleCustomers.length === 0 && (
                <View style={[styles.stateCard, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                  <Text style={[styles.stateText, { color: colors.textSecondary }]}>No customers found.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.list}>
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => openEditProduct(product)}
                  onDelete={() => handleDeleteProduct(product.id)}
                />
              ))}
              {visibleProducts.length === 0 && (
                <View style={[styles.stateCard, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                  <Text style={[styles.stateText, { color: colors.textSecondary }]}>No products found.</Text>
                </View>
              )}
            </View>
          )}
      </ScrollView>

      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(10, 14, 26, 0.82)" : "rgba(0, 0, 0, 0.45)" }]}>
            <View style={[styles.modalPanel, { backgroundColor: isDark ? "rgba(15,21,36,0.95)" : colors.surface, borderColor: colors.glassBorder }]}>
              <View style={styles.modalGlow} pointerEvents="none" />

              <View style={[styles.modalHeader, { borderBottomColor: colors.primary + "1A" }]}>
                <View style={styles.modalHeadingWrap}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {modalSection === "customers"
                      ? editCustomerId
                        ? "Edit Customer"
                        : "New Customer"
                      : editProductId
                        ? "Edit Product"
                        : "New Product"}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    {modalSection === "customers"
                      ? editCustomerId
                        ? "Update the details for this connection."
                        : "Add a new connection to your selected branch."
                      : editProductId
                        ? "Update inventory item details."
                        : "Add a new item to your branch inventory."}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.modalCloseButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={closeModal}
                >
                  <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                {error ? (
                  <View style={[styles.modalError, { borderColor: colors.error + "2E" }]}>
                    <Text style={[styles.modalErrorText, { color: colors.error }]}>{error}</Text>
                  </View>
                ) : null}

                {renderModalFields()}
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.primary + "1A" }]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.modalCancelButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={closeModal}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={isDark ? "#001f2e" : "#FFFFFF"} />
                  ) : (
                    <>
                      <Plus size={16} color={isDark ? "#001f2e" : "#FFFFFF"} strokeWidth={3} />
                      <Text style={[styles.modalSaveText, { color: isDark ? "#001F2E" : "#FFFFFF" }]}>
                        {modalSection === "customers"
                          ? "Save Customer"
                          : "Save Product"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E1A",
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 124,
  },
  bodyPressable: {
    flex: 1,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(15,21,36,0.65)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.12)",
    padding: 3,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
  },
  segmentButtonActive: {
    backgroundColor: "#123854",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.18)",
  },
  segmentButtonPressed: {
    opacity: 0.94,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#7DD3FC",
    fontWeight: "700",
  },
  segmentTextInactive: {
    color: "#9AA8B8",
  },
  list: {
    gap: 15,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: "transparent",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.15)",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  customerIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  productIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.20)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: "#E0E8F0",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: "#A0B4C4",
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 2,
  },
  actionButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  innerDivider: {
    height: 1,
    backgroundColor: "rgba(125,211,252,0.10)",
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    rowGap: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: "100%",
    flexShrink: 1,
  },
  detailText: {
    flex: 1,
    color: "#A0B4C4",
    fontSize: 14,
  },
  gstRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  gstLabel: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  gstValue: {
    flex: 1,
    color: "#E0E8F0",
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    minHeight: 56,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.08)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#9AA8B8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statValuePrimary: {
    color: "#7DD3FC",
    fontSize: 15,
    fontWeight: "700",
  },
  statValueSecondary: {
    color: "#88B4CC",
    fontSize: 15,
    fontWeight: "700",
  },
  productMetaRow: {
    flexDirection: "row",
    gap: 10,
  },
  metaPill: {
    flex: 1,
    backgroundColor: "rgba(18,56,84,0.26)",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.08)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaLabel: {
    color: "#9AA8B8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  metaValue: {
    marginTop: 4,
    color: "#E0E8F0",
    fontSize: 13,
    fontWeight: "600",
  },
  productFooterRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  priceCurrency: {
    color: "#7DD3FC",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 1,
  },
  priceValue: {
    color: "#7DD3FC",
    fontSize: 18,
    fontWeight: "800",
  },
  statusBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusActive: {
    backgroundColor: "rgba(52,211,153,0.10)",
    borderColor: "rgba(52,211,153,0.20)",
  },
  statusInactive: {
    backgroundColor: "rgba(255,107,107,0.10)",
    borderColor: "rgba(255,107,107,0.20)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusDotActive: {
    backgroundColor: "#34D399",
  },
  statusDotInactive: {
    backgroundColor: "#FF6B6B",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statusTextActive: {
    color: "#34D399",
  },
  statusTextInactive: {
    color: "#FF6B6B",
  },
  stateCard: {
    backgroundColor: "rgba(15,21,36,0.75)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.15)",
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    color: "#A0B4C4",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 14, 26, 0.82)",
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: "center",
  },
  modalPanel: {
    maxHeight: "90%",
    borderRadius: 24,
    backgroundColor: "rgba(15,21,36,0.78)",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.15)",
    overflow: "hidden",
  },
  modalGlow: {
    // position: 'absolute',
    // top: 0,
    // left: '10%',
    // right: '10%',
    // height: 110,
    // // borderRadius: 999,
    // backgroundColor: 'rgba(125,211,252,0.08)',
    // opacity: 0.8,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(125,211,252,0.10)",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalHeadingWrap: {
    flex: 1,
  },
  modalTitle: {
    color: "#E8EEF6",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    marginTop: 4,
    color: "#A0B4C4",
    fontSize: 13,
    lineHeight: 18,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(20,28,46,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  modalError: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,107,107,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.18)",
  },
  modalErrorText: {
    color: "#FFB3B3",
    fontSize: 13,
  },
  formGrid: {
    gap: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: "#7DD3FC",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  fieldInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.12)",
    backgroundColor: "rgba(20,28,46,0.65)",
    color: "#E0E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  fieldInputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  imagePickerButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(125,211,252,0.18)",
    backgroundColor: "rgba(20,28,46,0.5)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  imagePickerText: {
    color: "#E0E8F0",
    fontSize: 14,
    fontWeight: "600",
  },
  imagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.10)",
    backgroundColor: "rgba(20,28,46,0.55)",
  },
  imagePreview: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(18,56,84,0.55)",
  },
  imagePreviewText: {
    flex: 1,
    minWidth: 0,
  },
  imagePreviewTitle: {
    color: "#E8EEF6",
    fontSize: 13,
    fontWeight: "700",
  },
  imagePreviewSubtitle: {
    marginTop: 2,
    color: "#A0B4C4",
    fontSize: 12,
    lineHeight: 16,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(125,211,252,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancelButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "rgba(20,28,46,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: "#A0B4C4",
    fontSize: 14,
    fontWeight: "700",
  },
  modalSaveButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#7DD3FC",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalSaveText: {
    color: "#001F2E",
    fontSize: 14,
    fontWeight: "800",
  },
});
