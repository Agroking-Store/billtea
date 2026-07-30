import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, TextInput, Platform, UIManager, LayoutAnimation } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { GlassPanelElevated } from '../../components/ui/GlassPanelElevated';
import { TrendChart } from '../../components/ui/TrendChart';
import { AppHeader } from '../../components/ui/AppHeader';
import { Receipt, TrendingUp, TrendingDown, FileText, CircleAlert, Calendar, Activity, Clock, Users, Banknote, Sun, Moon, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { apiClient } from '../../api/client';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';



const { width, height } = Dimensions.get('window');

type Branch = {
  id: string;
  name: string;
  isMainBranch: boolean;
};

type Kpis = {
  totalInvoices: number;
  invoicesChange: number;
  totalQuotations: number;
  quotationsChange: number;
  totalSales: number;
  salesChange: number;
  totalCustomers: number;
  customersChange: number;
};

type SalesTrendPoint = {
  date: string;
  invoices: number;
  quotations: number;
};

type InvoiceReminder = {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  status: string;
  customer?: { customerName: string; mobileNumber?: string };
};

type QuotationFollowup = {
  id: string;
  quotationNumber: string;
  followUpDate: string;
  status: string;
  customer?: { customerName: string };
};

type DashboardStats = {
  kpis: Kpis;
  salesTrend: SalesTrendPoint[];
  invoiceReminders: InvoiceReminder[];
  quotationFollowups: QuotationFollowup[];
};

// Unified reminder shape so invoices and quotations can share one list, as agreed with the team
type UnifiedReminder = {
  id: string;
  kind: 'invoice' | 'quotation';
  title: string;
  subtitle: string;
  date: string;
  isOverdue: boolean;
};

function formatCurrency(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
}

function formatChange(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value}%`;
}

function mergeReminders(stats: DashboardStats): UnifiedReminder[] {
  const today = new Date();

  const fromInvoices: UnifiedReminder[] = (stats.invoiceReminders || []).map((inv) => ({
    id: `invoice-${inv.id}`,
    kind: 'invoice',
    title: `Follow up with ${inv.customer?.customerName ?? 'customer'}`,
    subtitle: `Overdue Invoice #${inv.invoiceNumber}`,
    date: inv.dueDate,
    isOverdue: new Date(inv.dueDate) < today,
  }));

  const fromQuotations: UnifiedReminder[] = (stats.quotationFollowups || []).map((quo) => ({
    id: `quotation-${quo.id}`,
    kind: 'quotation',
    title: `Follow up with ${quo.customer?.customerName ?? 'customer'}`,
    subtitle: `Quotation #${quo.quotationNumber}`,
    date: quo.followUpDate,
    isOverdue: false,
  }));

  return [...fromInvoices, ...fromQuotations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { theme, setTheme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const toggleTheme = () => {
    setTheme(isDark ? 'Light' : 'Dark');
  };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>('');

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [dateRangeType, setDateRangeType] = useState("30_days");
  
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await apiClient.get('/branches');
        if (res.data.branches) setBranches(res.data.branches);
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    }
    loadBranches();
  }, []);

  // Load dashboard stats
  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (branchId) queryParams.append('branchId', branchId);
        
        let start = '';
        let end = '';
        const today = new Date();
        const yyyyMmDd = (d: Date) => d.toISOString().split('T')[0];

        if (dateRangeType === 'custom') {
          // Convert DD-MM-YYYY to YYYY-MM-DD for backend
          const parseDateString = (str: string) => {
            const parts = str.split('-');
            if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
            return str;
          };
          start = parseDateString(fromDateFilter);
          end = parseDateString(toDateFilter);
        } else {
          end = yyyyMmDd(today);
          const pastDate = new Date();
          if (dateRangeType === 'today') {
            start = end;
          } else if (dateRangeType === 'this_month') {
            pastDate.setDate(1);
            start = yyyyMmDd(pastDate);
          } else if (dateRangeType === 'this_year') {
            pastDate.setMonth(0, 1);
            start = yyyyMmDd(pastDate);
          } else if (dateRangeType === '30_days') {
            pastDate.setDate(today.getDate() - 30);
            start = yyyyMmDd(pastDate);
          }
        }

        if (start) queryParams.append('startDate', start);
        if (end) queryParams.append('endDate', end);

        const res = await apiClient.get(`/dashboard/stats?${queryParams.toString()}`);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [refreshKey, branchId, dateRangeType, fromDateFilter, toDateFilter]);

  const reminders = useMemo(() => (stats ? mergeReminders(stats) : []), [stats]);

  // Sum of quotation values within the current sales trend window, used as "Projected" total
  const projectedQuotationsValue = useMemo(() => {
    if (!stats) return 0;
    return stats.salesTrend.reduce((sum, p) => sum + p.quotations, 0);
  }, [stats]);

  // Compact the trend into a handful of x-axis labels so mobile doesn't get crowded
  const chartLabels = useMemo(() => {
    if (!stats || stats.salesTrend.length === 0) return [];
    const points = stats.salesTrend;
    const maxLabels = 4;
    if (points.length <= maxLabels) return points.map((p) => p.date);

    const step = Math.floor(points.length / maxLabels);
    const labels: string[] = [];
    for (let i = 0; i < points.length; i += step) {
      labels.push(points[i].date);
      if (labels.length === maxLabels) break;
    }
    return labels;
  }, [stats]);



  const onFromDateChange = (event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setShowFromPicker(false);
    if (selectedDate) {
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const yyyy = selectedDate.getFullYear();
      setFromDateFilter(`${dd}-${mm}-${yyyy}`);
    }
  };

  const onToDateChange = (event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setShowToPicker(false);
    if (selectedDate) {
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const yyyy = selectedDate.getFullYear();
      setToDateFilter(`${dd}-${mm}-${yyyy}`);
    }
  };

  const hasActiveFilters = Boolean(fromDateFilter || toDateFilter || dateRangeType !== "30_days" || branchId);

  const handleResetFilters = () => {
    setBranchId('');
    setFromDateFilter("");
    setToDateFilter("");
    setDateRangeType("30_days");
    setRefreshKey(prev => prev + 1);
    setShowFilterPanel(false);
  };
  
  const applyFilters = () => {
    setShowFilterPanel(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Decorative Background Effects (SVG Radial Gradients for smooth cross-platform rendering) */}
      <View style={styles.bgEffectsWrapper} pointerEvents="none">
        <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="gradTop" cx="10%" cy="10%" r="50%" fx="10%" fy="10%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="gradBottom" cx="90%" cy="90%" r="60%" fx="90%" fy="90%">
              <Stop offset="0%" stopColor={colors.tertiary} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={colors.tertiary} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="gradMiddle" cx="70%" cy="40%" r="40%" fx="70%" fy="40%">
              <Stop offset="0%" stopColor={(colors as any).secondary || colors.primary} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={(colors as any).secondary || colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradTop)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradBottom)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradMiddle)" />
        </Svg>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Title Area to match web theme */}
        <View style={styles.pageTitleContainer}>
          <View style={styles.titleRow}>
            <View style={[styles.badgePill, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '33', marginBottom: 0 }]}>
              <Activity color={colors.primary} size={14} />
              <Text style={[styles.badgePillText, { color: colors.primary }]}>OVERVIEW HUB</Text>
            </View>
            <View style={styles.inlineActions}>
              <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtnInline, { backgroundColor: isDark ? 'rgba(20,28,46,0.6)' : 'rgba(255,255,255,0.6)', borderColor: colors.border }]}>
                {isDark ? <Sun color={colors.text} size={18} /> : <Moon color={colors.text} size={18} />}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowFilterPanel(prev => !prev);
                }} 
                style={[styles.iconBtnInline, { backgroundColor: isDark ? 'rgba(20,28,46,0.6)' : 'rgba(255,255,255,0.6)', borderColor: colors.border }]}
              >
                <Filter color={hasActiveFilters ? colors.primary : colors.text} size={18} />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={[styles.pageTitle, { color: colors.text }]}>Dashboard</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            Monitor your business metrics, track sales performance, and manage recent activities in real-time.
          </Text>
        </View>

        {/* Filter Accordion */}
        {showFilterPanel && (
          <View style={[styles.filterAccordion, { backgroundColor: isDark ? 'rgba(20,28,46,0.5)' : 'rgba(255,255,255,0.5)', borderColor: colors.border }]}>
            {/* Branch Filter */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>BRANCH</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                <TouchableOpacity
                  onPress={() => setBranchId('')}
                  style={[
                    styles.statusChipBtn,
                    branchId === '' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: 'transparent', borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.statusChipText, { color: branchId === '' ? '#FFFFFF' : colors.textSecondary }]}>All</Text>
                </TouchableOpacity>
                {branches.map((b) => {
                  const isSelected = branchId === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => setBranchId(b.id)}
                      style={[
                        styles.statusChipBtn,
                        isSelected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: 'transparent', borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.statusChipText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>{b.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            
            {/* 1. Date Range Type Chips */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>DATE RANGE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {[
                  { label: "30 Days", value: "30_days" },
                  { label: "This Month", value: "this_month" },
                  { label: "This Year", value: "this_year" },
                  { label: "Custom Range", value: "custom" },
                ].map((chip) => {
                  const isSelected = dateRangeType === chip.value;
                  return (
                    <TouchableOpacity
                      key={chip.value}
                      onPress={() => setDateRangeType(chip.value)}
                      style={[
                        styles.statusChipBtn,
                        isSelected
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: 'transparent', borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Custom Date Inputs */}
            {dateRangeType === "custom" && (
              <View style={styles.filterGridRow}>
                <View style={styles.filterFieldContainer}>
                  <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>FROM DATE</Text>
                  <TouchableOpacity onPress={() => setShowFromPicker(true)} style={[styles.dateInputWrapper, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(20, 28, 46, 0.4)' : 'rgba(255, 255, 255, 0.8)' }]}>
                    <TextInput
                      value={fromDateFilter}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.textSecondary + "70"}
                      style={[styles.filterDateInput, { color: colors.text }]}
                      editable={false}
                      pointerEvents="none"
                    />
                    <Calendar size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterFieldContainer}>
                  <Text style={[styles.filterFieldLabel, { color: colors.textSecondary }]}>TO DATE</Text>
                  <TouchableOpacity onPress={() => setShowToPicker(true)} style={[styles.dateInputWrapper, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(20, 28, 46, 0.4)' : 'rgba(255, 255, 255, 0.8)' }]}>
                    <TextInput
                      value={toDateFilter}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.textSecondary + "70"}
                      style={[styles.filterDateInput, { color: colors.text }]}
                      editable={false}
                      pointerEvents="none"
                    />
                    <Calendar size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {showFromPicker && (
                  <DateTimePicker
                    value={fromDateFilter ? new Date(fromDateFilter.split('-').reverse().join('-')) : new Date()}
                    mode="date"
                    display="default"
                    onValueChange={onFromDateChange}
                    onDismiss={() => setShowFromPicker(false)}
                  />
                )}
                {showToPicker && (
                  <DateTimePicker
                    value={toDateFilter ? new Date(toDateFilter.split('-').reverse().join('-')) : new Date()}
                    mode="date"
                    display="default"
                    onValueChange={onToDateChange}
                    onDismiss={() => setShowToPicker(false)}
                  />
                )}
              </View>
            )}

            {/* 3. Action Buttons */}
            <View style={styles.filterActionButtonsRow}>
              <TouchableOpacity
                onPress={handleResetFilters}
                style={[styles.resetOutlineBtn, { borderColor: colors.border, backgroundColor: 'transparent' }]}
              >
                <Text style={[styles.resetOutlineText, { color: colors.text }]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  applyFilters();
                }}
                style={[styles.applyFiltersBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.applyFiltersText, { color: '#FFFFFF' }]}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
            <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {loading && !stats ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            {/* Core Metrics Grid */}
            <View style={styles.metricsGrid}>
              {/* Invoice Card */}
              <GlassPanel style={[styles.metricCard, { borderColor: colors.primary + '33' }]}>
                <View style={[styles.cardGlow, { backgroundColor: colors.primary + '1A' }]} />
                <View style={styles.metricCardTop}>
                  <Receipt color={colors.primary} size={20} />
                  {stats && stats.kpis && (
                    <View style={[styles.trendBadge, { backgroundColor: (stats.kpis.invoicesChange ?? 0) >= 0 ? '#4ade801a' : colors.error + '1a' }]}>
                      {(stats.kpis.invoicesChange ?? 0) >= 0 ? (
                        <TrendingUp color="#4ade80" size={12} />
                      ) : (
                        <TrendingDown color={colors.error} size={12} />
                      )}
                      <Text style={[styles.trendBadgeText, { color: (stats.kpis.invoicesChange ?? 0) >= 0 ? '#4ade80' : colors.error }]}>
                        {formatChange(stats.kpis.invoicesChange ?? 0)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL INVOICES</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {stats?.kpis?.totalInvoices ?? 0}
                </Text>
              </GlassPanel>

              {/* Quotation Card */}
              <GlassPanel style={[styles.metricCard, { borderColor: colors.tertiary + '33' }]}>
                <View style={[styles.cardGlow, { backgroundColor: colors.tertiary + '1A' }]} />
                <View style={styles.metricCardTop}>
                  <FileText color={colors.tertiary} size={20} />
                  {stats && stats.kpis && (
                    <View style={[styles.trendBadge, { backgroundColor: (stats.kpis.quotationsChange ?? 0) >= 0 ? '#4ade801a' : colors.error + '1a' }]}>
                      {(stats.kpis.quotationsChange ?? 0) >= 0 ? (
                        <TrendingUp color="#4ade80" size={12} />
                      ) : (
                        <TrendingDown color={colors.error} size={12} />
                      )}
                      <Text style={[styles.trendBadgeText, { color: (stats.kpis.quotationsChange ?? 0) >= 0 ? '#4ade80' : colors.error }]}>
                        {formatChange(stats.kpis.quotationsChange ?? 0)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL QUOTATIONS</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {stats?.kpis?.totalQuotations ?? 0}
                </Text>
              </GlassPanel>

              {/* Sales Card */}
              <GlassPanel style={[styles.metricCard, { borderColor: colors.primary + '33' }]}>
                <View style={[styles.cardGlow, { backgroundColor: colors.primary + '1A' }]} />
                <View style={styles.metricCardTop}>
                  <Banknote color={colors.primary} size={20} />
                  {stats && stats.kpis && (
                    <View style={[styles.trendBadge, { backgroundColor: (stats.kpis.salesChange ?? 0) >= 0 ? '#4ade801a' : colors.error + '1a' }]}>
                      {(stats.kpis.salesChange ?? 0) >= 0 ? (
                        <TrendingUp color="#4ade80" size={12} />
                      ) : (
                        <TrendingDown color={colors.error} size={12} />
                      )}
                      <Text style={[styles.trendBadgeText, { color: (stats.kpis.salesChange ?? 0) >= 0 ? '#4ade80' : colors.error }]}>
                        {formatChange(stats.kpis.salesChange ?? 0)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL SALES</Text>
                <Text style={[styles.metricValue, { color: colors.text, fontSize: 18 }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(stats?.kpis?.totalSales ?? 0)}
                </Text>
              </GlassPanel>

              {/* Customers Card */}
              <GlassPanel style={[styles.metricCard, { borderColor: colors.tertiary + '33' }]}>
                <View style={[styles.cardGlow, { backgroundColor: colors.tertiary + '1A' }]} />
                <View style={styles.metricCardTop}>
                  <Users color={colors.tertiary} size={20} />
                  {stats && stats.kpis && (
                    <View style={[styles.trendBadge, { backgroundColor: (stats.kpis.customersChange ?? 0) >= 0 ? '#4ade801a' : colors.error + '1a' }]}>
                      {(stats.kpis.customersChange ?? 0) >= 0 ? (
                        <TrendingUp color="#4ade80" size={12} />
                      ) : (
                        <TrendingDown color={colors.error} size={12} />
                      )}
                      <Text style={[styles.trendBadgeText, { color: (stats.kpis.customersChange ?? 0) >= 0 ? '#4ade80' : colors.error }]}>
                        {formatChange(stats.kpis.customersChange ?? 0)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL CUSTOMERS</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {stats?.kpis?.totalCustomers ?? 0}
                </Text>
              </GlassPanel>
            </View>

            {/* Sales Trends Card — single combined chart for invoices + quotations */}
            <GlassPanelElevated style={styles.trendsCard}>
              <View style={styles.trendsHeader}>
                <View>
                  <Text style={[styles.trendsTitle, { color: colors.text }]}>Sales Trends</Text>
                  <Text style={[styles.trendsSubtitle, { color: colors.textSecondary }]}>Invoice vs Quotation Value</Text>
                </View>
                <View style={styles.trendsLegend}>
                  <View style={[styles.legendBadgePrimary, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '1A' }]}>
                    <View style={[styles.legendDotPrimary, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
                    <Text style={[styles.legendLabel, { color: colors.text }]}>INVOICES</Text>
                    <Text style={[styles.legendValuePrimary, { color: colors.primary }]}>
                      {formatCurrency(stats?.kpis?.totalSales ?? 0)}
                    </Text>
                  </View>
                  <View style={[styles.legendBadgeTertiary, { backgroundColor: colors.tertiary + '0D', borderColor: colors.tertiary + '1A' }]}>
                    <View style={[styles.legendDotTertiary, { backgroundColor: colors.tertiary, shadowColor: colors.tertiary }]} />
                    <Text style={[styles.legendLabel, { color: colors.text }]}>QUOTATIONS</Text>
                    <Text style={[styles.legendValueTertiary, { color: colors.tertiary }]}>
                      {formatCurrency(projectedQuotationsValue)}
                    </Text>
                  </View>
                </View>
              </View>

              <TrendChart data={stats?.salesTrend} />

              <View style={styles.chartXAxis}>
                {chartLabels.map((label, i) => (
                  <Text key={`${label}-${i}`} style={[styles.chartXLabel, { color: colors.textSecondary }]}>
                    {label}
                  </Text>
                ))}
              </View>
            </GlassPanelElevated>

            {/* Reminders Section — invoices and quotations combined into one list */}
            <GlassPanel style={styles.remindersCard}>
              <Text style={[styles.remindersTitle, { color: colors.text }]}>Reminders</Text>

              {reminders.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No reminders right now.
                </Text>
              ) : (
                <View style={styles.remindersList}>
                  {reminders.map((reminder) => (
                    <View
                      key={reminder.id}
                      style={[
                        styles.reminderItem,
                        { backgroundColor: isDark ? 'rgba(20, 28, 46, 0.3)' : 'rgba(255, 255, 255, 0.5)', borderColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.reminderIconWrapper,
                          { 
                            backgroundColor: reminder.kind === 'invoice' ? colors.error + '1A' : '#f59e0b1A',
                            borderColor: reminder.kind === 'invoice' ? colors.error + '33' : '#f59e0b33',
                            borderWidth: 1
                          },
                        ]}
                      >
                        {reminder.kind === 'invoice' ? (
                          <Receipt color={colors.error} size={20} />
                        ) : (
                          <Clock color="#f59e0b" size={20} />
                        )}
                      </View>
                      <View style={styles.reminderContent}>
                        <Text style={[styles.reminderTitleText, { color: colors.text }]}>{reminder.title}</Text>
                        <Text style={[styles.reminderSubtitleText, { color: colors.textSecondary }]}>
                          {reminder.subtitle}
                        </Text>
                      </View>
                      {reminder.isOverdue && (
                        <Text style={[styles.reminderPriority, { color: colors.error }]}>High</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </GlassPanel>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgEffectsWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  bgEffectTop: {
    position: 'absolute',
    top: -height * 0.05,
    left: -width * 0.05,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    transform: [{ scale: 1.5 }],
  },
  bgEffectBottom: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.05,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    transform: [{ scale: 1.5 }],
  },
  bgEffectMiddle: {
    position: 'absolute',
    top: height * 0.2,
    right: width * 0.1,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    transform: [{ scale: 1.5 }],
  },

  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 160,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 32 - 16) / 2, // 2 columns minus padding and gap
    overflow: 'hidden',
  },
  pageTitleContainer: {
    marginBottom: 24,
    marginTop: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 6,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.5,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  trendBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  metricSubtext: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 8,
  },
  trendsCard: {
    marginBottom: 16,
  },
  trendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  trendsSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    marginTop: 4,
  },
  trendsLegend: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  legendBadgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendBadgeTertiary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendDotPrimary: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  legendDotTertiary: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  legendValuePrimary: {
    fontSize: 10,
    fontWeight: '500',
  },
  legendValueTertiary: {
    fontSize: 10,
    fontWeight: '500',
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartXLabel: {
    fontSize: 12,
  },
  remindersCard: {
    marginBottom: 20,
  },
  remindersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  remindersList: {
    gap: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reminderIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reminderSubtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  reminderPriority: {
    fontSize: 12,
    fontWeight: '500',
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
  statusChipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtnInline: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterAccordion: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
});
