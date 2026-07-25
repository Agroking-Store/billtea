import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Phone, Eye, Edit2, Trash2, Plus } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { GlassPanel } from '../../../components/ui/GlassPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../../components/ui/AppHeader';
import { apiClient } from '../../../api/client';
type Branch = {
  id: string;
  name: string;
  isMainBranch: boolean;
};

export default function BranchSettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBranches() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/branches');
        if (res.status === 200 && res.data?.success) {
          setBranches(Array.isArray(res.data.branches) ? res.data.branches : []);
        } else {
          setError('Could not load branches.');
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
        setError('Could not load branches.');
      } finally {
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? ['#081326', '#111b2f'] : [colors.background, colors.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <AppHeader title="Branch Management" />

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 24, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionBar}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              {loading ? 'Loading branches...' : `${branches.length} Branches configured`}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your business locations</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings/create-branch')}
            style={[styles.addButton, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '4D' }]}
          >
            <Plus color={colors.primary} size={20} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Branch</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
            <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : branches.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No branches yet.</Text>
        ) : (
          <View style={styles.branchList}>
            {branches.map((branch) => (
              <GlassPanel key={branch.id} style={styles.branchCard}>
                {branch.isMainBranch && (
                  <LinearGradient
                    colors={[colors.primary, colors.tertiary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.mainHighlight}
                  />
                )}

                <View style={styles.cardHeader}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.branchName, { color: colors.text }]}>{branch.name}</Text>
                    {branch.isMainBranch && (
                      <View style={[styles.mainBadge, { backgroundColor: colors.primary + '4D', borderColor: colors.primary + '33' }]}>
                        <Text style={[styles.mainBadgeText, { color: colors.primary }]}>MAIN</Text>
                      </View>
                    )}
                  </View>
                  {/* City/phone aren't returned by the API yet, so this row is left out for now */}
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.primary + '1A' }]}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant + '80' }]}>
                      <Eye color={colors.textSecondary} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant + '80' }]}>
                      <Edit2 color={colors.textSecondary} size={18} />
                    </TouchableOpacity>
                    {!branch.isMainBranch && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant + '80' }]}>
                        <Trash2 color={colors.error} size={18} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </GlassPanel>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: 'rgba(125, 211, 252, 0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
  branchList: {
    gap: 16,
  },
  branchCard: {
    // Optional additional card styling
  },
  mainHighlight: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 4,
    opacity: 0.7,
  },
  cardHeader: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  branchName: {
    fontSize: 20,
    fontWeight: '600',
  },
  mainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
  },
});
