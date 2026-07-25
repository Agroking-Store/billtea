import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { AppHeader } from '../../../components/ui/AppHeader';

export default function CreateBranchScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Create Branch" />
      
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
          Create Branch Screen Placeholder
        </Text>
      </View>
    </View>
  );
}
