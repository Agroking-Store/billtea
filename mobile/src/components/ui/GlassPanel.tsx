import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';

export function GlassPanel({ children, style, ...props }: ViewProps) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[styles.wrapper, { borderColor: colors.glassBorder }, style]} {...props}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: 16, overflow: 'hidden' }]} pointerEvents="none">
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <View style={[styles.overlay, { backgroundColor: colors.glassBackground }]} />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    borderWidth: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    padding: 20,
    flex: 1,
  },
});
