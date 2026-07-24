import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import {
  Eye,
  PencilLine,
  Copy,
  MessageCircle,
  Download,
  Send,
  Trash2,
  MessageSquare,
  Phone,
  FileText,
  X,
  Filter,
  RotateCcw,
  Check,
  ChevronDown,
  Calendar,
} from "lucide-react-native";

import { AppHeader } from "../../components/ui/AppHeader";
import { GlassPanel } from "../../components/ui/GlassPanel";
import { ActionIconButton } from "../../components/billing/ActionIconButton";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { useTheme } from "../../hooks/useTheme";
import { apiClient } from "@/api/client";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { ENV } from "@/config/env";
import { getStorageItemAsync } from "@/utils/storage";
import { TOKEN_KEYS } from "@/constants/keys";

const { width } = Dimensions.get("window");

type Tab = "Quotations" | "Invoices" | "Expenses";

interface Customer {
  id: string;
  customerName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED";
  quotationDate: string;
  expiryDate: string;
  customer: Customer | null;
  notes?: string;
  followUpDate?: string;
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "SENT" | "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  invoiceDate: string;
  dueDate: string;
  amountPaid: number;
  amountDue: number;
  customer: Customer | null;
  totals: {
    grandTotal: number;
  };
}

interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
  } | null;
  paymentMethod: string;
  note: string;
  date: string;
  createdBy: {
    fullName: string;
  } | null;
}

function formatDate(dateString: string) {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAbbreviatedCurrency(amount: number) {
  if (amount >= 1.0e6) {
    return `$${(amount / 1.0e6).toFixed(1)}M`;
  }
  if (amount >= 1.0e3) {
    return `$${(amount / 1.0e3).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

export default function QuotationsScreen() {
  const searchInputRef = useRef<TextInput>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Quotations");
  const { colors, isDark } = useTheme();

  // Record list states
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Fetching & Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedTabs, setFetchedTabs] = useState<Record<Tab, boolean>>({
    Quotations: false,
    Invoices: false,
    Expenses: false,
  });

  // Search states
  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");

  // ---- Inline Filter States (Matching reference code) ----
  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Dropdown States for Filters
  const [activeDropdown, setActiveDropdown] = useState<"customer" | "status" | null>(null);

  // Toggle Dropdowns
  const toggleDropdown = (dropdown: "customer" | "status") => {
    setActiveDropdown((prev) => (prev === dropdown ? null : dropdown));
  };

  // Fetch data lazily on tab switch
  useEffect(() => {
    if (fetchedTabs[activeTab]) return;

    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = `/${activeTab.toLowerCase()}`;
        const res = await apiClient.get(endpoint);
        if (!mounted) return;

        if (res.status === 200 && (res.data?.success || Array.isArray(res.data))) {
          const tabKey = activeTab.toLowerCase();
          const list = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data[tabKey])
            ? res.data[tabKey]
            : [];
          if (activeTab === "Quotations") {
            setQuotations(list);
          } else if (activeTab === "Invoices") {
            setInvoices(list);
          } else if (activeTab === "Expenses") {
            setExpenses(list);
          }
          setFetchedTabs((prev) => ({ ...prev, [activeTab]: true }));
        } else {
          setError(`Failed to load ${activeTab.toLowerCase()} list.`);
        }
      } catch (err) {
        if (mounted) {
          setError(`Failed to connect to server to load ${activeTab.toLowerCase()}.`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [activeTab, fetchedTabs]);

  // Unique customer list for Customer filter dropdown
  const uniqueCustomers = useMemo(() => {
    const names = new Set<string>();
    const sourceList = activeTab === "Quotations" ? quotations : activeTab === "Invoices" ? invoices : [];
    sourceList.forEach((item: any) => {
      if (item.customer?.customerName) names.add(item.customer.customerName);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [activeTab, quotations, invoices]);

  // Dynamic Statuses based on Active Tab
  const statusOptions = useMemo(() => {
    if (activeTab === "Quotations") return ["DRAFT", "SENT", "ACCEPTED", "EXPIRED"];
    if (activeTab === "Invoices") return ["DRAFT", "SENT", "UNPAID", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"];
    return [];
  }, [activeTab]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(customerFilter || statusFilter || fromDate || toDate || searchText);

  // Clear all filters
  const handleClearFilters = () => {
    setCustomerFilter("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    setSearchText("");
    setActiveDropdown(null);
  };

  // Helper date checker
  const isDateInRange = (itemDateStr: string) => {
    if (!fromDate && !toDate) return true;
    const itemDate = new Date(itemDateStr);
    if (isNaN(itemDate.getTime())) return true;

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (itemDate < from) return false;
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (itemDate > to) return false;
    }

    return true;
  };

  // Client-side search & inline filters
  const filteredQuotations = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return quotations.filter((q) => {
      const qNum = (q.quotationNumber ?? "").toLowerCase();
      const customerName = (q.customer?.customerName ?? "").toLowerCase();
      const companyName = (q.customer?.companyName ?? "").toLowerCase();
      const matchesSearch =
        !query || qNum.includes(query) || customerName.includes(query) || companyName.includes(query);

      const matchesCustomer = !customerFilter || q.customer?.customerName === customerFilter;
      const matchesStatus = !statusFilter || q.status === statusFilter;
      const matchesDate = isDateInRange(q.quotationDate);

      return matchesSearch && matchesCustomer && matchesStatus && matchesDate;
    });
  }, [quotations, searchText, customerFilter, statusFilter, fromDate, toDate]);

  const filteredInvoices = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return invoices.filter((i) => {
      const iNum = (i.invoiceNumber ?? "").toLowerCase();
      const customerName = (i.customer?.customerName ?? "").toLowerCase();
      const companyName = (i.customer?.companyName ?? "").toLowerCase();
      const matchesSearch =
        !query || iNum.includes(query) || customerName.includes(query) || companyName.includes(query);

      const matchesCustomer = !customerFilter || i.customer?.customerName === customerFilter;
      const matchesStatus = !statusFilter || i.status === statusFilter;
      const matchesDate = isDateInRange(i.invoiceDate);

      return matchesSearch && matchesCustomer && matchesStatus && matchesDate;
    });
  }, [invoices, searchText, customerFilter, statusFilter, fromDate, toDate]);

  const filteredExpenses = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return expenses.filter((e) => {
      const categoryName = (e.category?.name ?? "").toLowerCase();
      const noteText = (e.note ?? "").toLowerCase();
      const matchesSearch = !query || categoryName.includes(query) || noteText.includes(query);

      const matchesCustomer = !customerFilter || categoryName.includes(customerFilter.toLowerCase());
      const matchesDate = isDateInRange(e.date);

      return matchesSearch && matchesCustomer && matchesDate;
    });
  }, [expenses, searchText, customerFilter, fromDate, toDate]);

  // Stats Row calculations
  const currentStats = useMemo(() => {
    if (activeTab === "Quotations") {
      const totalVolume = quotations.reduce(
        (sum, item) => sum + (item.totals?.grandTotal ?? 0),
        0
      );
      const pendingCount = quotations.filter((q) => q.status === "SENT").length;
      return [
        { label: "Total Volume", value: formatAbbreviatedCurrency(totalVolume), color: colors.primary },
        { label: "Pending Sent", value: String(pendingCount), color: colors.tertiary },
      ];
    }
    if (activeTab === "Invoices") {
      const totalVolume = invoices.reduce(
        (sum, item) => sum + (item.totals?.grandTotal ?? 0),
        0
      );
      const pendingCount = invoices.filter(
        (i) => i.status === "UNPAID" || i.status === "PARTIAL" || i.status === "OVERDUE"
      ).length;
      const totalPaid = invoices.reduce((sum, item) => sum + (item.amountPaid ?? 0), 0);
      return [
        { label: "Total Volume", value: formatAbbreviatedCurrency(totalVolume), color: colors.primary },
        { label: "Pending", value: String(pendingCount), color: colors.tertiary },
        {
          label: "Total Paid",
          value: formatAbbreviatedCurrency(totalPaid),
          color: colors.text,
        },
      ];
    }
    // Expenses
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    return [
      {
        label: "Total Expenses",
        value: formatAbbreviatedCurrency(totalExpenses),
        color: colors.primary,
      },
      { label: "Unpaid", value: "12", color: colors.tertiary },
      { label: "Reimbursed", value: "$62.5K", color: colors.text },
    ];
  }, [activeTab, quotations, invoices, expenses, colors]);

  // Delete Handlers
  const handleDeleteQuotation = async (id: string) => {
    Alert.alert(
      "Delete Quotation",
      "Are you sure you want to delete this quotation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/quotations/${id}`);
              if (res.status === 200 && res.data?.success) {
                setQuotations((current) => current.filter((q) => q.id !== id));
                Alert.alert("Success", "Quotation deleted successfully.");
              } else {
                Alert.alert(
                  "Delete Failed",
                  res.data?.message || "Failed to delete quotation."
                );
              }
            } catch (err: any) {
              const errMsg = err.response?.data?.message || err.message || "Error deleting quotation.";
              Alert.alert("Delete Failed", Array.isArray(errMsg) ? errMsg.join("\n") : errMsg);
            }
          },
        },
      ]
    );
  };

  const handleDeleteInvoice = async (id: string) => {
    Alert.alert(
      "Delete Invoice",
      "Are you sure you want to delete this invoice?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/invoices/${id}`);
              if (res.status === 200 && res.data?.success) {
                setInvoices((current) => current.filter((i) => i.id !== id));
              } else {
                Alert.alert(
                  "Delete Failed",
                  res.data?.message || "Failed to delete invoice."
                );
              }
            } catch (err) {
              Alert.alert("Delete Failed", "Error deleting invoice.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteExpense = async (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/expenses/${id}`);
              if (res.status === 200 && res.data?.success) {
                setExpenses((current) => current.filter((e) => e.id !== id));
              }
            } catch (err) {
              Alert.alert("Delete Failed", "Error deleting expense.");
            }
          },
        },
      ]
    );
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadQuotationPdf = async (id: string, quotationNumber: string) => {
    if (downloadingId) return;
    try {
      setDownloadingId(id);
      const token = await getStorageItemAsync(TOKEN_KEYS.ACCESS);
      const pdfUrl = `${ENV.API_URL}/quotations/${id}/pdf?t=${Date.now()}`;
      const filename = `Quotation-${quotationNumber || id}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Bypass-Tunnel-Reminder": "true",
        },
      });

      if (downloadRes.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: "application/pdf",
            dialogTitle: `Download ${filename}`,
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("Downloaded", `File saved to ${downloadRes.uri}`);
        }
      } else {
        Alert.alert("Error", "Failed to download PDF. Please try again.");
      }
    } catch (err: any) {
      console.error("Error downloading quotation PDF:", err);
      Alert.alert("Error", err.message || "Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadInvoicePdf = async (id: string, invoiceNumber: string) => {
    if (downloadingId) return;
    try {
      setDownloadingId(id);
      const token = await getStorageItemAsync(TOKEN_KEYS.ACCESS);
      const pdfUrl = `${ENV.API_URL}/invoices/${id}/pdf?t=${Date.now()}`;
      const filename = `Invoice-${invoiceNumber || id}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Bypass-Tunnel-Reminder": "true",
        },
      });

      if (downloadRes.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: "application/pdf",
            dialogTitle: `Download ${filename}`,
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("Downloaded", `File saved to ${downloadRes.uri}`);
        }
      } else {
        Alert.alert("Error", "Failed to download PDF. Please try again.");
      }
    } catch (err: any) {
      console.error("Error downloading invoice PDF:", err);
      Alert.alert("Error", err.message || "Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  // --- Notes & Reminder Modal State & Handlers ---
  const [notesModalData, setNotesModalData] = useState<{
    id: string;
    notes: string;
    followUpDate: string;
  } | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleOpenNotesModal = (item: Quotation) => {
    let formattedDate = "";
    if (item.followUpDate) {
      try {
        formattedDate = new Date(item.followUpDate).toISOString().split("T")[0];
      } catch (e) {
        formattedDate = "";
      }
    }
    setNotesModalData({
      id: item.id,
      notes: item.notes || "",
      followUpDate: formattedDate,
    });
  };

  const handleSaveNotes = async () => {
    if (!notesModalData) return;
    setIsSavingNotes(true);
    try {
      const res = await apiClient.put(`/quotations/${notesModalData.id}`, {
        notes: notesModalData.notes,
        followUpDate: notesModalData.followUpDate
          ? new Date(notesModalData.followUpDate).toISOString()
          : null,
      });
      if (res.status === 200 || res.data) {
        setQuotations((prev) =>
          prev.map((q) =>
            q.id === notesModalData.id
              ? {
                  ...q,
                  notes: notesModalData.notes,
                  followUpDate: notesModalData.followUpDate
                    ? new Date(notesModalData.followUpDate).toISOString()
                    : undefined,
                }
              : q
          )
        );
        setNotesModalData(null);
        Alert.alert("Success", "Notes & Reminder updated successfully!");
      } else {
        Alert.alert("Error", res.data?.message || "Failed to save notes.");
      }
    } catch (err: any) {
      console.error("Error saving notes:", err);
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to save notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSearchIconPress = () => {
    setSearchActive((current) => {
      const next = !current;
      if (next) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      } else {
        searchInputRef.current?.blur();
        setSearchText("");
      }
      return next;
    });
  };

  const handleComingSoon = (action: string) => {
    Alert.alert("Coming Soon", `${action} action is not implemented yet.`);
  };

  // Card Render functions
  const renderQuotationCard = ({ item }: { item: Quotation }) => {
    const statusColors = {
      DRAFT: "#fbbf24",
      SENT: "#34d399",
      ACCEPTED: "#60a5fa",
      EXPIRED: "#fb7185",
    };
    const statusColor = statusColors[item.status] ?? colors.textSecondary;
    const customerName =
      item.customer?.companyName ??
      item.customer?.customerName ??
      "Unknown Customer";

    return (
      <GlassPanel style={styles.card}>
        {/* Row 1: ID & Amount */}
        <View style={styles.cardRow}>
          <Text style={[styles.invoiceNumberText, { color: statusColor }]}>
            {item.quotationNumber}
          </Text>
          <Text style={[styles.priceValueText, { color: colors.text }]}>
            {formatCurrency(item.totals?.grandTotal ?? 0)}
          </Text>
        </View>

        {/* Row 2: Customer Name & Expiry */}
        <View style={[styles.cardRow, { marginTop: 6 }]}>
          <Text style={[styles.cardTitleText, { color: colors.text }]} numberOfLines={1}>
            {customerName}
          </Text>
          <Text style={[styles.balanceLabelText, { color: colors.textSecondary }]}>
            EXPIRY: {formatDate(item.expiryDate)}
          </Text>
        </View>

        {/* Row 3: Date & Status */}
        <View style={[styles.cardRow, { marginTop: 8, alignItems: "center" }]}>
          <Text style={[styles.cardSubtitleText, { color: colors.textSecondary }]}>
            {formatDate(item.quotationDate)}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${statusColor}1A`,
                borderColor: `${statusColor}30`,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

        {/* Actions Row */}
        <View style={[styles.actionsRow, { justifyContent: "space-between" }]}>
          <ActionIconButton
            icon={PencilLine}
            onPress={() =>
              router.push({
                pathname: "/(app)/create-quotation",
                params: { id: item.id },
              })
            }
            color="#fbbf24"
          />
          <ActionIconButton
            icon={Copy}
            onPress={() =>
              router.push({
                pathname: "/(app)/create-quotation",
                params: { copyFromId: item.id },
              })
            }
          />
          <ActionIconButton
            icon={FileText}
            onPress={() => handleOpenNotesModal(item)}
            color="#34D399"
          />
          <ActionIconButton
            icon={Send}
            onPress={() => handleDownloadQuotationPdf(item.id, item.quotationNumber)}
            color="#7dd3fc"
          />
          <ActionIconButton
            icon={Trash2}
            onPress={() => handleDeleteQuotation(item.id)}
            color="#FF6B6B"
          />
        </View>
      </GlassPanel>
    );
  };

  const renderInvoiceCard = ({ item }: { item: Invoice }) => {
    const statusColors = {
      PAID: "#34d399",
      UNPAID: "#fbbf24",
      PARTIAL: "#fbbf24",
      OVERDUE: "#fb7185",
      DRAFT: "#88b4cc",
      SENT: "#7dd3fc",
      CANCELLED: "#64748b",
    };
    const statusColor = statusColors[item.status] ?? colors.textSecondary;
    const customerName =
      item.customer?.companyName ?? item.customer?.customerName ?? "Unknown Customer";

    const isOverdue = item.status === "OVERDUE";
    const isCancelled = item.status === "CANCELLED";

    return (
      <GlassPanel
        style={[styles.card, isCancelled && { opacity: 0.5 }]}
      >
        {/* Row 1: Invoice Number & Amount */}
        <View style={styles.cardRow}>
          <Text style={[styles.invoiceNumberText, { color: statusColor }]}>
            {item.invoiceNumber}
          </Text>
          <Text style={[styles.priceValueText, { color: colors.text }]}>
            {formatCurrency(item.totals?.grandTotal ?? 0)}
          </Text>
        </View>

        {/* Row 2: Customer Name & Balance */}
        <View style={[styles.cardRow, { marginTop: 6 }]}>
          <Text style={[styles.cardTitleText, { color: colors.text }]} numberOfLines={1}>
            {customerName}
          </Text>
          <Text style={[styles.balanceLabelText, { color: colors.textSecondary }]}>
            BALANCE: {formatCurrency(item.amountDue ?? 0)}
          </Text>
        </View>

        {/* Row 3: Date & Status */}
        <View style={[styles.cardRow, { marginTop: 8, alignItems: "center" }]}>
          <Text
            style={[
              styles.cardSubtitleText,
              { color: colors.textSecondary },
              isOverdue && { color: statusColor, fontWeight: "700" },
            ]}
          >
            {isOverdue
              ? `Due ${formatDate(item.dueDate)}`
              : formatDate(item.invoiceDate)}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${statusColor}1A`,
                borderColor: `${statusColor}30`,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

        {/* Actions Row */}
        <View style={[styles.actionsRow, { justifyContent: "space-between" }]}>
          <ActionIconButton icon={Eye} onPress={() => handleComingSoon("View")} />
          <ActionIconButton
            icon={PencilLine}
            onPress={() => handleComingSoon("Edit")}
            color="#fbbf24"
          />
          <ActionIconButton icon={Copy} onPress={() => handleComingSoon("Copy")} />
          <ActionIconButton
            icon={MessageSquare}
            onPress={() => handleComingSoon("Chat")}
            color="#34D399"
          />
          <ActionIconButton
            icon={Send}
            onPress={() => handleDownloadInvoicePdf(item.id, item.invoiceNumber)}
            color="#7dd3fc"
          />
          <ActionIconButton
            icon={Phone}
            onPress={() => handleComingSoon("Call")}
            color="#34D399"
          />
          <ActionIconButton
            icon={Trash2}
            onPress={() => handleDeleteInvoice(item.id)}
            color="#FF6B6B"
          />
        </View>
      </GlassPanel>
    );
  };

  const renderExpenseCard = ({ item }: { item: Expense }) => {
    const shortId = item.id
      ? item.id.substring(item.id.length - 8).toUpperCase()
      : "EXP";
    const loggedBy = (item.createdBy?.fullName ?? "—").toUpperCase();
    const categoryName = item.category?.name ?? "Uncategorized";

    return (
      <GlassPanel style={styles.card}>
        {/* Row 1: ID & Amount */}
        <View style={styles.cardRow}>
          <Text style={[styles.expenseNumberText, { color: colors.textSecondary }]}>
            #EXP-{shortId}
          </Text>
          <Text style={[styles.priceValueText, { color: colors.text }]}>
            -{formatCurrency(item.amount)}
          </Text>
        </View>

        {/* Row 2: Date & Creator */}
        <View style={[styles.cardRow, { marginTop: 6 }]}>
          <Text style={[styles.cardSubtitleText, { color: colors.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
          <Text style={[styles.loggedByCapsText, { color: colors.textSecondary }]}>
            {loggedBy}
          </Text>
        </View>

        {/* Row 3: Category Badge */}
        <View style={[styles.cardRow, { marginTop: 8, justifyContent: "flex-start" }]}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[styles.categoryBadgeText, { color: colors.text }]}>
              {categoryName}
            </Text>
          </View>
        </View>

        {/* Row 4: Note */}
        {item.note ? (
          <View style={[styles.noteContainer, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              {item.note}
            </Text>
          </View>
        ) : null}

        <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

        {/* Actions Row */}
        <View style={[styles.actionsRow, { justifyContent: "flex-start", gap: 12 }]}>
          <ActionIconButton icon={Copy} onPress={() => handleComingSoon("Copy")} />
          <ActionIconButton
            icon={PencilLine}
            onPress={() => handleComingSoon("Edit")}
            color="#fbbf24"
          />
          <ActionIconButton icon={Eye} onPress={() => handleComingSoon("View")} />
          <ActionIconButton
            icon={Trash2}
            onPress={() => handleDeleteExpense(item.id)}
            color="#FF6B6B"
          />
        </View>
      </GlassPanel>
    );
  };

  const activeDataList = useMemo(() => {
    if (activeTab === "Quotations") return filteredQuotations;
    if (activeTab === "Invoices") return filteredInvoices;
    return filteredExpenses;
  }, [activeTab, filteredQuotations, filteredInvoices, filteredExpenses]);

  const activeCardRenderer = useMemo<any>(() => {
    if (activeTab === "Quotations") return renderQuotationCard;
    if (activeTab === "Invoices") return renderInvoiceCard;
    return renderExpenseCard;
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Ambient background glow blobs */}
      <View style={styles.bgEffectsWrapper} pointerEvents="none">
        <View style={[styles.bgEffectTop, { backgroundColor: colors.primary + "12" }]} />
        <View style={[styles.bgEffectBottom, { backgroundColor: colors.tertiary + "12" }]} />
      </View>

      <AppHeader
        title={activeTab}
        onSearchPress={handleSearchIconPress}
        searchActive={searchActive}
        showSearchInput={searchActive}
        searchInputRef={searchInputRef}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
        onSearchBlur={() => setSearchActive(false)}
      />

      <FlatList
        data={loading ? [] : (activeDataList as any[])}
        keyExtractor={(item) => item.id}
        renderItem={activeCardRenderer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            {/* Pill Segmented Tab Control */}
            <SegmentedControl
              options={["Quotations", "Invoices", "Expenses"]}
              activeOption={activeTab}
              onOptionChange={(opt) => {
                setActiveTab(opt as Tab);
                handleClearFilters();
              }}
              style={{ marginBottom: 16 }}
            />

            {/* Unified Stats Row */}
            <GlassPanel style={styles.statsPanel}>
              <View style={styles.statsContainer}>
                {currentStats.map((stat, idx) => (
                  <React.Fragment key={stat.label}>
                    {idx > 0 && <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />}
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: colors.primary },
                          stat.color ? { color: stat.color } : null,
                        ]}
                      >
                        {stat.value}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </GlassPanel>

            {/* ---- INLINE FILTERS SECTION (Adapted from Reference Code) ---- */}
            <GlassPanel style={styles.inlineFilterPanel}>
              {/* Filter Section Header */}
              <View style={styles.filterHeaderRow}>
                <View style={styles.filterTitleGroup}>
                  <View style={[styles.filterIconBadge, { backgroundColor: colors.primary + "1A" }]}>
                    <Filter size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.filterHeaderText, { color: colors.text }]}>Filters</Text>
                </View>

                {hasActiveFilters && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "30" }]}>
                    <Check size={12} color={colors.primary} />
                    <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Active</Text>
                  </View>
                )}
              </View>

              {/* Filter Inputs Grid */}
              <View style={styles.filterControlsGrid}>
                {/* 1. Customer Filter Input */}
                <View style={styles.filterField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    {activeTab === "Expenses" ? "Category / Keyword" : "Customer"}
                  </Text>
                  {activeTab === "Expenses" ? (
                    <TextInput
                      value={customerFilter}
                      onChangeText={setCustomerFilter}
                      placeholder="Filter category..."
                      placeholderTextColor={colors.textSecondary + "70"}
                      style={[
                        styles.dropdownButton,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                      ]}
                    />
                  ) : (
                    <View style={{ zIndex: activeDropdown === "customer" ? 50 : 1 }}>
                      <TouchableOpacity
                        style={[
                          styles.dropdownButton,
                          { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                        ]}
                        onPress={() => toggleDropdown("customer")}
                      >
                        <Text style={[styles.dropdownButtonText, { color: customerFilter ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                          {customerFilter || "All Customers"}
                        </Text>
                        <ChevronDown size={16} color={colors.textSecondary} />
                      </TouchableOpacity>

                      {activeDropdown === "customer" && (
                        <View style={[styles.dropdownMenu, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                            <TouchableOpacity
                              style={[
                                styles.dropdownOption,
                                customerFilter === "" && { backgroundColor: colors.primary + "20" },
                              ]}
                              onPress={() => {
                                setCustomerFilter("");
                                setActiveDropdown(null);
                              }}
                            >
                              <Text style={[styles.dropdownOptionText, { color: customerFilter === "" ? colors.primary : colors.text }]}>
                                All Customers
                              </Text>
                            </TouchableOpacity>

                            {uniqueCustomers.map((name) => (
                              <TouchableOpacity
                                key={name}
                                style={[
                                  styles.dropdownOption,
                                  customerFilter === name && { backgroundColor: colors.primary + "20" },
                                ]}
                                onPress={() => {
                                  setCustomerFilter(name);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownOptionText, { color: customerFilter === name ? colors.primary : colors.text }]}>
                                  {name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* 2. Status Filter Input */}
                {activeTab !== "Expenses" && (
                  <View style={styles.filterField}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Status</Text>
                    <View style={{ zIndex: activeDropdown === "status" ? 50 : 1 }}>
                      <TouchableOpacity
                        style={[
                          styles.dropdownButton,
                          { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                        ]}
                        onPress={() => toggleDropdown("status")}
                      >
                        <Text style={[styles.dropdownButtonText, { color: statusFilter ? colors.text : colors.textSecondary }]}>
                          {statusFilter || "All Status"}
                        </Text>
                        <ChevronDown size={16} color={colors.textSecondary} />
                      </TouchableOpacity>

                      {activeDropdown === "status" && (
                        <View style={[styles.dropdownMenu, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                            <TouchableOpacity
                              style={[
                                styles.dropdownOption,
                                statusFilter === "" && { backgroundColor: colors.primary + "20" },
                              ]}
                              onPress={() => {
                                setStatusFilter("");
                                setActiveDropdown(null);
                              }}
                            >
                              <Text style={[styles.dropdownOptionText, { color: statusFilter === "" ? colors.primary : colors.text }]}>
                                All Status
                              </Text>
                            </TouchableOpacity>

                            {statusOptions.map((st) => (
                              <TouchableOpacity
                                key={st}
                                style={[
                                  styles.dropdownOption,
                                  statusFilter === st && { backgroundColor: colors.primary + "20" },
                                ]}
                                onPress={() => {
                                  setStatusFilter(st);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownOptionText, { color: statusFilter === st ? colors.primary : colors.text }]}>
                                  {st}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* 3. From Date Input */}
                <View style={styles.filterField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>From Date</Text>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      value={fromDate}
                      onChangeText={setFromDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary + "70"}
                      style={[
                        styles.dropdownButton,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                      ]}
                    />
                    <Calendar size={14} color={colors.textSecondary} style={styles.fieldRightIcon} />
                  </View>
                </View>

                {/* 4. To Date Input */}
                <View style={styles.filterField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>To Date</Text>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      value={toDate}
                      onChangeText={setToDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary + "70"}
                      style={[
                        styles.dropdownButton,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                      ]}
                    />
                    <Calendar size={14} color={colors.textSecondary} style={styles.fieldRightIcon} />
                  </View>
                </View>
              </View>

              {/* Reset Action */}
              <View style={styles.resetActionRow}>
                <TouchableOpacity
                  disabled={!hasActiveFilters}
                  onPress={handleClearFilters}
                  style={[
                    styles.resetInlineBtn,
                    { borderColor: colors.border },
                    !hasActiveFilters && { opacity: 0.4 },
                  ]}
                >
                  <RotateCcw size={14} color={colors.textSecondary} />
                  <Text style={[styles.resetInlineBtnText, { color: colors.textSecondary }]}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            </GlassPanel>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <GlassPanel style={styles.stateCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading {activeTab.toLowerCase()}...</Text>
            </GlassPanel>
          ) : error ? (
            <GlassPanel style={styles.stateCard}>
              <Text style={[styles.stateText, { color: colors.error }]}>{error}</Text>
            </GlassPanel>
          ) : (
            <GlassPanel style={styles.stateCard}>
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>No {activeTab.toLowerCase()} found.</Text>
            </GlassPanel>
          )
        }
      />

      {/* Notes & Reminder Modal */}
      <Modal
        visible={!!notesModalData}
        transparent
        animationType="fade"
        onRequestClose={() => setNotesModalData(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#0f172a" : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <FileText size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Notes & Reminder</Text>
              </View>
              <TouchableOpacity onPress={() => setNotesModalData(null)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Follow-up Date Field */}
            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Follow-up Date (YYYY-MM-DD)</Text>
              <TextInput
                value={notesModalData?.followUpDate || ""}
                onChangeText={(text) =>
                  setNotesModalData((prev) => (prev ? { ...prev, followUpDate: text } : null))
                }
                placeholder="YYYY-MM-DD (e.g. 2026-08-15)"
                placeholderTextColor={colors.textSecondary + "70"}
                style={[
                  styles.modalInput,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                ]}
              />
            </View>

            {/* Notes Field */}
            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Notes</Text>
              <TextInput
                value={notesModalData?.notes || ""}
                onChangeText={(text) =>
                  setNotesModalData((prev) => (prev ? { ...prev, notes: text } : null))
                }
                placeholder="Enter notes for this quotation..."
                placeholderTextColor={colors.textSecondary + "70"}
                multiline
                numberOfLines={4}
                style={[
                  styles.modalTextArea,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                ]}
              />
            </View>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setNotesModalData(null)}
                disabled={isSavingNotes}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveNotes}
                disabled={isSavingNotes}
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
              >
                {isSavingNotes ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Notes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgEffectsWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  bgEffectTop: {
    position: "absolute",
    top: -100,
    left: width * 0.1,
    width: 300,
    height: 300,
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  bgEffectBottom: {
    position: "absolute",
    bottom: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    transform: [{ scale: 1.5 }],
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsPanel: {
    marginBottom: 16,
    borderRadius: 18,
    paddingVertical: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statsDivider: {
    width: 1,
    height: 32,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },

  // ---- Inline Filter Styles ----
  inlineFilterPanel: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  filterHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  filterTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterIconBadge: {
    padding: 6,
    borderRadius: 8,
  },
  filterHeaderText: {
    fontSize: 16,
    fontWeight: "700",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  filterControlsGrid: {
    gap: 12,
  },
  filterField: {
    width: "100%",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    marginLeft: 2,
  },
  dropdownButton: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 13,
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownMenu: {
    position: "absolute",
    top: 46,
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    zIndex: 999,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  inputWithIcon: {
    position: "relative",
    justifyContent: "center",
  },
  fieldRightIcon: {
    position: "absolute",
    right: 12,
  },
  resetActionRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  resetInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetInlineBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
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
  idPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.15)",
  },
  idPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  invoiceNumberText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  priceValueText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  balanceLabelText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardSubtitleText: {
    fontSize: 12,
    fontWeight: "400",
  },
  expenseNumberText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loggedByCapsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadge: {
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  innerDivider: {
    height: 1,
    marginVertical: 14,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  noteContainer: {
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  loggedByText: {
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
  },
  stateCard: {
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
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalTextArea: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});