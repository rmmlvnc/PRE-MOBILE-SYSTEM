import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";

const pages = [
  { icon: "shield-checkmark", title: "Stay informed", text: "Receive dengue alerts, prevention reminders, and barangay risk updates." },
  { icon: "map", title: "View hotspot areas", text: "Check AI-assisted dengue forecasts and hotspot information around Iligan City." },
  { icon: "megaphone", title: "Help your community", text: "Report possible mosquito breeding sites for verification by health workers." },
];

export default function Onboarding() {
  const [page, setPage] = useState(0);
  const item = pages[page];

  async function next() {
    if (page < pages.length - 1) return setPage(page + 1);
    await AsyncStorage.setItem("denguewatch_onboarding", "done");
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconCircle}><Ionicons name={item.icon as any} size={76} color="#fff" /></View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
      <View style={styles.dots}>{pages.map((_, i) => <View key={i} style={[styles.dot, i === page && styles.dotActive]} />)}</View>
      <TouchableOpacity style={styles.button} onPress={next}><Text style={styles.buttonText}>{page === 2 ? "Get Started" : "Next"}</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", padding: 28 },
  iconCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,.15)", alignItems: "center", justifyContent: "center", marginBottom: 36 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", textAlign: "center" },
  text: { color: "#E5F4EF", fontSize: 16, lineHeight: 24, textAlign: "center", marginTop: 14, minHeight: 72 },
  dots: { flexDirection: "row", gap: 8, marginVertical: 35 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,.35)" },
  dotActive: { width: 26, backgroundColor: "#fff" },
  button: { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center" },
  buttonText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
});
