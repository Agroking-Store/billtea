import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Building2 } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface ProfileHeaderProps {
  name: string;
  role: string;
  avatarUri?: string;
  planName: string;
  onEditPress: () => void;
}

export default function ProfileHeader({
  name,
  role,
  avatarUri,
  planName,
  onEditPress,
}: ProfileHeaderProps) {
  const { colors, isDark } = useTheme();

  let badgeColor = colors.primary;
  let badgeIcon: any = 'verified';
  const planUpper = planName.toUpperCase();
  
  if (planUpper.includes('EXPIRED')) {
    badgeColor = colors.error || '#EF4444';
    badgeIcon = 'error-outline';
  } else if (planUpper.includes('GOLD')) {
    badgeColor = '#FBBF24'; // Gold
  } else if (planUpper.includes('SILVER')) {
    badgeColor = '#94A3B8'; // Silver
  } else if (planUpper.includes('BRONZE')) {
    badgeColor = '#B45309'; // Bronze
  }

  return (
    <View style={styles.container}>
      {/* Avatar Container with Ice-Blue Glowing Border */}
      <View style={styles.avatarWrapper}>
        <LinearGradient
          colors={[colors.primary + '80', colors.tertiary + '40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBorder, { shadowColor: colors.primary }]}
        >
          <View style={[styles.avatarInnerContainer, { borderColor: colors.background, backgroundColor: colors.surface }]}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceVariant }]}>
                <Building2 color={colors.primary} size={48} opacity={0.5} />
              </View>
            )}
            
            {/* Edit Button Badge */}
            <Pressable
              onPress={onEditPress}
              style={({ pressed }) => [
                styles.editButton,
                pressed && { backgroundColor: colors.primary },
                { backgroundColor: colors.surfaceVariant, borderColor: colors.glassBorder }
              ]}
            >
              {Platform.OS === 'ios' && (
                <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
              )}
              <MaterialIcons name="edit" size={14} color={colors.primary} />
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      {/* Name and Designation */}
      <Text style={[styles.nameText, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.roleText, { color: colors.textSecondary }]}>{role}</Text>

      {/* Premium Plan Badge */}
      <View style={[styles.badgeWrapper, { borderColor: badgeColor + '40' }]}>
        <LinearGradient
          colors={[badgeColor + '26', badgeColor + '0D']}
          style={styles.badgeGradient}
        >
          <View style={styles.badgeContent}>
            <MaterialIcons name={badgeIcon} size={14} color={badgeColor} style={styles.verifiedIcon} />
            <Text style={[styles.badgeText, { color: badgeColor }]}>{planName}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    width: '100%',
  },
  avatarWrapper: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 16,
  },
  gradientBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 62,
    borderWidth: 2,
    position: 'relative',
    overflow: 'visible', // allow edit badge to position slightly outer if needed
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    overflow: 'hidden',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  badgeWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  badgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
