import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  Crown,
  Headphones,
  Mail,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { useTheme } from '../../../hooks/useTheme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  // Prevent warning in New Architecture
  const isFabricEnabled = (global as any).nativeFabricUIManager != null;
  if (!isFabricEnabled) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type BillingType = 'monthly' | 'yearly';

type FAQItem = {
  question: string;
  answer: string;
};

const FAQS: FAQItem[] = [
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. You can cancel your subscription whenever you want. Your premium features remain available until the end of the current billing cycle.',
  },
  {
    question: 'Can I upgrade later?',
    answer:
      'Absolutely. You can switch from Free to Professional or Enterprise whenever your business grows.',
  },
  {
    question: 'Is GST included?',
    answer:
      'GST is applied according to local tax regulations and will be shown during checkout before payment.',
  },
];

function Feature({
  text,
}: {
  text: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.checkCircle,
          {
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Check size={12} color="#fff" />
      </View>

      <Text
        style={[
          styles.featureText,
          {
            color: colors.text,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function FAQAccordion({
  item,
}: {
  item: FAQItem;
}) {
  const { colors } = useTheme();

  const [expanded, setExpanded] = useState(false);

  const rotate = useRef(new Animated.Value(0)).current;
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly');

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    Animated.timing(rotate, {
      toValue: expanded ? 0 : 1,
      duration: 220,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    setExpanded(!expanded);
  };

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View
      style={[
        styles.faqCard,
        {
          backgroundColor: colors.glassBackground,
          borderColor: colors.glassBorder,
        },
      ]}
    >
      <Pressable onPress={toggle}>
        <View style={styles.faqHeader}>
          <Text
            style={[
              styles.faqQuestion,
              {
                color: colors.text,
              },
            ]}
          >
            {item.question}
          </Text>

          <Animated.View
            style={{
              transform: [{ rotate: rotation }],
            }}
          >
            <ChevronDown
              size={20}
              color={colors.primary}
            />
          </Animated.View>
        </View>

        {expanded && (
          <Text
            style={[
              styles.faqAnswer,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {item.answer}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

export default function PlanSubscriptionScreen() {
  const router = useRouter();

  const { colors } = useTheme();

  const [billing, setBilling] =
    useState<BillingType>('monthly');

  const translateX = useRef(new Animated.Value(0)).current;

  const monthlyPrice = useMemo(() => '₹299', []);

  const yearlyPrice = useMemo(() => '₹2,870', []);

  const switchBilling = (type: BillingType) => {
    if (type === billing) return;

    Animated.timing(translateX, {
      toValue: type === 'monthly' ? 0 : 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    setBilling(type);
  };

  const indicatorLeft = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.glassBorder,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor:
                colors.glassBackground,
                borderColor: colors.primary,
              },
            ]}
          >
            <ArrowLeft
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Plan & Subscription
          </Text>

          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Current Plan */}

          <View
            style={[
              styles.glassCard,
              {
                backgroundColor:
                colors.glassBackground,
                borderColor: colors.primary,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.spaceBetween}>
              <View>
                <Text
                  style={[
                    styles.planTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Free Plan
                </Text>

                <Text
                  style={[
                    styles.planPrice,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  ₹0
                </Text>

                <Text
                  style={[
                    styles.planDuration,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Forever Free
                </Text>
              </View>

              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor:
                      colors.primary,
                  },
                ]}
              >
                <BadgeCheck
                  size={14}
                  color="#fff"
                />

                <Text
                  style={styles.activeText}
                >
                  Active
                </Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              <Feature text="Unlimited Customers" />
              <Feature text="Unlimited Products" />
              <Feature text="Unlimited Invoices" />
              <Feature text="GST Billing" />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Current Plan
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionSpacing}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Upgrade Your Experience
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Choose the perfect plan for your
              business.
            </Text>
          </View>

          {/* Billing Toggle */}

          <View
            style={[
              styles.segmentWrapper,
              {
                backgroundColor:
                  colors.surfaceVariant,
                borderColor:
                  colors.glassBorder,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.segmentIndicator,
                {
                  backgroundColor:
                    colors.primary,
                  left: indicatorLeft,
                },
              ]}
            />

            <Pressable
              onPress={() =>
                switchBilling('monthly')
              }
              style={styles.segmentItem}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      billing ===
                      'monthly'
                        ? '#fff'
                        : colors.text,
                  },
                ]}
              >
                Monthly
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                switchBilling('yearly')
              }
              style={styles.segmentItem}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      billing ===
                      'yearly'
                        ? '#fff'
                        : colors.text,
                  },
                ]}
              >
                Yearly (-20%)
              </Text>
            </Pressable>
          </View>
                    {/* Professional Plan */}

          <View
            style={[
              styles.premiumCard,
              {
                backgroundColor: colors.glassBackground,
                borderColor: colors.primary,
                shadowColor: colors.shadow,
              },
            ]}
          >

            <View style={styles.planHeader}>
              <View>
                <Text
                  style={[
                    styles.planTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Professional
                </Text>

                <Text
                  style={[
                    styles.planPrice,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  {billing === 'monthly'
                    ? monthlyPrice
                    : yearlyPrice}
                </Text>

                <Text
                  style={[
                    styles.planDuration,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {billing === 'monthly'
                    ? '/month'
                    : '/year'}
                </Text>
              </View>

              <View
                style={[
                  styles.crownContainer,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Crown
                  size={22}
                  color="#fff"
                />
              </View>
            </View>

            <View style={styles.featuresContainer}>
              <Feature text="Unlimited Invoices" />
              <Feature text="Unlimited Customers" />
              <Feature text="Unlimited Products" />
              <Feature text="Multi Branch" />
              <Feature text="Advanced Analytics" />
              <Feature text="Priority Support" />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}
            >
              <Text
                style={styles.primaryButtonText}
              >
                Upgrade Now
              </Text>
            </TouchableOpacity>
          </View>

          {/* Enterprise */}

          <View
            style={[
              styles.glassCard,
              {
                backgroundColor:
                  colors.glassBackground,
                borderColor:
                  colors.primary,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View>
                <Text
                  style={[
                    styles.planTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Enterprise Plan
                </Text>

                <Text
                  style={[
                    styles.planPrice,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Custom Pricing
                </Text>

                <Text
                  style={[
                    styles.planDuration,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Built for large teams
                </Text>
              </View>

              <View
                style={[
                  styles.enterpriseIcon,
                  {
                    backgroundColor:
                      colors.surfaceVariant,
                  },
                ]}
              >
                <Building2
                  size={22}
                  color={colors.primary}
                />
              </View>
            </View>

            <View style={styles.featuresContainer}>
              <Feature text="Everything in Professional" />
              <Feature text="Unlimited Staff" />
              <Feature text="API Access" />
              <Feature text="Custom Branding" />
              <Feature text="Dedicated Support" />
            </View>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor:
                    colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Contact Sales
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add-ons */}

          <Text
            style={[
              styles.blockTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Available Add-ons
          </Text>

          <View
            style={[
              styles.addonCard,
              {
                backgroundColor:
                  colors.glassBackground,
                borderColor:
                  colors.glassBorder,
              },
            ]}
          >
            <View style={styles.addonLeft}>
              <View
                style={[
                  styles.addonIcon,
                  {
                    backgroundColor:
                      colors.surfaceVariant,
                  },
                ]}
              >
                <Users
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text
                  style={[
                    styles.addonTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Extra User
                </Text>

                <Text
                  style={[
                    styles.addonPrice,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  ₹99 / month
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.plusButton,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}
            >
              <Plus
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.addonCard,
              {
                backgroundColor:
                  colors.glassBackground,
                borderColor:
                  colors.glassBorder,
              },
            ]}
          >
            <View style={styles.addonLeft}>
              <View
                style={[
                  styles.addonIcon,
                  {
                    backgroundColor:
                      colors.surfaceVariant,
                  },
                ]}
              >
                <Building2
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text
                  style={[
                    styles.addonTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Extra Branch
                </Text>

                <Text
                  style={[
                    styles.addonPrice,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  ₹199 / month
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.plusButton,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}
            >
              <Plus
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* FAQ */}

          <Text
            style={[
              styles.blockTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Frequently Asked Questions
          </Text>

          {FAQS.map((item, index) => (
           <FAQAccordion
            key={index}
            item={item}
          />
          ))}

          {/* Help */}

          <View
            style={[
              styles.helpCard,
              {
                backgroundColor:
                  colors.glassBackground,
                borderColor:
                  colors.glassBorder,
              },
            ]}
          >
            <View
              style={[
                styles.helpIcon,
                {
                  backgroundColor:
                    colors.surfaceVariant,
                },
              ]}
            >
              <Headphones
                size={22}
                color={colors.primary}
              />
            </View>

            <Text
              style={[
                styles.helpTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Need Help?
            </Text>

            <Text
              style={[
                styles.helpSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Our team is always ready to
              assist you.
            </Text>

            <View
              style={[
                styles.mailRow,
                {
                  borderColor:
                    colors.glassBorder,
                  backgroundColor:
                    colors.surfaceVariant,
                },
              ]}
            >
              <Mail
                size={18}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.mailText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                support@billtea.com
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  sectionSpacing: {
    marginTop: 30,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },

  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },

  blockTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 32,
    marginBottom: 18,
  },

  glassCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 18,
  },

  premiumCard: {
    borderRadius: 28,
    borderWidth: 2,
    padding: 22,
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.16,
    shadowRadius: 25,
    elevation: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },

  popularBadge: {
    position: 'absolute',
    right: 18,
    top: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  popularBadgeText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 6,
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },

  activeText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 12,
  },

  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  planTitle: {
    fontSize: 24,
    fontWeight: '700',
  },

  planPrice: {
    fontSize: 42,
    fontWeight: '800',
    marginTop: 10,
  },

  planDuration: {
    fontSize: 15,
    marginTop: 4,
  },

  crownContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },

  enterpriseIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },

  featuresContainer: {
    marginTop: 22,
    marginBottom: 10,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  featureText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },

  primaryButton: {
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },

  segmentWrapper: {
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 28,
  },

  segmentIndicator: {
    position: 'absolute',
    width: '50%',
    top: 0,
    bottom: 0,
    borderRadius: 18,
  },

  segmentItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  segmentText: {
    fontSize: 15,
    fontWeight: '700',
  },

  addonCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  addonIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  addonTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  addonPrice: {
    marginTop: 5,
    fontSize: 14,
  },

  plusButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },

  faqCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },

  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },

  faqAnswer: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 22,
  },

  helpCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 30,
  },

  helpIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  helpTitle: {
    fontSize: 22,
    fontWeight: '700',
  },

  helpSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },

  mailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  mailText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
});