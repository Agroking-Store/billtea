import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Alert,
} from 'react-native';

import { BlurView } from 'expo-blur';
import {
  FileText,
  Package,
  Plus,
  BarChart3,
  Settings,
  Receipt,
  Wallet,
  Crown,
} from "lucide-react-native";
import Svg, { Path } from 'react-native-svg';
import { useUiStore } from '../../app/(app)/products';
import { useTheme } from "../../hooks/useTheme";

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const requestQuickAdd = useUiStore((store) => store.requestQuickAdd);
  const [isFabExpanded, setIsFabExpanded] = React.useState(false);
  const animation = React.useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();

  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key]?.options;
  const currentRouteName = focusedRoute?.name;

  if (
    focusedOptions?.tabBarStyle?.display === 'none' ||
    currentRouteName?.includes('create') ||
    currentRouteName?.startsWith('create-')
  ) {
    return null;
  }
 const fabMode =
  currentRouteName === "dashboard" || currentRouteName === "quotations"
    ? "quotation"
    : currentRouteName === "products"
    ? "products"
    : currentRouteName === "reports"
    ? "reports"
    : currentRouteName === "settings"
    ? "settings"
    : null;
  const isDashboardOrQuotation = fabMode === "quotation";
 const handleQuickAddPress = () => {
  const toValue = isFabExpanded ? 0 : 1;

  Animated.spring(animation, {
    toValue,
    friction: 5,
    useNativeDriver: true,
  }).start();

  setIsFabExpanded(!isFabExpanded);
};
  const invoiceAnimatedStyle = {
    opacity: animation,
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: 48,
    height: 48,
    zIndex: 10,
    transform: [
      { scale: animation },
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -70] }) }
    ],
  };

  const quotationAnimatedStyle = {
    opacity: animation,
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: 48,
    height: 48,
    zIndex: 10,
    transform: [
      { scale: animation },
      { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -65] }) },
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -35] }) }
    ],
  };

  const expenseAnimatedStyle = {
    opacity: animation,
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: 48,
    height: 48,
    zIndex: 10,
    transform: [
      { scale: animation },
      { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 65] }) },
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -35] }) }
    ],
  };

  const mainButtonAnimatedStyle = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '45deg'],
        })
      }
    ]
  };

  const labelOpacity = animation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 0, 1],
  });

  

  const hiddenRoutes = ['create-quotation', 'create-invoice', 'create-expense', 'create-customer'];
  if (hiddenRoutes.includes(currentRouteName)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBackgroundWrapper}>
        <Svg width="100%" height="100%" viewBox="0 0 400 48" preserveAspectRatio="none">
          <Path
            d="M0 24C0 10.7452 10.7452 0 24 0H140C145 0 155 2 160 6C175 20 180 32 200 32C220 32 225 20 240 6C245 2 255 0 260 0H376C389.255 0 400 10.7452 400 24V24C400 37.2548 389.255 48 376 48H24C10.7452 48 0 37.2548 0 24V24Z"
            fill="rgba(20, 28, 46, 0.5)"
          />
          <Path
            d="M0 24C0 10.7452 10.7452 0 24 0H140C145 0 155 2 160 6C175 20 180 32 200 32C220 32 225 20 240 6C245 2 255 0 260 0H376C389.255 0 400 10.7452 400 24V24C400 37.2548 389.255 48 376 48H24C10.7452 48 0 37.2548 0 24V24Z"
            stroke="rgba(125, 211, 252, 0.2)"
            strokeWidth="1"
          />
        </Svg>
        <BlurView
          intensity={20}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.tabContent}>
        {state.routes.map((route: any, index: number) => {
          const allowedTabs = ['quotations', 'products', 'dummy', 'reports', 'settings'];
          if (!allowedTabs.includes(route.name)) return null;

          const isFocused = state.index === index;
          const color = isFocused
          ? colors.primary
          : colors.textSecondary;

          const onPress = () => {
            if (route.name === 'dummy') return; // Do nothing for center dummy tab

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (route.name === 'dummy') {
            return (
              <View key={route.key} style={styles.fabContainer}>
                <View style={{ position: 'relative' }}>
                  {fabMode === "quotation" && (
                    <>
                      <Animated.View style={invoiceAnimatedStyle} pointerEvents={isFabExpanded ? 'box-none' : 'none'}>
                        <Animated.View style={[styles.fabActionLabel, {backgroundColor: colors.surfaceVariant, position: 'absolute', left: -18, top: -36, width: 85, opacity: labelOpacity }]}>
                          <Text  style={[
                          styles.fabActionLabelText,
                          {
                            color: colors.text,
                          },
                        ]}numberOfLines={1}>Invoice</Text>
                        </Animated.View>
                        <TouchableOpacity style={[
                          styles.fabActionButton,
                          {
                            backgroundColor: colors.surface,
                          },
                        ]} onPress={() => { handleQuickAddPress(); navigation.navigate('create-invoice'); }}>
                          <Receipt color={colors.primary}size={24} />
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View style={quotationAnimatedStyle} pointerEvents={isFabExpanded ? 'box-none' : 'none'}>
                        <Animated.View style={[styles.fabActionLabel, { backgroundColor: colors.surfaceVariant,position: 'absolute', right: 50, top: 12, width: 85, opacity: labelOpacity }]}>
                          <Text  style={[
                          styles.fabActionLabelText,
                          {
                            color: colors.text,
                          },
                        ]} numberOfLines={1}>Quotation</Text>
                        </Animated.View>
                        <TouchableOpacity style={[
                          styles.fabActionButton,
                          {
                            backgroundColor: colors.surface,
                          },
                        ]} onPress={() => { handleQuickAddPress(); navigation.navigate('create-quotation'); }}>
                          <FileText color={colors.primary} size={24} />
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View style={expenseAnimatedStyle} pointerEvents={isFabExpanded ? 'box-none' : 'none'}>
                        <Animated.View style={[styles.fabActionLabel, { backgroundColor: colors.surfaceVariant,position: 'absolute', left: 50, top: 12, width: 85, opacity: labelOpacity }]}>
                                                <Text  style={[
                          styles.fabActionLabelText,
                          {
                            color: colors.text,
                          },
                        ]} numberOfLines={1}>Expense</Text>
                        </Animated.View>
                        <TouchableOpacity style={[
                          styles.fabActionButton,
                          {
                            backgroundColor: colors.surface,
                          },
                        ]} onPress={() => { handleQuickAddPress(); navigation.navigate('create-expense'); }}>
                          <Wallet color={colors.primary} size={24} />
                        </TouchableOpacity>
                      </Animated.View>
                    </>
                  )}

                  {fabMode === "products" && (
                    <>
                      <Animated.View
                        style={quotationAnimatedStyle}
                        pointerEvents={isFabExpanded ? "box-none" : "none"}
                      >
                        <Animated.View
                          style={[
                            styles.fabActionLabel,
                            {
                              backgroundColor: colors.surfaceVariant,
                              position: "absolute",
                              right: 50,
                              top: 12,
                              width: 85,
                              opacity: labelOpacity,
                            },
                          ]}
                        >
                          <Text  style={[
                            styles.fabActionLabelText,
                            {
                              color: colors.text,
                            },
                          ]}>Create Product</Text>
                        </Animated.View>

                        <TouchableOpacity
                           style={[
                            styles.fabActionButton,
                            {
                              backgroundColor: colors.surface,
                            },
                          ]}
                         onPress={() => {
                            handleQuickAddPress();

                            requestQuickAdd("products", "products");

                            navigation.navigate("products");
                          }}
                        >
                          <Package color={colors.primary} size={24} />
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View
                        style={expenseAnimatedStyle}
                        pointerEvents={isFabExpanded ? "box-none" : "none"}
                      >
                        <Animated.View
                          style={[
                            styles.fabActionLabel,
                            {
                              backgroundColor: colors.surfaceVariant,
                              position: "absolute",
                              left: 50,
                              top: 12,
                              width: 88,
                              opacity: labelOpacity,
                            },
                          ]}
                        >
                          <Text  style={[
                            styles.fabActionLabelText,
                            {
                              color: colors.text,
                            },
                          ]}>Create Customer</Text>
                        </Animated.View>

                        <TouchableOpacity
                           style={[
                            styles.fabActionButton,
                            {
                              backgroundColor: colors.surface,
                            },
                          ]}
                          onPress={() => {
                            handleQuickAddPress();

                            requestQuickAdd("products", "customers");

                            navigation.navigate("products");
                          }}
                        >
                          <FileText color={colors.primary} size={24} />
                        </TouchableOpacity>
                      </Animated.View>
                    </>
                  )}

                  {fabMode === "reports" && (
                <>
                  <Animated.View
                    style={quotationAnimatedStyle}
                    pointerEvents={isFabExpanded ? "box-none" : "none"}
                  >
                    <Animated.View
                      style={[
                        styles.fabActionLabel,
                        {
                          backgroundColor: colors.surfaceVariant,
                          position: "absolute",
                          right: 50,
                          top: 12,
                          width: 85,
                          opacity: labelOpacity,
                        },
                      ]}
                    >
                      <Text
                        style={[
                        styles.fabActionLabelText,
                        {
                        color: colors.text,
                        },
                        ]}

                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        Profit
                      </Text>
                    </Animated.View>

                    <TouchableOpacity
                       style={[
                          styles.fabActionButton,
                          {
                            backgroundColor: colors.surface,
                          },
                        ]}
                      onPress={() => {
                        handleQuickAddPress();
                        Alert.alert("Download Profit Report");
                      }}
                    >
                      <BarChart3 color={colors.primary} size={24} />
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View
                    style={expenseAnimatedStyle}
                    pointerEvents={isFabExpanded ? "box-none" : "none"}
                  >
                    <Animated.View
                      style={[
                        styles.fabActionLabel,
                        {
                          backgroundColor: colors.surfaceVariant,
                          position: "absolute",
                          left: 50,
                          top: 12,
                          width: 88,
                          opacity: labelOpacity,
                        },
                      ]}
                    >
                      <Text
                                              
                        style={[
                          styles.fabActionLabelText,
                          {
                            color: colors.text,
                          },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        Sales
                      </Text>
                    </Animated.View>

                    <TouchableOpacity
                       style={[
                          styles.fabActionButton,
                          {
                            backgroundColor: colors.surface,
                          },
                        ]}
                      onPress={() => {
                        handleQuickAddPress();
                        Alert.alert("Download Sales Report");
                      }}
                    >
                      <BarChart3 color={colors.primary} size={24} />
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
              
              {fabMode === "settings" ? (
                      <TouchableOpacity
                        style={[
                          styles.fabButton,
                          { backgroundColor: colors.primary },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          Alert.alert("Upgrade Plan");
                          // navigation.navigate("subscription");
                        }}
                      >
                        <Crown
                          color={isDark ? "#001F2E" : "#FFFFFF"}
                          size={24}
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.fabButton,
                          { backgroundColor: colors.primary },
                        ]}
                        activeOpacity={0.8}
                        onPress={handleQuickAddPress}
                      >
                        <Animated.View
                          style={isDashboardOrQuotation ? mainButtonAnimatedStyle : {}}
                        >
                          <Plus
                            color={isDark ? "#001F2E" : "#FFFFFF"}
                            size={24}
                            strokeWidth={3}
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            );
          }

          let Icon = FileText;
          if (route.name === 'quotations') Icon = FileText;
          if (route.name === 'products') Icon = Package;
          if (route.name === 'reports') Icon = BarChart3;
          if (route.name === 'settings') Icon = Settings;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Icon color={color} size={24} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    height: 60,
    zIndex: 50,
  },
  tabBackgroundWrapper: {
    ...StyleSheet.absoluteFill,
    borderRadius: 30,
    overflow: 'hidden',
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    zIndex: 20,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
    shadowColor: '#7dd3fc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  fabActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.3)',
  },
  fabActionLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.2)',
    justifyContent: 'center',
  },
  fabActionLabelText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
