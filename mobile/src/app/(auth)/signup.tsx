import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    mobileNumber: "",
    fullName: "",
    companyName: "",
    branchName: "",
    bankDetails: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const updateData = (updates: Partial<typeof formData>) =>
    setFormData({ ...formData, ...updates });

  const handleNext = () => {
    setError(null);
    if (step === 1 && (!formData.email || !formData.mobileNumber)) {
      setError("Email and Mobile are required");
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
      // simulate API call
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg("Registration complete! Redirecting...");
        setTimeout(() => router.push("/home"), 1500);
      }, 1500);
    } catch {
      setError("Network error during registration.");
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
          </>
        );
      case 2:
        return <Text style={styles.info}>Verify OTP (demo step)</Text>;
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
          <TextInput
            style={styles.input}
            placeholder="Bank Details"
            value={formData.bankDetails}
            onChangeText={(val) => updateData({ bankDetails: val })}
          />
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
            onPress={() => router.push("/login")}
          >
            <Text style={styles.linkText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  card: {
    width: "90%",
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
  info: { textAlign: "center", color: "#555", fontSize: 14 },
});
