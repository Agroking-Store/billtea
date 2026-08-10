import React, { useState, useEffect } from 'react';
import { Image } from "react-native";
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
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowLeft,
  CheckCircle,
  Send,
  KeyRound,
  ShieldCheck,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';

export default function LoginScreen() {
  
  const router = useRouter();
  const { setAuthenticated, setUser } = useAuthStore();

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend Timer Effect for OTP
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

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const validateForm = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setError('Please enter both email and password.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (loading) return;
    setError('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      const data = await authService.login(email.trim(), password);

      if (data?.user) {
        setUser(data.user);
      }

      setAuthenticated(true);
      router.replace('/(app)/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please try again.';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupPress = () => {
    router.push('/(auth)/signup');
  };

  const handleForgotPasswordPress = () => {
    setIsForgotPasswordMode(true);
    setForgotStep(1);
    setForgotEmail(email);
    setForgotError('');
    setForgotSuccessMsg('');
  };

  const switchToLogin = () => {
    setIsForgotPasswordMode(false);
    setForgotStep(1);
    setForgotError('');
    setForgotSuccessMsg('');
    setError('');
    if (forgotEmail) {
      setEmail(forgotEmail);
    }
  };

  // Step 1: Send OTP
  const handleSendForgotPasswordOtp = async () => {
    if (forgotLoading) return;
    setForgotError('');
    setForgotSuccessMsg('');

    const trimmedEmail = forgotEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await authService.sendForgotPasswordOtp(trimmedEmail);

      if (res?.success === false) {
        setForgotError(res.message || 'Failed to send OTP. Please check your email.');
        return;
      }

      setForgotSuccessMsg('OTP sent to your email address.');
      setForgotStep(2);
      setResendTimer(60);
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send OTP. Please try again.';
      setForgotError(errMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyForgotPasswordOtp = async () => {
    if (forgotLoading) return;
    setForgotError('');
    setForgotSuccessMsg('');

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Please enter the 6-digit OTP code.');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await authService.verifyForgotPasswordOtp(forgotEmail.trim(), cleanOtp);

      if (res?.success === false) {
        setForgotError(res.message || 'Invalid OTP code.');
        return;
      }

      setForgotSuccessMsg('OTP verified successfully.');
      setForgotStep(3);
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid OTP code.';
      setForgotError(errMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (forgotLoading) return;
    setForgotError('');
    setForgotSuccessMsg('');

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await authService.resetPassword(
        forgotEmail.trim(),
        forgotOtp.trim(),
        newPassword
      );

      if (res?.success === false) {
        setForgotError(res.message || 'Failed to reset password.');
        return;
      }

      setForgotStep(4);
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reset password. Please try again.';
      setForgotError(errMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.container}>
            <View style={styles.header}>
             
<View style={styles.logoBox}>
  <Image
    source={require("../../../assets/images/Billtea-white-03.png")}
    style={styles.logoImage}
    resizeMode="contain"
  />
</View>

              <Text style={styles.brandName}>BillTea</Text>
              <Text style={styles.tagline}>Manage your business billing</Text>
            </View>

            <View style={styles.card}>
              {!isForgotPasswordMode ? (
                /* --- NORMAL LOGIN FORM --- */
                <>
                  <Text style={styles.title}>Welcome Back</Text>
                  <Text style={styles.subtitle}>
                    Sign in to continue to your account.
                  </Text>

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Address</Text>

                      <View style={styles.inputContainer}>
                        <Mail size={20} color={COLORS.muted} />

                        <TextInput
                          style={styles.input}
                          placeholder="Enter your email"
                          placeholderTextColor={COLORS.placeholder}
                          value={email}
                          onChangeText={(value) => {
                            setError('');
                            setEmail(value);
                          }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          returnKeyType="next"
                          editable={!loading}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Password</Text>

                      <View style={styles.inputContainer}>
                        <LockKeyhole size={20} color={COLORS.muted} />

                        <TextInput
                          style={styles.input}
                          placeholder="Enter your password"
                          placeholderTextColor={COLORS.placeholder}
                          value={password}
                          onChangeText={(value) => {
                            setError('');
                            setPassword(value);
                          }}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          editable={!loading}
                          onSubmitEditing={handleLogin}
                        />

                        <Pressable
                          onPress={() => setShowPassword((prev) => !prev)}
                          disabled={loading}
                          hitSlop={10}
                          style={styles.eyeButton}
                        >
                          {showPassword ? (
                            <EyeOff size={21} color={COLORS.muted} />
                          ) : (
                            <Eye size={21} color={COLORS.muted} />
                          )}
                        </Pressable>
                      </View>
                    </View>

                    <Pressable
                      onPress={handleForgotPasswordPress}
                      disabled={loading}
                      style={styles.forgotButton}
                    >
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleLogin}
                      disabled={!isFormValid || loading}
                      style={[
                        styles.loginButton,
                        (!isFormValid || loading) && styles.disabledButton,
                      ]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#061622" />
                      ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.signupRow}>
                    <Text style={styles.signupText}>
                      {"Don't have an account?"}
                    </Text>

                    <Pressable onPress={handleSignupPress} disabled={loading}>
                      <Text style={styles.signupLink}> Sign Up</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                /* --- FORGOT PASSWORD MULTI-STEP FLOW --- */
                <View>
                  {/* Top Bar Navigation & Step Dots */}
                  <View style={styles.forgotTopBar}>
                    <Pressable
                      onPress={switchToLogin}
                      disabled={forgotLoading}
                      style={styles.backButton}
                    >
                      <ArrowLeft size={18} color={COLORS.primary} />
                      <Text style={styles.backButtonText}>Back to Sign In</Text>
                    </Pressable>

                    <View style={styles.stepDotsRow}>
                      <View
                        style={[
                          styles.stepDot,
                          forgotStep >= 1 && styles.stepDotActive,
                        ]}
                      />
                      <View
                        style={[
                          styles.stepDot,
                          forgotStep >= 2 && styles.stepDotActive,
                        ]}
                      />
                      <View
                        style={[
                          styles.stepDot,
                          forgotStep >= 3 && styles.stepDotActive,
                        ]}
                      />
                    </View>
                  </View>

                  {/* STEP 1: Enter Email */}
                  {forgotStep === 1 && (
                    <View>
                      <Text style={styles.title}>Reset Password</Text>
                      <Text style={styles.subtitle}>
                        Enter your registered email address to receive a 6-digit verification code.
                      </Text>

                      {forgotError ? (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{forgotError}</Text>
                        </View>
                      ) : null}

                      <View style={styles.form}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Registered Email</Text>

                          <View style={styles.inputContainer}>
                            <Mail size={20} color={COLORS.muted} />
                            <TextInput
                              style={styles.input}
                              placeholder="Enter your email"
                              placeholderTextColor={COLORS.placeholder}
                              value={forgotEmail}
                              onChangeText={(val) => {
                                setForgotError('');
                                setForgotEmail(val);
                              }}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="email-address"
                              editable={!forgotLoading}
                            />
                          </View>
                        </View>

                        <Pressable
                          onPress={handleSendForgotPasswordOtp}
                          disabled={!forgotEmail.trim() || forgotLoading}
                          style={[
                            styles.loginButton,
                            (!forgotEmail.trim() || forgotLoading) &&
                              styles.disabledButton,
                          ]}
                        >
                          {forgotLoading ? (
                            <ActivityIndicator color="#061622" />
                          ) : (
                            <View style={styles.buttonContentRow}>
                              <Text style={styles.loginButtonText}>Send Code</Text>
                              <Send size={18} color="#061622" />
                            </View>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* STEP 2: Verify OTP */}
                  {forgotStep === 2 && (
                    <View>
                      <Text style={styles.title}>Verify Email OTP</Text>
                      <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{' '}
                        <Text style={styles.highlightText}>{forgotEmail}</Text>
                      </Text>

                      {forgotError ? (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{forgotError}</Text>
                        </View>
                      ) : null}

                      {forgotSuccessMsg ? (
                        <View style={styles.successBox}>
                          <Text style={styles.successText}>{forgotSuccessMsg}</Text>
                        </View>
                      ) : null}

                      <View style={styles.form}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Verification Code (OTP)</Text>

                          <View style={styles.inputContainer}>
                            <ShieldCheck size={20} color={COLORS.muted} />
                            <TextInput
                              style={[styles.input, styles.otpInput]}
                              placeholder="6-digit code"
                              placeholderTextColor={COLORS.placeholder}
                              value={forgotOtp}
                              onChangeText={(val) => {
                                setForgotError('');
                                setForgotOtp(val.replace(/\D/g, ''));
                              }}
                              keyboardType="number-pad"
                              maxLength={6}
                              editable={!forgotLoading}
                            />
                          </View>
                        </View>

                        <View style={styles.otpActionRow}>
                          <Pressable
                            onPress={() => {
                              setForgotStep(1);
                              setForgotError('');
                            }}
                            disabled={forgotLoading}
                          >
                            <Text style={styles.actionText}>Change Email</Text>
                          </Pressable>

                          <Pressable
                            onPress={handleSendForgotPasswordOtp}
                            disabled={resendTimer > 0 || forgotLoading}
                          >
                            <Text
                              style={[
                                styles.actionTextBold,
                                resendTimer > 0 && styles.disabledText,
                              ]}
                            >
                              {resendTimer > 0
                                ? `Resend OTP in ${resendTimer}s`
                                : 'Resend OTP'}
                            </Text>
                          </Pressable>
                        </View>

                        <Pressable
                          onPress={handleVerifyForgotPasswordOtp}
                          disabled={forgotOtp.trim().length !== 6 || forgotLoading}
                          style={[
                            styles.loginButton,
                            (forgotOtp.trim().length !== 6 || forgotLoading) &&
                              styles.disabledButton,
                          ]}
                        >
                          {forgotLoading ? (
                            <ActivityIndicator color="#061622" />
                          ) : (
                            <Text style={styles.loginButtonText}>Verify Code</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* STEP 3: Reset Password */}
                  {forgotStep === 3 && (
                    <View>
                      <Text style={styles.title}>Set New Password</Text>
                      <Text style={styles.subtitle}>
                        Create a new secure password for your account.
                      </Text>

                      {forgotError ? (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{forgotError}</Text>
                        </View>
                      ) : null}

                      <View style={styles.form}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>New Password</Text>

                          <View style={styles.inputContainer}>
                            <KeyRound size={20} color={COLORS.muted} />
                            <TextInput
                              style={styles.input}
                              placeholder="Min 6 characters"
                              placeholderTextColor={COLORS.placeholder}
                              value={newPassword}
                              onChangeText={(val) => {
                                setForgotError('');
                                setNewPassword(val);
                              }}
                              secureTextEntry={!showNewPassword}
                              autoCapitalize="none"
                              editable={!forgotLoading}
                            />
                            <Pressable
                              onPress={() => setShowNewPassword((prev) => !prev)}
                              disabled={forgotLoading}
                              hitSlop={10}
                              style={styles.eyeButton}
                            >
                              {showNewPassword ? (
                                <EyeOff size={21} color={COLORS.muted} />
                              ) : (
                                <Eye size={21} color={COLORS.muted} />
                              )}
                            </Pressable>
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Confirm New Password</Text>

                          <View style={styles.inputContainer}>
                            <CheckCircle size={20} color={COLORS.muted} />
                            <TextInput
                              style={styles.input}
                              placeholder="Re-enter new password"
                              placeholderTextColor={COLORS.placeholder}
                              value={confirmPassword}
                              onChangeText={(val) => {
                                setForgotError('');
                                setConfirmPassword(val);
                              }}
                              secureTextEntry={!showConfirmPassword}
                              autoCapitalize="none"
                              editable={!forgotLoading}
                            />
                            <Pressable
                              onPress={() => setShowConfirmPassword((prev) => !prev)}
                              disabled={forgotLoading}
                              hitSlop={10}
                              style={styles.eyeButton}
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={21} color={COLORS.muted} />
                              ) : (
                                <Eye size={21} color={COLORS.muted} />
                              )}
                            </Pressable>
                          </View>
                        </View>

                        <Pressable
                          onPress={handleResetPassword}
                          disabled={
                            !newPassword ||
                            !confirmPassword ||
                            forgotLoading
                          }
                          style={[
                            styles.loginButton,
                            (!newPassword ||
                              !confirmPassword ||
                              forgotLoading) &&
                              styles.disabledButton,
                          ]}
                        >
                          {forgotLoading ? (
                            <ActivityIndicator color="#061622" />
                          ) : (
                            <Text style={styles.loginButtonText}>Reset Password</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* STEP 4: Success */}
                  {forgotStep === 4 && (
                    <View style={styles.successContainer}>
                      <View style={styles.successCircle}>
                        <CheckCircle size={44} color={COLORS.primary} />
                      </View>

                      <Text style={styles.titleCenter}>Password Reset Complete!</Text>
                      <Text style={styles.subtitleCenter}>
                        Your password has been successfully updated. You can now log in with your new credentials.
                      </Text>

                      <Pressable
                        onPress={switchToLogin}
                        style={[styles.loginButton, { marginTop: 24 }]}
                      >
                        <Text style={styles.loginButtonText}>Sign In Now</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>

            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
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
    marginBottom: 34,
  },
  logoImage: {
  width: 55,
  height: 55,
},

  logoBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.25)',
    marginBottom: 14,
  },

  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
  },

  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.4,
  },

  tagline: {
    marginTop: 8,
    fontSize: 15,
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

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  titleCenter: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
    marginBottom: 24,
    lineHeight: 21,
  },

  subtitleCenter: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 10,
  },

  highlightText: {
    color: COLORS.primary,
    fontWeight: '700',
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

  form: {
    gap: 18,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },

  inputContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  input: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 0,
  },

  otpInput: {
    letterSpacing: 8,
    fontSize: 18,
    fontWeight: '800',
  },

  eyeButton: {
    padding: 2,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },

  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  loginButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.55,
  },

  loginButtonText: {
    color: '#061622',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },

  signupText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },

  signupLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
  },

  forgotTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  backButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  stepDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },

  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
  },

  otpActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -6,
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

  successContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  footerText: {
    marginTop: 26,
    textAlign: 'center',
    color: COLORS.placeholder,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});