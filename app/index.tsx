import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function Index() {
  const { user, loading } = useAuth();
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("denguewatch_onboarding").then((value) =>
      setSeenOnboarding(value === "done")
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading || seenOnboarding === null || !splashDone) {
    return <View style={{ flex: 1, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" }}><Ionicons name="shield-checkmark" size={82} color="#fff" /><Text style={{ color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 14 }}>DengueWatch</Text><Text style={{ color: "#D8EEE8", marginTop: 5 }}>Iligan City Dengue Surveillance</Text><ActivityIndicator color="#fff" size="small" style={{ marginTop: 28 }} /></View>;
  }
  if (!seenOnboarding) return <Redirect href="/onboarding" />;
  return <Redirect href={user ? "/(tabs)" : "/(auth)/login"} />;
}
