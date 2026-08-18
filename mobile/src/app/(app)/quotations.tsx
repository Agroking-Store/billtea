import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  ListRenderItem,
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
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import {
  Eye,
  PencilLine,
  Copy,
  Send,
  Trash2,
  Phone,
  Wallet,
  X,
  FileText,
  Check,
  ChevronDown,
  Calendar,
  Search,
} from "lucide-react-native";

import { AppHeader } from "../../components/ui/AppHeader";
import { GlassPanel } from "../../components/ui/GlassPanel";
import { ActionIconButton } from "../../components/billing/ActionIconButton";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { useTheme } from "../../hooks/useTheme";
import { useBranch } from "../../components/BranchProvider";
import { apiClient } from "@/api/client";
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
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Quotations");
  const { colors, isDark } = useTheme();
  const { selectedBranchId } = useBranch();

  useEffect(() => {
    setFetchedTabs({ Quotations: false, Invoices: false, Expenses: false });
  }, [selectedBranchId]);

  // Record list states
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "UPI" | "OTHER"
  >("CASH");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  // Fetch data lazily on tab switch
  useEffect(() => {
    if (fetchedTabs[activeTab]) return;

    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = `/${activeTab.toLowerCase()}`;
        const res = await apiClient.get(endpoint, { params: { branchId: selectedBranchId } });
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

  // --- Filter & Sorting state ---
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [customerFilter, setCustomerFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<
    "quotationNumber" | "customer" | "quotationDate" | "grandTotal" | "invoiceNumber" | "invoiceDate"
  >("quotationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pickers state for selection modals
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showInvoiceStatusPicker, setShowInvoiceStatusPicker] = useState(false);
  const [showExpenseMethodPicker, setShowExpenseMethodPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);

  const uniqueCustomers = useMemo(() => {
    const names = new Set<string>();
    quotations.forEach((q) => {
      if (q.customer?.customerName) names.add(q.customer.customerName);
    });
    invoices.forEach((i) => {
      if (i.customer?.customerName) names.add(i.customer.customerName);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [quotations, invoices]);

  const uniqueCompanies = useMemo(() => {
    const names = new Set<string>();
    quotations.forEach((q) => {
      if (q.customer?.companyName) names.add(q.customer.companyName);
    });
    invoices.forEach((i) => {
      if (i.customer?.companyName) names.add(i.customer.companyName);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [quotations, invoices]);

  const hasActiveFilters = Boolean(
    customerFilter ||
      companyFilter ||
      statusFilter ||
      paymentMethodFilter ||
      fromDateFilter ||
      toDateFilter ||
      sortBy !== "quotationDate" ||
      sortOrder !== "desc"
  );

  const handleResetFilters = () => {
    setCustomerFilter("");
    setCompanyFilter("");
    setStatusFilter("");
    setPaymentMethodFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setSortBy("quotationDate");
    setSortOrder("desc");
  };

  const filteredQuotations = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    let list = quotations.filter((q) => {
      if (query) {
        const qNum = (q.quotationNumber ?? "").toLowerCase();
        const customerName = (q.customer?.customerName ?? "").toLowerCase();
        const companyName = (q.customer?.companyName ?? "").toLowerCase();
        const amountStr = (q.totals?.grandTotal ?? 0).toString();
        const matchesSearch =
          qNum.includes(query) ||
          customerName.includes(query) ||
          companyName.includes(query) ||
          amountStr.includes(query);
        if (!matchesSearch) return false;
      }

      if (customerFilter && q.customer?.customerName !== customerFilter) {
        return false;
      }

      if (companyFilter && q.customer?.companyName !== companyFilter) {
        return false;
      }

      if (statusFilter && q.status !== statusFilter) {
        return false;
      }

      if (fromDateFilter || toDateFilter) {
        const qDate = new Date(q.quotationDate);
        if (fromDateFilter) {
          const from = new Date(fromDateFilter);
          from.setHours(0, 0, 0, 0);
          if (qDate < from) return false;
        }
        if (toDateFilter) {
          const to = new Date(toDateFilter);
          to.setHours(23, 59, 59, 999);
          if (qDate > to) return false;
        }
      }

      return true;
    });

    return [...list].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "quotationNumber") {
        comparison = (a.quotationNumber || "").localeCompare(b.quotationNumber || "");
      } else if (sortBy === "customer") {
        const nameA = a.customer?.customerName || "";
        const nameB = b.customer?.customerName || "";
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "quotationDate") {
        comparison = new Date(a.quotationDate).getTime() - new Date(b.quotationDate).getTime();
      } else if (sortBy === "grandTotal") {
        comparison = (a.totals?.grandTotal || 0) - (b.totals?.grandTotal || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [quotations, searchText, customerFilter, companyFilter, statusFilter, fromDateFilter, toDateFilter, sortBy, sortOrder]);

  const filteredInvoices = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    let list = invoices.filter((i) => {
      // Text Search Query
      if (query) {
        const iNum = (i.invoiceNumber ?? "").toLowerCase();
        const customerName = (i.customer?.customerName ?? "").toLowerCase();
        const companyName = (i.customer?.companyName ?? "").toLowerCase();
        const amountStr = (i.totals?.grandTotal ?? 0).toString();
        const matchesSearch =
          iNum.includes(query) ||
          customerName.includes(query) ||
          companyName.includes(query) ||
          amountStr.includes(query);
        if (!matchesSearch) return false;
      }

      if (customerFilter && i.customer?.customerName !== customerFilter) {
        return false;
      }

      // Company Filter
      if (companyFilter && i.customer?.companyName !== companyFilter) {
        return false;
      }

      // Payment Status Filter
      if (statusFilter && i.status !== statusFilter) {
        return false;
      }

      if (fromDateFilter || toDateFilter) {
        const iDate = new Date(i.invoiceDate);
        if (fromDateFilter) {
          const from = new Date(fromDateFilter);
          from.setHours(0, 0, 0, 0);
          if (iDate < from) return false;
        }
        if (toDateFilter) {
          const to = new Date(toDateFilter);
          to.setHours(23, 59, 59, 999);
          if (iDate > to) return false;
        }
      }

      return true;
    });

    // Column Sorting
    return [...list].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "invoiceNumber" || sortBy === "quotationNumber") {
        comparison = (a.invoiceNumber || "").localeCompare(b.invoiceNumber || "");
      } else if (sortBy === "customer") {
        const nameA = a.customer?.customerName || "";
        const nameB = b.customer?.customerName || "";
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "invoiceDate" || sortBy === "quotationDate") {
        comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
      } else if (sortBy === "grandTotal") {
        comparison = (a.totals?.grandTotal || 0) - (b.totals?.grandTotal || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [invoices, searchText, customerFilter, companyFilter, statusFilter, fromDateFilter, toDateFilter, sortBy, sortOrder]);

  const filteredExpenses = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return expenses.filter((e) => {
      if (query) {
        const categoryName = (e.category?.name ?? "").toLowerCase();
        const noteText = (e.note ?? "").toLowerCase();
        const amountStr = (e.amount ?? 0).toString();
        if (!categoryName.includes(query) && !noteText.includes(query) && !amountStr.includes(query)) {
          return false;
        }
      }

      if (paymentMethodFilter && e.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      if (fromDateFilter || toDateFilter) {
        const eDate = new Date(e.date);
        if (fromDateFilter) {
          const from = new Date(fromDateFilter);
          from.setHours(0, 0, 0, 0);
          if (eDate < from) return false;
        }
        if (toDateFilter) {
          const to = new Date(toDateFilter);
          to.setHours(23, 59, 59, 999);
          if (eDate > to) return false;
        }
      }

      return true;
    });
  }, [expenses, searchText, paymentMethodFilter, fromDateFilter, toDateFilter]);

  // Stats Row calculations
  const currentStats = useMemo(() => {
    if (activeTab === "Quotations") {
      const totalVolume = quotations.reduce(
        (sum, item) => sum + (item.totals?.grandTotal ?? 0),
        0
      );
      const acceptedCount = quotations.filter((q) => q.status === "ACCEPTED").length;
      const expiredCount = quotations.filter((q) => q.status === "EXPIRED").length;
      const sentCount = quotations.filter((q) => q.status === "SENT").length;
      return [
        { label: "VOLUME", value: formatAbbreviatedCurrency(totalVolume), color: "#38bdf8" },
        { label: "ACCEPTED", value: String(acceptedCount), color: "#34d399" },
        { label: "EXPIRED", value: String(expiredCount), color: "#f87171" },
        { label: "SENT", value: String(sentCount), color: "#c084fc" },
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

  const handleEditInvoice = (item: Invoice) => {
    router.push({ pathname: "/create-invoice", params: { id: item.id } });
  };

  const handleCopyInvoice = async (item: Invoice) => {
    const summary =
      `Invoice ${item.invoiceNumber}\n` +
      `Customer: ${item.customer?.customerName ?? "N/A"}\n` +
      `Company: ${item.customer?.companyName ?? "N/A"}\n` +
      `Amount: ${formatCurrency(item.totals?.grandTotal ?? 0)}\n` +
      `Status: ${item.status}`;
    await Clipboard.setStringAsync(summary);
    Alert.alert("Copied", "Invoice details copied. Paste it anywhere to share.");
  };

  const handleOpenPayment = (item: Invoice) => {
    setSelectedInvoiceForPayment(item);
    setPaymentAmount(item.amountDue ? String(item.amountDue) : "");
    setPaymentMethod("CASH");
    setPaymentError(null);
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedInvoiceForPayment) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError("Enter a valid amount.");
      return;
    }
    if (amountNum > selectedInvoiceForPayment.amountDue) {
      setPaymentError("Amount cannot be more than the due amount.");
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError(null);
    try {
      const res = await apiClient.post(`/invoices/${selectedInvoiceForPayment.id}/payments`, {
        amount: amountNum,
        method: paymentMethod,
        date: new Date().toISOString(),
      });

      if (res.status === 200 || res.status === 201) {
        setInvoices((current) =>
          current.map((inv) =>
            inv.id === selectedInvoiceForPayment.id
              ? {
                  ...inv,
                  amountPaid: inv.amountPaid + amountNum,
                  amountDue: Math.max(inv.amountDue - amountNum, 0),
                  status: inv.amountDue - amountNum <= 0 ? "PAID" : "PARTIAL",
                }
              : inv
          )
        );
        setPaymentModalOpen(false);
        Alert.alert("Success", "Payment recorded successfully.");
      } else {
        setPaymentError("Failed to record payment.");
      }
    } catch (err: any) {
      setPaymentError(err?.response?.data?.message || "Failed to record payment.");
    } finally {
      setPaymentSubmitting(false);
    }
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
  const handleCallCustomer = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert("No Phone Number", "This customer doesn't have a phone number on file.");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Unable to Place Call", "Your device couldn't open the phone dialer.");
    });
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
      ACCEPTED: "#38bdf8",
      EXPIRED: "#fb7185",
    };
    const statusColor = statusColors[item.status] ?? colors.textSecondary;
    const companyName = item.customer?.companyName || item.customer?.customerName || "Customer";
    const customerPerson =
      item.customer?.companyName && item.customer?.customerName !== item.customer?.companyName
        ? item.customer.customerName
        : "";

    return (
      <GlassPanel style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.numberPillBadge, { borderColor: "#38bdf8" + "40", backgroundColor: "#38bdf8" + "15" }]}>
            <Text style={styles.numberPillText}>#{item.quotationNumber}</Text>
          </View>

          <Text style={[styles.priceValueText, { color: colors.text }]}>
            {formatCurrency(item.totals?.grandTotal ?? 0)}
          </Text>
        </View>

        <View style={[styles.cardRow, { marginTop: 8, alignItems: "center" }]}>
          <Text style={[styles.cardTitleText, { color: colors.text, flex: 1, marginRight: 8 }]} numberOfLines={1}>
            {companyName}
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
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status === "ACCEPTED" ? "Approved" : item.status === "EXPIRED" ? "Rejected" : item.status}
            </Text>
          </View>
        </View>

        <View style={[styles.cardRow, { marginTop: 4, alignItems: "center" }]}>
          <Text style={[styles.cardSubtitleText, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
            {customerPerson ? `${customerPerson} • ` : ""}{formatDate(item.quotationDate)}
          </Text>
        </View>

        <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

        <View style={[styles.actionsRow, { justifyContent: "space-between" }]}>
          <ActionIconButton icon={Eye} onPress={() => handleComingSoon("View")} />
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
        <View style={styles.cardRow}>
          <Text style={[styles.invoiceNumberText, { color: statusColor }]}>
            {item.invoiceNumber}
          </Text>
          <Text style={[styles.priceValueText, { color: colors.text }]}>
            {formatCurrency(item.totals?.grandTotal ?? 0)}
          </Text>
        </View>

        <View style={[styles.cardRow, { marginTop: 6 }]}>
          <Text style={[styles.cardTitleText, { color: colors.text }]} numberOfLines={1}>
            {customerName}
          </Text>
          <Text style={[styles.balanceLabelText, { color: colors.textSecondary }]}>
            BALANCE: {formatCurrency(item.amountDue ?? 0)}
          </Text>
        </View>

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

        <View style={[styles.actionsRow, { justifyContent: "space-between" }]}>
          <ActionIconButton
            icon={PencilLine}
            onPress={() => handleEditInvoice(item)}
            color="#fbbf24"
          />
          <ActionIconButton icon={Copy} onPress={() => handleCopyInvoice(item)} />
          <ActionIconButton
            icon={Wallet}
            onPress={() => handleOpenPayment(item)}
            color="#c084fc"
          />
          <ActionIconButton
            icon={Send}
            onPress={() => handleDownloadInvoicePdf(item.id, item.invoiceNumber)}
            color="#7dd3fc"
          />
          <ActionIconButton
            icon={Phone}
            onPress={() => handleCallCustomer(item.customer?.mobileNumber)}
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
        <View style={styles.cardRow}>
          <Text style={[styles.expenseNumberText, { color: colors.textSecondary }]}>
            #EXP-{shortId}
          </Text>
          <Text style={[styles.priceValueText, { color: colors.text }]}>
            -{formatCurrency(item.amount)}
          </Text>
        </View>

        <View style={[styles.cardRow, { marginTop: 6 }]}>
          <Text style={[styles.cardSubtitleText, { color: colors.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
          <Text style={[styles.loggedByCapsText, { color: colors.textSecondary }]}>
            {loggedBy}
          </Text>
        </View>

        <View style={[styles.cardRow, { marginTop: 8, justifyContent: "flex-start", gap: 8 }]}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[styles.categoryBadgeText, { color: colors.text }]}>
              {categoryName}
            </Text>
          </View>
          {item.paymentMethod ? (
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
                {item.paymentMethod.replace("_", " ")}
              </Text>
            </View>
          ) : null}
        </View>

        {item.note ? (
          <View style={[styles.noteContainer, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              {item.note}
            </Text>
          </View>
        ) : null}

        <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

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

  const activeCardRenderer: ListRenderItem<Quotation | Invoice | Expense> = useMemo(() => {
    if (activeTab === "Quotations") {
      return renderQuotationCard as ListRenderItem<Quotation | Invoice | Expense>;
    }
    if (activeTab === "Invoices") {
      return renderInvoiceCard as ListRenderItem<Quotation | Invoice | Expense>;
    }
    return renderExpenseCard as ListRenderItem<Quotation | Invoice | Expense>;
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.bgEffectsWrapper} pointerEvents="none">
        <View style={[styles.bgEffectTop, { backgroundColor: colors.primary + "12" }]} />
        <View style={[styles.bgEffectBottom, { backgroundColor: colors.tertiary + "12" }]} />
      </View>

      <AppHeader
        title={activeTab}
        onSearchPress={handleSearchIconPress}
        onFilterPress={() => setShowFilterPanel((prev) => !prev)}
        showCloseButton={showFilterPanel}
        onClosePress={() => setShowFilterPanel(false)}
        searchActive={searchActive}
        filterActive={hasActiveFilters || showFilterPanel}
        showSearchInput={searchActive}
        searchInputRef={searchInputRef}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
        onSearchBlur={() => setSearchActive(false)}
      >
        {/* Quotations Header Filter */}
        {showFilterPanel && activeTab === "Quotations" && (
          <View style={styles.headerFilterExpansion}>
            <View style={[styles.filterSearchInputBox, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
              <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search quotations, customers..."
                placeholderTextColor={colors.textSecondary + "70"}
                style={[styles.filterSearchInputText, { color: colors.text }]}
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterGridRow}>
              <View style={styles.filterFieldContainer}>
                <TouchableOpacity
                  onPress={() => setShowCustomerPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: customerFilter ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                    {customerFilter || "Customer Name"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.filterFieldContainer}>
                <TouchableOpacity
                  onPress={() => setShowCompanyPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: companyFilter ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                    {companyFilter || "Company Name"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterGridRow}>
              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>FROM</Text>
                <View style={[styles.dateInputWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  <TextInput
                    value={fromDateFilter}
                    onChangeText={setFromDateFilter}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor={colors.textSecondary + "70"}
                    style={[styles.filterDateInput, { color: colors.text }]}
                  />
                  <Calendar size={16} color={colors.textSecondary} />
                </View>
              </View>

              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>TO</Text>
                <View style={[styles.dateInputWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  <TextInput
                    value={toDateFilter}
                    onChangeText={setToDateFilter}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor={colors.textSecondary + "70"}
                    style={[styles.filterDateInput, { color: colors.text }]}
                  />
                  <Calendar size={16} color={colors.textSecondary} />
                </View>
              </View>
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>STATUS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[
                  { label: "All", value: "" },
                  { label: "Sent", value: "SENT" },
                  { label: "Draft", value: "DRAFT" },
                  { label: "Approved", value: "ACCEPTED" },
                  { label: "Rejected", value: "EXPIRED" },
                ].map((chip) => {
                  const isSelected = statusFilter === chip.value;
                  return (
                    <TouchableOpacity
                      key={chip.label}
                      onPress={() => setStatusFilter(chip.value)}
                      style={[
                        styles.statusChipBtn,
                        isSelected
                          ? { backgroundColor: colors.primary + "25", borderColor: colors.primary }
                          : { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.filterGridRow}>
              <View style={styles.filterFieldContainer}>
                <TouchableOpacity
                  onPress={() => setShowSortPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: colors.text }]} numberOfLines={1}>
                    {sortBy === "quotationNumber"
                      ? "Sort By: Number"
                      : sortBy === "customer"
                      ? "Sort By: Customer"
                      : sortBy === "quotationDate"
                      ? "Sort By: Date"
                      : "Sort By: Amount"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.filterFieldContainer}>
                <TouchableOpacity
                  onPress={() => setShowOrderPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: colors.text }]} numberOfLines={1}>
                    {sortOrder === "asc" ? "Ascending" : "Descending"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterActionButtonsRow}>
              <TouchableOpacity
                onPress={handleResetFilters}
                style={[styles.resetOutlineBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.resetOutlineText, { color: colors.text }]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowFilterPanel(false)}
                style={[styles.applyFiltersBtn, { backgroundColor: "#7dd3fc" }]}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Invoices Header Filter */}
        {showFilterPanel && activeTab === "Invoices" && (
          <View style={styles.headerFilterExpansion}>
            <View style={styles.filterGridRow}>
              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>FROM DATE</Text>
                <View style={[styles.dateInputWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  <TextInput
                    value={fromDateFilter}
                    onChangeText={setFromDateFilter}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor={colors.textSecondary + "70"}
                    style={[styles.filterDateInput, { color: colors.text }]}
                  />
                  <Calendar size={16} color={colors.textSecondary} />
                </View>
              </View>

              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>TO DATE</Text>
                <View style={[styles.dateInputWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  <TextInput
                    value={toDateFilter}
                    onChangeText={setToDateFilter}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor={colors.textSecondary + "70"}
                    style={[styles.filterDateInput, { color: colors.text }]}
                  />
                  <Calendar size={16} color={colors.textSecondary} />
                </View>
              </View>
            </View>

            {/* Row 2: Customer Name & Company Name Dropdowns */}
            <View style={styles.filterGridRow}>
              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>CUSTOMER</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomerPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: customerFilter ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                    {customerFilter || "Customer Name"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>COMPANY</Text>
                <TouchableOpacity
                  onPress={() => setShowCompanyPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: companyFilter ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                    {companyFilter || "Company Name"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 3: STATUS Pill Chips */}
            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>STATUS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[
                  { label: "All", value: "" },
                  { label: "Draft", value: "DRAFT" },
                  { label: "Sent", value: "SENT" },
                  { label: "Unpaid", value: "UNPAID" },
                  { label: "Partial", value: "PARTIAL" },
                  { label: "Paid", value: "PAID" },
                  { label: "Overdue", value: "OVERDUE" },
                  { label: "Cancelled", value: "CANCELLED" },
                ].map((chip) => {
                  const isSelected = statusFilter === chip.value;
                  return (
                    <TouchableOpacity
                      key={chip.label}
                      onPress={() => setStatusFilter(chip.value)}
                      style={[
                        styles.statusChipBtn,
                        isSelected
                          ? { backgroundColor: colors.primary + "25", borderColor: colors.primary }
                          : { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Row 4: Sort By & Order Dropdowns */}
            <View style={styles.filterGridRow}>
              <View style={styles.filterFieldContainer}>
                <TouchableOpacity
                  onPress={() => setShowSortPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: colors.text }]} numberOfLines={1}>
                    {sortBy === "invoiceNumber" || sortBy === "quotationNumber"
                      ? "Sort By: Number"
                      : sortBy === "customer"
                      ? "Sort By: Customer"
                      : sortBy === "invoiceDate" || sortBy === "quotationDate"
                      ? "Sort By: Date"
                      : "Sort By: Amount"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.filterFieldContainer}>
                <TouchableOpacity
                  onPress={() => setShowOrderPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: colors.text }]} numberOfLines={1}>
                    {sortOrder === "asc" ? "Ascending" : "Descending"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 5: Action Buttons */}
            <View style={styles.filterActionButtonsRow}>
              <TouchableOpacity
                onPress={handleResetFilters}
                style={[styles.resetOutlineBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.resetOutlineText, { color: colors.text }]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowFilterPanel(false)}
                style={[styles.applyFiltersBtn, { backgroundColor: "#7dd3fc" }]}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Expenses Header Filter */}
        {showFilterPanel && activeTab === "Expenses" && (
          <View style={styles.headerFilterExpansion}>
            {/* Row 1: FROM DATE & TO DATE */}
            <View style={styles.filterGridRow}>
              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>FROM DATE</Text>
                <View style={[styles.dateInputWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  <TextInput
                    value={fromDateFilter}
                    onChangeText={setFromDateFilter}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor={colors.textSecondary + "70"}
                    style={[styles.filterDateInput, { color: colors.text }]}
                  />
                  <Calendar size={16} color={colors.textSecondary} />
                </View>
              </View>

              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>TO DATE</Text>
                <View style={[styles.dateInputWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  <TextInput
                    value={toDateFilter}
                    onChangeText={setToDateFilter}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor={colors.textSecondary + "70"}
                    style={[styles.filterDateInput, { color: colors.text }]}
                  />
                  <Calendar size={16} color={colors.textSecondary} />
                </View>
              </View>
            </View>

            {/* Row 2: PAYMENT METHOD Dropdown */}
            <View style={styles.filterGridRow}>
              <View style={styles.filterFieldContainer}>
                <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>PAYMENT METHOD</Text>
                <TouchableOpacity
                  onPress={() => setShowExpenseMethodPicker(true)}
                  style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.filterSelectText, { color: paymentMethodFilter ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                    {paymentMethodFilter ? paymentMethodFilter.replace("_", " ") : "All Payment Methods"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 3: Action Buttons */}
            <View style={styles.filterActionButtonsRow}>
              <TouchableOpacity
                onPress={handleResetFilters}
                style={[styles.resetOutlineBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.resetOutlineText, { color: colors.text }]}>Reset Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowFilterPanel(false)}
                style={[styles.applyFiltersBtn, { backgroundColor: "#7dd3fc" }]}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </AppHeader>

      <FlatList
        data={loading ? [] : activeDataList}
        keyExtractor={(item) => item.id}
        renderItem={activeCardRenderer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            <SegmentedControl
              options={["Quotations", "Invoices", "Expenses"]}
              activeOption={activeTab}
              onOptionChange={(opt) => {
                setActiveTab(opt as Tab);
              }}
              style={{ marginBottom: 16 }}
            />

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

      {/* Expense Payment Method Selection Modal */}
      <Modal
        visible={showExpenseMethodPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExpenseMethodPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowExpenseMethodPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setShowExpenseMethodPicker(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {[
              { label: "All Payment Methods", value: "" },
              { label: "Cash", value: "CASH" },
              { label: "Bank Transfer", value: "BANK_TRANSFER" },
              { label: "Cheque", value: "CHEQUE" },
              { label: "Credit Card", value: "CREDIT_CARD" },
              { label: "UPI", value: "UPI" },
              { label: "Other", value: "OTHER" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.pickerOptionItem, paymentMethodFilter === item.value && { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setPaymentMethodFilter(item.value); setShowExpenseMethodPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: paymentMethodFilter === item.value ? colors.primary : colors.text }]}>{item.label}</Text>
                {paymentMethodFilter === item.value && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        visible={paymentModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModalOpen(false)}
      >
        <View style={styles.paymentModalBackdrop}>
          <View
            style={[
              styles.paymentModalCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <View style={styles.paymentModalHeader}>
              <View>
                <Text style={[styles.paymentModalTitle, { color: colors.text }]}>Record Payment</Text>
                {selectedInvoiceForPayment && (
                  <Text style={[styles.paymentModalSubtitle, { color: colors.textSecondary }]}>
                    Invoice {selectedInvoiceForPayment.invoiceNumber}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setPaymentModalOpen(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {paymentError && (
              <View style={[styles.paymentModalErrorBanner, { backgroundColor: colors.error + "20", borderColor: colors.error + "40" }]}>
                <Text style={{ color: colors.error, fontSize: 13 }}>{paymentError}</Text>
              </View>
            )}

            <Text style={[styles.paymentModalLabel, { color: colors.textSecondary }]}>Amount</Text>
            <TextInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary + "80"}
              style={[
                styles.paymentModalInput,
                { backgroundColor: colors.surfaceVariant + "80", borderColor: colors.border, color: colors.text },
              ]}
            />

            {selectedInvoiceForPayment && (
              <Text style={[styles.paymentModalHint, { color: colors.textSecondary }]}>
                Due: {formatCurrency(selectedInvoiceForPayment.amountDue)} · Remaining after this payment:{" "}
                {formatCurrency(
                  Math.max(selectedInvoiceForPayment.amountDue - (parseFloat(paymentAmount) || 0), 0)
                )}
              </Text>
            )}

            <Text style={[styles.paymentModalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              Payment Method
            </Text>
            <View style={styles.paymentModalMethodRow}>
              {(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "UPI", "OTHER"] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[
                    styles.paymentModalMethodChip,
                    {
                      backgroundColor:
                        paymentMethod === method ? colors.primary + "20" : colors.surfaceVariant + "80",
                      borderColor: paymentMethod === method ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: paymentMethod === method ? colors.primary : colors.textSecondary,
                    }}
                  >
                    {method.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSubmitPayment}
              disabled={paymentSubmitting}
              style={[
                styles.paymentModalSaveButton,
                { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40", opacity: paymentSubmitting ? 0.6 : 1 },
              ]}
            >
              {paymentSubmitting ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15 }}>Save Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <FileText size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Notes & Reminder</Text>
              </View>
              <TouchableOpacity onPress={() => setNotesModalData(null)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

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

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomerPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowCustomerPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerPicker(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[styles.pickerOptionItem, customerFilter === "" && { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setCustomerFilter(""); setShowCustomerPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: customerFilter === "" ? colors.primary : colors.text }]}>All Customers</Text>
                {customerFilter === "" && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
              {uniqueCustomers.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.pickerOptionItem, customerFilter === name && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => { setCustomerFilter(name); setShowCustomerPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, { color: customerFilter === name ? colors.primary : colors.text }]}>{name}</Text>
                  {customerFilter === name && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {[
              { label: "All Status", value: "" },
              { label: "Draft", value: "DRAFT" },
              { label: "Sent", value: "SENT" },
              { label: "Accepted", value: "ACCEPTED" },
              { label: "Expired", value: "EXPIRED" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.pickerOptionItem, statusFilter === item.value && { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setStatusFilter(item.value); setShowStatusPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: statusFilter === item.value ? colors.primary : colors.text }]}>{item.label}</Text>
                {statusFilter === item.value && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Invoice Payment Status Selection Modal */}
      <Modal
        visible={showInvoiceStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvoiceStatusPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowInvoiceStatusPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Payment Status</Text>
              <TouchableOpacity onPress={() => setShowInvoiceStatusPicker(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {[
              { label: "All Status", value: "" },
              { label: "Paid", value: "PAID" },
              { label: "Unpaid", value: "UNPAID" },
              { label: "Partial", value: "PARTIAL" },
              { label: "Overdue", value: "OVERDUE" },
              { label: "Cancelled", value: "CANCELLED" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.pickerOptionItem, statusFilter === item.value && { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setStatusFilter(item.value); setShowInvoiceStatusPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: statusFilter === item.value ? colors.primary : colors.text }]}>{item.label}</Text>
                {statusFilter === item.value && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Column Selection Modal */}
      <Modal
        visible={showSortPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowSortPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sort By Column</Text>
              <TouchableOpacity onPress={() => setShowSortPicker(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {[
              { label: "Quotation Number", value: "quotationNumber" },
              { label: "Customer", value: "customer" },
              { label: "Date & Status", value: "quotationDate" },
              { label: "Total Amount", value: "grandTotal" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.pickerOptionItem, sortBy === item.value && { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setSortBy(item.value as any); setShowSortPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: sortBy === item.value ? colors.primary : colors.text }]}>{item.label}</Text>
                {sortBy === item.value && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Company Selection Modal */}
      <Modal
        visible={showCompanyPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompanyPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowCompanyPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Company</Text>
              <TouchableOpacity onPress={() => setShowCompanyPicker(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[styles.pickerOptionItem, companyFilter === "" && { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setCompanyFilter(""); setShowCompanyPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: companyFilter === "" ? colors.primary : colors.text }]}>Company Name (All)</Text>
                {companyFilter === "" && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
              {uniqueCompanies.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.pickerOptionItem, companyFilter === name && { backgroundColor: colors.primary + "15" }]}
                  onPress={() => { setCompanyFilter(name); setShowCompanyPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, { color: companyFilter === name ? colors.primary : colors.text }]}>{name}</Text>
                  {companyFilter === name && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Order Selection Modal */}
      <Modal
        visible={showOrderPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOrderPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowOrderPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0f172a" : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Order</Text>
              <TouchableOpacity onPress={() => setShowOrderPicker(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {[
              { label: "Descending", value: "desc" },
              { label: "Ascending", value: "asc" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.pickerOptionItem, sortOrder === item.value && { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setSortOrder(item.value as any); setShowOrderPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: sortOrder === item.value ? colors.primary : colors.text }]}>{item.label}</Text>
                {sortOrder === item.value && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgEffectsWrapper: {
    ...StyleSheet.absoluteFillObject,
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
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
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
    flexDirection: "row",
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
  paymentModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 20,
  },
  paymentModalCard: {
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  paymentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  paymentModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  paymentModalErrorBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  paymentModalLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  paymentModalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700",
  },
  paymentModalHint: {
    fontSize: 11,
    marginTop: 6,
  },
  paymentModalMethodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentModalMethodChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  paymentModalSaveButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
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
  filterGridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  filterFieldContainer: {
    flex: 1,
  },
  filterFieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  filterSelectBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterSelectText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  filterDateInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    padding: 0,
    margin: 0,
  },
  pickerOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterSearchInputBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filterSearchInputText: {
    flex: 1,
    fontSize: 14,
  },
  dateInputWrapper: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusChipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterActionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  resetOutlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resetOutlineText: {
    fontSize: 14,
    fontWeight: "700",
  },
  applyFiltersBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  applyFiltersText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  numberPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  numberPillText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "700",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerFilterExpansion: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
});
