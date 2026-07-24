import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Home, Search, Filter } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

const HEADER_CONTENT_HEIGHT = 56;

interface AppHeaderProps {
  /** The page title to display */
  title: string;
  /** Called when the search icon is pressed. If omitted, the search icon is hidden. */
  onSearchPress?: () => void;
  /** Called when the filter icon is pressed. If omitted, the filter icon is hidden. */
  onFilterPress?: () => void;
  /** Whether search is currently active (highlights the icon) */
  searchActive?: boolean;
  /** Whether a filter is currently applied (highlights the icon) */
  filterActive?: boolean;
  /** When true, replaces the title with a search TextInput */
  showSearchInput?: boolean;
  /** Ref for the search TextInput */
  searchInputRef?: React.RefObject<TextInput | null>;
  /** Current search text value */
  searchText?: string;
  /** Called when search text changes */
  onSearchTextChange?: (text: string) => void;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Called when the search input loses focus */
  onSearchBlur?: () => void;
}

export function AppHeader({
  title,
  onSearchPress,
  onFilterPress,
  searchActive = false,
  filterActive = false,
  showSearchInput = false,
  searchInputRef,
  searchText = '',
  onSearchTextChange,
  searchPlaceholder = 'Search...',
  onSearchBlur,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const handleHomePress = () => {
    router.navigate('/(app)/dashboard');
  };

  const showRightActions = !!onFilterPress || !!onSearchPress;

  return (
    <View
      style={[
        styles.container,
        { 
          paddingTop: insets.top,
          backgroundColor: colors.glassBackground,
          borderBottomWidth: 1,
          borderBottomColor: colors.glassBorder,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left: Home button */}
        <Pressable
          onPress={handleHomePress}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
        >
          <Home size={22} color={colors.textSecondary} strokeWidth={2.2} />
        </Pressable>

        {/* Center: Title or Search Input */}
        <View style={styles.titleContainer}>
          {showSearchInput ? (
            <TextInput
              ref={searchInputRef}
              value={searchText}
              onChangeText={onSearchTextChange}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
              onBlur={onSearchBlur}
              style={[styles.searchInput, { color: colors.text }]}
            />
          ) : (
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        {/* Right: Filter + Search icons (only shown when callbacks are provided) */}
        {showRightActions && (
          <View style={styles.rightActions}>
            {onFilterPress && (
              <Pressable
                onPress={onFilterPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
              >
                <Filter
                  size={22}
                  color={filterActive ? colors.primary : colors.textSecondary}
                  strokeWidth={2.2}
                />
              </Pressable>
            )}
            {onSearchPress && (
              <Pressable
                onPress={onSearchPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
              >
                <Search
                  size={22}
                  color={searchActive ? colors.primary : colors.textSecondary}
                  strokeWidth={2.2}
                />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Dynamic styles moved inline or handled via theme
    zIndex: 10,
  },
  content: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(125, 211, 252, 0.1)',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    padding: 0,
    margin: 0,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
