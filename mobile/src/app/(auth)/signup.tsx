import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Building,
  CheckCircle,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Percent,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

interface TaxItem {
  label: string;
  percentage: number;
}

export default function SignupPage() {
  const router = useRouter();
  const { setAuthenticated, setUser } = useAuthStore();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Resend Timer for OTP
  const [resendTimer, setResendTimer] = useState<number>(0);

  // Form Data (Identical to Web Signup)
  const [formData, setFormData] = useState({
    // Step 1
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',

    // Step 2
    emailOtp: '',

    // Step 3
    fullName: '',

    // Step 4
    companyName: '',
    tagline: '',
    businessIdName: '',
    businessIdNumber: '',

    // Step 5
    branchName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    branchPhone: '',
    branchEmail: '',
    signatureText: '',
    taxes: [] as TaxItem[],

    // Step 6
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  // Temporary tax input state
  const [newTaxLabel, setNewTaxLabel] = useState('');
  const [newTaxPercentage, setNewTaxPercentage] = useState('');

  // Resend Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const updateData = (updates: Partial<typeof formData>) => {
    setError(null);
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Step 1 Validation & API call
  const validateAndSubmitStep1 = async () => {
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.mobileNumber.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Check duplicates first
      await authService.checkDuplicate(trimmedEmail, trimmedPhone);

      // Send Email OTP via Nodemailer
      await authService.sendOtp(trimmedEmail, trimmedPhone);

      setLoading(false);
      setResendTimer(30);
      setStep(2);
      return true;
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Validation failed. Please try again.';
      setError(msg);
      return false;
    }
  };

  // Step 2 OTP Verification
  const validateAndSubmitStep2 = async () => {
    if (!formData.emailOtp || formData.emailOtp.trim().length !== 6) {
      setError('Please enter the 6-digit email verification code.');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      await authService.verifyOtp(formData.emailOtp.trim(), formData.email.trim());

      setLoading(false);
      setStep(3);
      return true;
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired OTP.';
      setError(msg);
      return false;
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    try {
      setLoading(true);
      setError(null);
      await authService.sendOtp(formData.email.trim(), formData.mobileNumber.trim());
      setLoading(false);
      setResendTimer(30);
      setSuccessMsg('OTP code resent to your email address.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return false;
    }
    setStep(4);
    return true;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    if (!formData.companyName.trim()) {
      setError('Company Name is required.');
      return false;
    }
    setStep(5);
    return true;
  };

  // Step 5 Validation
  const validateStep5 = () => {
    if (!formData.branchName.trim()) {
      setError('Branch Name is required.');
      return false;
    }
    setStep(6);
    return true;
  };

  // Skip handler for optional setup steps
  const handleSkip = () => {
    setError(null);
    if (step === 4) {
      updateData({ companyName: formData.companyName || 'My Company' });
      setStep(5);
    } else if (step === 5) {
      updateData({ branchName: formData.branchName || 'Main Branch' });
      setStep(6);
    } else if (step === 6) {
      handleFinalSubmit();
    }
  };

  // Handle Tax Addition
  const handleAddTax = () => {
    if (!newTaxLabel.trim() || !newTaxPercentage.trim()) return;
    const pct = parseFloat(newTaxPercentage);
    if (isNaN(pct) || pct < 0) return;

    updateData({
      taxes: [...formData.taxes, { label: newTaxLabel.trim(), percentage: pct }],
    });
    setNewTaxLabel('');
    setNewTaxPercentage('');
  };

  const handleRemoveTax = (index: number) => {
    const updated = formData.taxes.filter((_, i) => i !== index);
    updateData({ taxes: updated });
  };

  // Next / Continue button router
  const handleNext = async () => {
    setError(null);
    if (step === 1) {
      await validateAndSubmitStep1();
    } else if (step === 2) {
      await validateAndSubmitStep2();
    } else if (step === 3) {
      validateStep3();
    } else if (step === 4) {
      validateStep4();
    } else if (step === 5) {
      validateStep5();
    }
  };

  // Final Registration Submission
  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        email: formData.email.trim(),
        phoneNumber: formData.mobileNumber.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        companyName: formData.companyName.trim() || 'My Company',
        tagline: formData.tagline.trim(),
        businessIdName: formData.businessIdName.trim(),
        businessIdNumber: formData.businessIdNumber.trim(),
        branchName: formData.branchName.trim() || 'Main Branch',
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        branchPhone: formData.branchPhone.trim(),
        branchEmail: formData.branchEmail.trim(),
        signatureText: formData.signatureText.trim(),
        taxes: formData.taxes,
        bankName: formData.bankName.trim(),
        accountName: formData.accountName.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim(),
        upiId: formData.upiId.trim(),
      };

      const res = await authService.register(payload);

      if (res?.user) {
        setUser(res.user);
      }
      setAuthenticated(true);

      setLoading(false);
      setSuccessMsg('Registration complete! Setting up your workspace...');

      setTimeout(() => {
        router.replace('/(app)/dashboard');
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      setError(msg);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Create Account';
      case 2:
        return 'Verify Email OTP';
      case 3:
        return 'User Profile';
      case 4:
        return 'Company Profile';
      case 5:
        return 'Branch Settings';
      case 6:
        return 'Bank Details';
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return 'Basic login and contact details';
      case 2:
        return `Code sent to ${formData.email || 'your email'}`;
      case 3:
        return 'Personal information';
      case 4:
        return 'Your business profile and branding';
      case 5:
        return 'Configure your primary branch';
      case 6:
        return 'Payment details for invoices';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Top Brand Header */}
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Sparkles size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.brandName}>BillTea</Text>
              <Text style={styles.tagline}>Business Suite Setup</Text>
            </View>

            {/* Main Form Card */}
            <View style={styles.card}>
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressStepText}>Step {step} of 6</Text>

                  {step > 1 && !successMsg && (
                    <Pressable
                      onPress={() => {
                        setError(null);
                        setStep((s) => s - 1);
                      }}
                      disabled={loading}
                      style={styles.backLink}
                    >
                      <ArrowLeft size={14} color={COLORS.primary} />
                      <Text style={styles.backLinkText}>Back</Text>
                    </Pressable>
                  )}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${(step / 6) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.title}>{getStepTitle()}</Text>
              <Text style={styles.subtitle}>{getStepSubtitle()}</Text>

              {/* Error Box */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Success Box */}
              {successMsg ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{successMsg}</Text>
                </View>
              ) : null}

              {/* Step Forms */}
              <View style={styles.form}>
                {/* STEP 1: Basic Details */}
                {step === 1 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Address</Text>
                      <View style={styles.inputContainer}>
                        <Mail size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="you@company.com"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.email}
                          onChangeText={(val) => updateData({ email: val })}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Mobile Number</Text>
                      <View style={styles.inputContainer}>
                        <Phone size={20} color={COLORS.muted} />
                        <Text style={styles.prefixText}>+91</Text>
                        <View style={styles.prefixDivider} />
                        <TextInput
                          style={styles.input}
                          placeholder="10-digit mobile number"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.mobileNumber}
                          onChangeText={(val) =>
                            updateData({ mobileNumber: val.replace(/\D/g, '') })
                          }
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.inputContainer}>
                        <LockKeyhole size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Min 6 characters"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.password}
                          onChangeText={(val) => updateData({ password: val })}
                          secureTextEntry={!showPassword}
                        />
                        <Pressable
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeButton}
                        >
                          {showPassword ? (
                            <EyeOff size={20} color={COLORS.muted} />
                          ) : (
                            <Eye size={20} color={COLORS.muted} />
                          )}
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={styles.inputContainer}>
                        <LockKeyhole size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Re-enter password"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.confirmPassword}
                          onChangeText={(val) =>
                            updateData({ confirmPassword: val })
                          }
                          secureTextEntry={!showConfirmPassword}
                        />
                        <Pressable
                          onPress={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          style={styles.eyeButton}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} color={COLORS.muted} />
                          ) : (
                            <Eye size={20} color={COLORS.muted} />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </>
                )}

                {/* STEP 2: Verify Email OTP */}
                {step === 2 && (
                  <>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>
                        We have sent a 6-digit verification OTP code to{' '}
                        <Text style={styles.highlightText}>
                          {formData.email}
                        </Text>
                        . Please check your inbox and enter the code below.
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Verification Code</Text>
                      <View style={styles.inputContainer}>
                        <ShieldCheck size={20} color={COLORS.muted} />
                        <TextInput
                          style={[styles.input, styles.otpInput]}
                          placeholder="6-digit code"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.emailOtp}
                          onChangeText={(val) =>
                            updateData({ emailOtp: val.replace(/\D/g, '') })
                          }
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>

                    <View style={styles.otpActionRow}>
                      <Pressable
                        onPress={() => {
                          setError(null);
                          setStep(1);
                        }}
                        disabled={loading}
                      >
                        <Text style={styles.actionText}>Change Email</Text>
                      </Pressable>

                      <Pressable
                        onPress={handleResendOtp}
                        disabled={resendTimer > 0 || loading}
                      >
                        <Text
                          style={[
                            styles.actionTextBold,
                            resendTimer > 0 && styles.disabledText,
                          ]}
                        >
                          {resendTimer > 0
                            ? `Resend in ${resendTimer}s`
                            : 'Resend OTP'}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}

                {/* STEP 3: User Profile */}
                {step === 3 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full Name *</Text>
                      <View style={styles.inputContainer}>
                        <User size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. John Doe"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.fullName}
                          onChangeText={(val) => updateData({ fullName: val })}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* STEP 4: Company Profile */}
                {step === 4 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Company / Business Name *</Text>
                      <View style={styles.inputContainer}>
                        <Building size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Acme Corporation"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.companyName}
                          onChangeText={(val) => updateData({ companyName: val })}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Business Tagline (Optional)</Text>
                      <View style={styles.inputContainer}>
                        <FileText size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Quality Billing Solutions"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.tagline}
                          onChangeText={(val) => updateData({ tagline: val })}
                        />
                      </View>
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>ID Type (Optional)</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. GSTIN"
                            placeholderTextColor={COLORS.placeholder}
                            value={formData.businessIdName}
                            onChangeText={(val) =>
                              updateData({ businessIdName: val })
                            }
                          />
                        </View>
                      </View>

                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>ID Number (Optional)</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. 27AAAAA0000A1Z5"
                            placeholderTextColor={COLORS.placeholder}
                            value={formData.businessIdNumber}
                            onChangeText={(val) =>
                              updateData({ businessIdNumber: val })
                            }
                          />
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {/* STEP 5: Branch Settings */}
                {step === 5 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Branch Name *</Text>
                      <View style={styles.inputContainer}>
                        <MapPin size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Head Office / Main Branch"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.branchName}
                          onChangeText={(val) => updateData({ branchName: val })}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Address (Optional)</Text>
                      <View style={styles.inputContainer}>
                        <MapPin size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Street address"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.address}
                          onChangeText={(val) => updateData({ address: val })}
                        />
                      </View>
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>City</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="City"
                            placeholderTextColor={COLORS.placeholder}
                            value={formData.city}
                            onChangeText={(val) => updateData({ city: val })}
                          />
                        </View>
                      </View>

                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>State</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="State"
                            placeholderTextColor={COLORS.placeholder}
                            value={formData.state}
                            onChangeText={(val) => updateData({ state: val })}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Pincode</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="Pincode"
                            placeholderTextColor={COLORS.placeholder}
                            value={formData.pincode}
                            onChangeText={(val) =>
                              updateData({ pincode: val.replace(/\D/g, '') })
                            }
                            keyboardType="number-pad"
                          />
                        </View>
                      </View>

                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Branch Phone</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="Branch phone"
                            placeholderTextColor={COLORS.placeholder}
                            value={formData.branchPhone}
                            onChangeText={(val) =>
                              updateData({ branchPhone: val })
                            }
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Branch Email</Text>
                      <View style={styles.inputContainer}>
                        <Mail size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="branch@company.com"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.branchEmail}
                          onChangeText={(val) =>
                            updateData({ branchEmail: val })
                          }
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    {/* Tax items manager */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Default Taxes (Optional)</Text>
                      <View style={styles.taxInputRow}>
                        <TextInput
                          style={[styles.input, styles.taxLabelInput]}
                          placeholder="Name (e.g. GST)"
                          placeholderTextColor={COLORS.placeholder}
                          value={newTaxLabel}
                          onChangeText={setNewTaxLabel}
                        />
                        <TextInput
                          style={[styles.input, styles.taxPctInput]}
                          placeholder="%"
                          placeholderTextColor={COLORS.placeholder}
                          value={newTaxPercentage}
                          onChangeText={setNewTaxPercentage}
                          keyboardType="numeric"
                        />
                        <Pressable onPress={handleAddTax} style={styles.addTaxBtn}>
                          <Plus size={18} color="#061622" />
                        </Pressable>
                      </View>

                      {formData.taxes.length > 0 && (
                        <View style={styles.taxList}>
                          {formData.taxes.map((t, idx) => (
                            <View key={idx} style={styles.taxChip}>
                              <Percent size={14} color={COLORS.primary} />
                              <Text style={styles.taxChipText}>
                                {t.label}: {t.percentage}%
                              </Text>
                              <Pressable onPress={() => handleRemoveTax(idx)}>
                                <Trash2 size={14} color={COLORS.error} />
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </>
                )}

                {/* STEP 6: Bank Details */}
                {step === 6 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Bank Name (Optional)</Text>
                      <View style={styles.inputContainer}>
                        <Landmark size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. HDFC Bank"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.bankName}
                          onChangeText={(val) => updateData({ bankName: val })}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Account Holder Name (Optional)</Text>
                      <View style={styles.inputContainer}>
                        <User size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Account Name"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.accountName}
                          onChangeText={(val) =>
                            updateData({ accountName: val })
                          }
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Account Number (Optional)</Text>
                      <View style={styles.inputContainer}>
                        <CreditCard size={20} color={COLORS.muted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Account Number"
                          placeholderTextColor={COLORS.placeholder}
                          value={formData.accountNumber}
                          onChangeText={(val) =>
                            updateData({ accountNumber: val })
                          }
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>IFSC Code</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="IFSC"
                            placeholderTextColor={COLORS.placeholder}
                            value={formData.ifscCode}
                            onChangeText={(val) =>
                              updateData({ ifscCode: val.toUpperCase() })
                            }
                            autoCapitalize="characters"
                          />
                        </View>
                      </View>

                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>UPI ID</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="username@upi"
                            placeholderTextColor={COLORS.placeholder}
                            value={formData.upiId}
                            onChangeText={(val) => updateData({ upiId: val })}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {/* Actions Bar */}
                <View style={styles.actionsRow}>
                  {step >= 4 && step <= 6 && !successMsg && (
                    <Pressable
                      onPress={handleSkip}
                      disabled={loading}
                      style={styles.skipButton}
                    >
                      <Text style={styles.skipButtonText}>Skip</Text>
                    </Pressable>
                  )}

                  {step < 6 ? (
                    <Pressable
                      onPress={handleNext}
                      disabled={loading}
                      style={[styles.primaryButton, loading && styles.disabledButton]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#061622" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Continue</Text>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleFinalSubmit}
                      disabled={loading || !!successMsg}
                      style={[
                        styles.primaryButton,
                        (loading || !!successMsg) && styles.disabledButton,
                      ]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#061622" />
                      ) : (
                        <View style={styles.buttonContentRow}>
                          <Text style={styles.primaryButtonText}>
                            Complete Setup
                          </Text>
                          <CheckCircle size={18} color="#061622" />
                        </View>
                      )}
                    </Pressable>
                  )}
                </View>

                {/* Link to Login on Step 1 */}
                {step === 1 && (
                  <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <Pressable onPress={() => router.push('/(auth)/login')}>
                      <Text style={styles.loginLink}>Login</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.footerText}>
              By continuing, you agree to BillTea's Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = {
  background: '#07101F',
  card: '#10192B',
  input: '#0B1424',
  border: 'rgba(255,255,255,0.10)',
  primary: '#67E8F9',
  text: '#F8FAFC',
  muted: '#94A3B8',
  placeholder: '#64748B',
  error: '#FCA5A5',
  errorBg: 'rgba(239,68,68,0.10)',
  errorBorder: 'rgba(239,68,68,0.25)',
  success: '#4ADE80',
  successBg: 'rgba(74,222,128,0.10)',
  successBorder: 'rgba(74,222,128,0.25)',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 50,
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.25)',
    marginBottom: 10,
  },

  brandName: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.4,
  },

  tagline: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },

  card: {
    width: '100%',
    borderRadius: 30,
    padding: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  progressContainer: {
    marginBottom: 20,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  progressStepText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
    marginBottom: 20,
    lineHeight: 20,
  },

  errorBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    marginBottom: 18,
  },

  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  successBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    marginBottom: 18,
  },

  successText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  infoBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.2)',
    marginBottom: 18,
  },

  infoText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },

  highlightText: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  form: {
    gap: 16,
  },

  inputGroup: {
    gap: 6,
  },

  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  inputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  input: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },

  prefixText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },

  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },

  otpInput: {
    letterSpacing: 8,
    fontSize: 18,
    fontWeight: '800',
  },

  eyeButton: {
    padding: 4,
  },

  otpActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -2,
  },

  actionText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  actionTextBold: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  disabledText: {
    color: COLORS.placeholder,
  },

  taxInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  taxLabelInput: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },

  taxPctInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },

  addTaxBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  taxList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },

  taxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(103,232,249,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.25)',
  },

  taxChipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  skipButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  skipButtonText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },

  primaryButton: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },

  disabledButton: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: '#061622',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },

  loginText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  loginLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  footerText: {
    marginTop: 24,
    textAlign: 'center',
    color: COLORS.placeholder,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
