import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { GlassPanelElevated } from '../../components/ui/GlassPanelElevated';
import { TrendChart } from '../../components/ui/TrendChart';
import { AppHeader } from '../../components/ui/AppHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Receipt, TrendingUp, TrendingDown, FileText, CircleAlert, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { apiClient } from '../../api/client';

const { width } = Dimensions.get('window');

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
  const [activeTab, setActiveTab] = useState<'Summary' | 'Trends'>('Summary');
  const { colors, isDark } = useTheme();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load branch first (same pattern used across the app)
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await apiClient.get('/branches');
        if (res.status === 200 && res.data?.success) {
          const loaded: Branch[] = Array.isArray(res.data.branches) ? res.data.branches : [];
          const mainBranch = loaded.find((b) => b.isMainBranch);
          setSelectedBranchId(mainBranch?.id ?? loaded[0]?.id ?? null);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
        setError('Could not load branch info.');
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  // Load dashboard stats once we know the branch
  useEffect(() => {
    if (!selectedBranchId) return;

    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/dashboard/stats', {
          params: { branchId: selectedBranchId },
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [selectedBranchId]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Decorative Background Effects */}
      <View style={styles.bgEffectsWrapper} pointerEvents="none">
        <View style={[styles.bgEffectTop, { backgroundColor: colors.primary + '1A' }]} />
        <View style={[styles.bgEffectBottom, { backgroundColor: colors.tertiary + '1A' }]} />
      </View>

      {/* Header */}
      <AppHeader title="Dashboard" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Controls */}
        <SegmentedControl
          options={['Summary', 'Trends']}
          activeOption={activeTab}
          onOptionChange={(opt) => setActiveTab(opt as typeof activeTab)}
        />

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
              <GlassPanel style={[styles.metricCard, { borderColor: colors.primary + '33', shadowColor: colors.primary }]}>
                <LinearGradient
                  colors={[colors.primary + '0D', 'transparent']}
                  style={[StyleSheet.absoluteFill, { opacity: 0.3, margin: -20 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.metricCardTop}>
                  <Receipt color={colors.primary} size={20} />
                  {stats && (
                    <View style={[styles.trendBadge, { backgroundColor: stats.kpis.invoicesChange >= 0 ? '#4ade801a' : colors.error + '1a' }]}>
                      {stats.kpis.invoicesChange >= 0 ? (
                        <TrendingUp color="#4ade80" size={12} />
                      ) : (
                        <TrendingDown color={colors.error} size={12} />
                      )}
                      <Text style={[styles.trendBadgeText, { color: stats.kpis.invoicesChange >= 0 ? '#4ade80' : colors.error }]}>
                        {formatChange(stats.kpis.invoicesChange)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL INVOICES</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {stats?.kpis.totalInvoices ?? 0}
                </Text>
                <Text style={[styles.metricSubtext, { color: colors.textSecondary }]}>
                  {formatCurrency(stats?.kpis.totalSales ?? 0)} Revenue
                </Text>
              </GlassPanel>

              {/* Quotation Card */}
              <GlassPanel style={[styles.metricCard, { borderColor: colors.tertiary + '33', shadowColor: colors.tertiary }]}>
                <LinearGradient
                  colors={[colors.tertiary + '0D', 'transparent']}
                  style={[StyleSheet.absoluteFill, { opacity: 0.3, margin: -20 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.metricCardTop}>
                  <FileText color={colors.tertiary} size={20} />
                  {stats && (
                    <View style={[styles.trendBadge, { backgroundColor: stats.kpis.quotationsChange >= 0 ? '#4ade801a' : colors.error + '1a' }]}>
                      {stats.kpis.quotationsChange >= 0 ? (
                        <TrendingUp color="#4ade80" size={12} />
                      ) : (
                        <TrendingDown color={colors.error} size={12} />
                      )}
                      <Text style={[styles.trendBadgeText, { color: stats.kpis.quotationsChange >= 0 ? '#4ade80' : colors.error }]}>
                        {formatChange(stats.kpis.quotationsChange)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL QUOTATIONS</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {stats?.kpis.totalQuotations ?? 0}
                </Text>
                <Text style={[styles.metricSubtext, { color: colors.textSecondary }]}>
                  {formatCurrency(projectedQuotationsValue)} Projected
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
                      {formatCurrency(stats?.kpis.totalSales ?? 0)}
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
                          { backgroundColor: reminder.isOverdue ? colors.error + '1A' : colors.primary + '1A' },
                        ]}
                      >
                        {reminder.isOverdue ? (
                          <CircleAlert color={colors.error} size={20} />
                        ) : (
                          <Calendar color={colors.primary} size={20} />
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
    top: -100,
    left: width * 0.1,
    width: 300,
    height: 300,
    borderRadius: 150,
    transform: [{ scale: 2 }],
  },
  bgEffectBottom: {
    position: 'absolute',
    bottom: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    transform: [{ scale: 1.5 }],
  },

  scrollContent: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 40,
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
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 48) / 2, // 2 columns minus padding
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
});
