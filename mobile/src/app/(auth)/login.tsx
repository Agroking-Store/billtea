import React, { useState } from 'react';
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
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthenticated, setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (loading) {
      return;
    }

    setError('');

    if (!validateForm()) {
      return;
    }

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
    // Forgot password flow will be connected later.
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
                <Text style={styles.logoText}>₹</Text>
              </View>

              <Text style={styles.brandName}>BillTea</Text>
              <Text style={styles.tagline}>Manage your business billing</Text>
            </View>

            <View style={styles.card}>
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
                      onChangeText={value => {
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
                      onChangeText={value => {
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
                      onPress={() => setShowPassword(prev => !prev)}
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
            </View>

            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy
              Policy.
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
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.muted,
    marginBottom: 24,
    lineHeight: 22,
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