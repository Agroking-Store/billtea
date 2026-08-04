import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { Moon, Sun } from 'lucide-react-native';

import { AppHeader } from '../../../components/ui/AppHeader';
import { useTheme } from '../../../hooks/useTheme';
import DashboardTheme from '../../../components/theme/DashboardTheme';
import QuotationTheme from '../../../components/theme/QuotationTheme';

export default function ThemeSettingsScreen() {
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'quotation'>(
    'dashboard'
  );

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppHeader title="Theme Settings" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={[styles.heading, { color: colors.text }]}>
            Theme Settings
          </Text>

          <Text
            style={[styles.subHeading, { color: colors.textSecondary }]}
          >
            Customize dashboard and quotation appearance
          </Text>

          {/* Tabs */}

          <View
            style={[
              styles.tabs,
              {
                backgroundColor: colors.glassBackground,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <Pressable
              onPress={() => setActiveTab('dashboard')}
              style={[
                styles.tab,
                activeTab === 'dashboard' && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'dashboard'
                        ? '#fff'
                        : colors.textSecondary,
                  },
                ]}
              >
                Dashboard
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('quotation')}
              style={[
                styles.tab,
                activeTab === 'quotation' && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'quotation'
                        ? '#fff'
                        : colors.textSecondary,
                  },
                ]}
              >
                Quotation
              </Text>
            </Pressable>
          </View>

          {/* Theme Mode */}

          <View
            style={[
              styles.modeContainer,
              {
                backgroundColor: colors.glassBackground,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <Pressable
              onPress={() => setThemeMode('dark')}
              style={[
                styles.modeButton,
                themeMode === 'dark' && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Moon
                size={18}
                color={
                  themeMode === 'dark'
                    ? '#fff'
                    : colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      themeMode === 'dark'
                        ? '#fff'
                        : colors.textSecondary,
                  },
                ]}
              >
                Dark
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setThemeMode('light')}
              style={[
                styles.modeButton,
                themeMode === 'light' && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Sun
                size={18}
                color={
                  themeMode === 'light'
                    ? '#fff'
                    : colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      themeMode === 'light'
                        ? '#fff'
                        : colors.textSecondary,
                  },
                ]}
              >
                Light
              </Text>
            </Pressable>
            
          </View>

 {activeTab === 'dashboard' && (
  <DashboardTheme colors={colors} />
)}

{activeTab === 'quotation' && (
  <QuotationTheme colors={colors} />
)}
</ScrollView>
</SafeAreaView>
</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  heading: {
    fontSize: 24,
    fontWeight: '700',
  },

  subHeading: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },

  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },

  tab: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },

  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },

  modeContainer: {
    flexDirection: 'row',
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },

  modeButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  modeText: {
    marginLeft: 6,
    fontWeight: '600',
  },
});

