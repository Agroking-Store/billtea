import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Calendar, ChevronDown, Check, X } from "lucide-react-native";

import { AppHeader } from "../../components/ui/AppHeader";
import Header from "../../components/reports/Header";
import SummaryCard from "../../components/reports/SummaryCard";
import RecentReport from "../../components/reports/RecentReport";
import ProfitSummaryCard from "../../components/reports/ProfitSummaryCard";
import ExportButtons from "../../components/reports/ExportButtons";
import ProfitTransactionCard from "../../components/reports/ProfitTransactionCard";
import { profitTransactions } from "../../constants/reportData";
import { useTheme } from "../../hooks/useTheme";
import TransactionHistoryHeader from "../../components/reports/TransactionHistoryHeader";

export default function ReportsScreen() {
  const { colors, isDark } = useTheme();

  const [selected, setSelected] = useState<"invoice" | "profit">("invoice");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter States
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal Pickers
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const hasActiveFilters = Boolean(
    fromDateFilter || toDateFilter || customerFilter || statusFilter
  );

  const handleResetFilters = () => {
    setFromDateFilter("");
    setToDateFilter("");
    setCustomerFilter("");
    setStatusFilter("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <AppHeader
        title="Reports"
        onFilterPress={() => setShowFilterPanel((prev) => !prev)}
        showCloseButton={showFilterPanel}
        onClosePress={() => setShowFilterPanel(false)}
        filterActive={hasActiveFilters || showFilterPanel}
      >
        {/* Header Expansion Filter Panel */}
        {showFilterPanel && (
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

            {/* Row 2: CUSTOMER & PAYMENT STATUS (Only for Invoice Report) */}
            {selected === "invoice" && (
              <View style={styles.filterGridRow}>
                <View style={styles.filterFieldContainer}>
                  <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>CUSTOMER</Text>
                  <TouchableOpacity
                    onPress={() => setShowCustomerPicker(true)}
                    style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                  >
                    <Text style={[styles.filterSelectText, { color: customerFilter ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                      {customerFilter || "All Customers"}
                    </Text>
                    <ChevronDown size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterFieldContainer}>
                  <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>PAYMENT STATUS</Text>
                  <TouchableOpacity
                    onPress={() => setShowStatusPicker(true)}
                    style={[styles.filterSelectBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                  >
                    <Text style={[styles.filterSelectText, { color: statusFilter ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                      {statusFilter === "" && "All Status"}
                      {statusFilter === "PAID" && "Paid"}
                      {statusFilter === "UNPAID" && "Unpaid"}
                      {statusFilter === "PARTIAL" && "Partial"}
                      {statusFilter === "OVERDUE" && "Overdue"}
                      {statusFilter === "CANCELLED" && "Cancelled"}
                    </Text>
                    <ChevronDown size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Row 3: Reset & Apply Filters */}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Header selected={selected} onChange={setSelected} />

        {selected === "invoice" ? (
          <>
            <SummaryCard />
            <RecentReport />
          </>
        ) : (
          <>
            <ProfitSummaryCard />

            <ExportButtons />
            <TransactionHistoryHeader />

            {profitTransactions.map((item) => (
              <ProfitTransactionCard
                key={item.id}
                title={item.title}
                invoice={item.invoice}
                company={item.company}
                category={item.category}
                amount={item.amount}
                date={item.date}
                type={item.type}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Customer Picker Modal */}
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
            <TouchableOpacity
              style={[styles.pickerOptionItem, customerFilter === "" && { backgroundColor: colors.primary + "15" }]}
              onPress={() => { setCustomerFilter(""); setShowCustomerPicker(false); }}
            >
              <Text style={[styles.pickerOptionText, { color: customerFilter === "" ? colors.primary : colors.text }]}>All Customers</Text>
              {customerFilter === "" && <Check size={18} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payment Status Modal */}
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Payment Status</Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)} style={styles.closeBtn}>
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
                onPress={() => { setStatusFilter(item.value); setShowStatusPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: statusFilter === item.value ? colors.primary : colors.text }]}>{item.label}</Text>
                {statusFilter === item.value && <Check size={18} color={colors.primary} />}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  headerFilterExpansion: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  filterGridRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  filterFieldContainer: {
    flex: 1,
  },
  filterFieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
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
  filterDateInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    padding: 0,
    margin: 0,
  },
  filterSelectBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterSelectText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  filterActionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  resetOutlineBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  resetOutlineText: {
    fontSize: 13,
    fontWeight: "600",
  },
  applyFiltersBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  applyFiltersText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  pickerOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});