import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function LoginScreen() {
  const { login } = useAuth();
  const { registered, email: registeredEmail } = useLocalSearchParams<{ registered?: string; email?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (registeredEmail) setEmail(registeredEmail);
    if (registered === "1") {
      Alert.alert("Registration successful", "Your account was created. Sign in with your email and password.");
    }
  }, [registered, registeredEmail]);

  async function handleLogin() {
    if (!email.trim()) {
      Alert.alert(
        "Missing email",
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Missing password",
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      await login(
        email.trim().toLowerCase(),
        password
      );

      // React Native Web does not reliably run Alert button callbacks. The
      // session is already persisted by AuthContext, so move immediately to
      // the authenticated route after a successful login.
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error
          ? error.message
          : "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}><Ionicons name="shield-checkmark" size={46} color="#fff" /></View>
          <Text style={styles.brand}>DengueWatch</Text>
          <Text style={styles.subtitle}>Resident Mobile Application</Text>
          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.label}>Email address</Text>
            <TextInput style={styles.input} placeholder="resident@email.com" placeholderTextColor="#8A9A97" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} placeholder="Enter password" placeholderTextColor="#8A9A97" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.muted} /></TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.button, loading && { opacity: .6 }]} disabled={loading} onPress={handleLogin}><Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text></TouchableOpacity>
            <View style={styles.registerRow}><Text style={styles.muted}>No resident account? </Text><TouchableOpacity onPress={() => router.push("/(auth)/register")}><Text style={styles.link}>Register here</Text></TouchableOpacity></View>
          </View>
          <Text style={styles.note}>CHO, CHW, BHW, and LGU personnel must use the desktop web system.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary }, container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  logo: { width: 78, height: 78, borderRadius: 24, backgroundColor: "rgba(255,255,255,.16)", alignSelf: "center", alignItems: "center", justifyContent: "center" },
  brand: { color: "#fff", fontSize: 30, fontWeight: "800", textAlign: "center", marginTop: 12 }, subtitle: { color: "#D8EEE8", textAlign: "center", marginBottom: 28 },
  card: { backgroundColor: "#fff", borderRadius: 22, padding: 22 }, heading: { fontSize: 23, fontWeight: "800", color: colors.text, marginBottom: 20 },
  label: { fontWeight: "600", color: colors.text, marginBottom: 7, marginTop: 10 }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text },
  passwordRow: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }, passwordInput: { flex: 1, paddingVertical: 14, color: colors.text },
  button: { backgroundColor: colors.primary, padding: 15, borderRadius: 12, alignItems: "center", marginTop: 24 }, buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 }, muted: { color: colors.muted }, link: { color: colors.primary, fontWeight: "700" }, note: { color: "#D8EEE8", textAlign: "center", fontSize: 12, marginTop: 18, lineHeight: 18 },
});
