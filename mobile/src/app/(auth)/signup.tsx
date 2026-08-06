import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";

export default function SignupPage() {
  const router = useRouter();
  const { setAuthenticated, setUser } = useAuthStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    emailOtp: "",
    mobileOtp: "",
    fullName: "",
    companyName: "",
    branchName: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const updateData = (updates: Partial<typeof formData>) =>
    setFormData({ ...formData, ...updates });

  const handleNext = async () => {
    setError(null);

    if (step === 1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!/^\d{10}$/.test(formData.mobileNumber)) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      try {
        setLoading(true);
        await authService.checkDuplicate(formData.email, formData.mobileNumber);
        await authService.sendOtp(formData.email, formData.mobileNumber);
        setLoading(false);
        setStep(2);
      } catch (err: any) {
        setLoading(false);
        setError(
          err?.response?.data?.message || err?.message || "Could not validate details."
        );
      }
      return;
    }

    if (step === 2) {
      if (!formData.emailOtp || !formData.mobileOtp) {
        setError("Please enter both OTPs.");
        return;
      }
      try {
        setLoading(true);
        await authService.verifyOtp(formData.emailOtp, formData.mobileOtp);
        setLoading(false);
        setStep(3);
      } catch (err: any) {
        setLoading(false);
        setError(
          err?.response?.data?.message || err?.message || "Invalid OTP."
        );
      }
      return;
    }

    if (step === 3 && !formData.fullName) {
      setError("Full Name is required");
      return;
    }
    if (step === 4 && !formData.companyName) {
      setError("Company Name is required");
      return;
    }
    if (step === 5 && !formData.branchName) {
      setError("Branch Name is required");
      return;
    }

    setStep(step + 1);
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await authService.register({
        email: formData.email,
        phoneNumber: formData.mobileNumber,
        password: formData.password,
        fullName: formData.fullName,
        companyName: formData.companyName,
        branchName: formData.branchName,
        bankName: formData.bankName,
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        upiId: formData.upiId,
      });

      if (data?.user) {
        setUser(data.user);
      }
      setAuthenticated(true);

      setLoading(false);
      setSuccessMsg("Registration complete! Redirecting...");
      setTimeout(() => router.replace("/(app)/dashboard"), 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Network error during registration."
      );
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(val) => updateData({ email: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              value={formData.mobileNumber}
              onChangeText={(val) => updateData({ mobileNumber: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={formData.password}
              onChangeText={(val) => updateData({ password: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(val) => updateData({ confirmPassword: val })}
            />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.info}>
              Enter the OTPs sent to your email and mobile.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email OTP"
              keyboardType="number-pad"
              value={formData.emailOtp}
              onChangeText={(val) => updateData({ emailOtp: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile OTP"
              keyboardType="number-pad"
              value={formData.mobileOtp}
              onChangeText={(val) => updateData({ mobileOtp: val })}
            />
          </>
        );
      case 3:
        return (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.fullName}
            onChangeText={(val) => updateData({ fullName: val })}
          />
        );
      case 4:
        return (
          <TextInput
            style={styles.input}
            placeholder="Company Name"
            value={formData.companyName}
            onChangeText={(val) => updateData({ companyName: val })}
          />
        );
      case 5:
        return (
          <TextInput
            style={styles.input}
            placeholder="Branch Name"
            value={formData.branchName}
            onChangeText={(val) => updateData({ branchName: val })}
          />
        );
      case 6:
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Bank Name (optional)"
              value={formData.bankName}
              onChangeText={(val) => updateData({ bankName: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Account Name (optional)"
              value={formData.accountName}
              onChangeText={(val) => updateData({ accountName: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Account Number (optional)"
              keyboardType="number-pad"
              value={formData.accountNumber}
              onChangeText={(val) => updateData({ accountNumber: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="IFSC Code (optional)"
              autoCapitalize="characters"
              value={formData.ifscCode}
              onChangeText={(val) => updateData({ ifscCode: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="UPI ID (optional)"
              autoCapitalize="none"
              value={formData.upiId}
              onChangeText={(val) => updateData({ upiId: val })}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Signup</Text>
          <Text style={styles.subtitle}>Step {step}/6</Text>

          {error && <Text style={styles.error}>{error}</Text>}
          {successMsg && <Text style={styles.success}>{successMsg}</Text>}

          <View style={{ marginVertical: 20 }}>{renderStep()}</View>

          <View style={styles.actions}>
            {step > 1 && step < 6 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(step - 1)}
                disabled={loading}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            )}

            {step < 6 ? (
              <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={handleFinalSubmit}
                disabled={loading || !!successMsg}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Complete Setup</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {step === 1 && (
            <TouchableOpacity
              style={{ marginTop: 20 }}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.linkText}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", color: "#666", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  button: {
    flex: 2,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    marginLeft: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 30,
    padding: 14,
    alignItems: "center",
    marginRight: 8,
  },
  backText: { color: "#007AFF", fontWeight: "600" },
  actions: { flexDirection: "row", marginTop: 10 },
  error: { color: "red", textAlign: "center", marginBottom: 10 },
  success: { color: "green", textAlign: "center", marginBottom: 10 },
  linkText: { color: "#007AFF", textAlign: "center", fontWeight: "500" },
  info: { textAlign: "center", color: "#555", fontSize: 14, marginBottom: 8 },
});
