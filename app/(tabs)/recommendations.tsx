import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../src/theme/colors";

const recommendations = [
  {
    icon: "water-outline" as const,
    title: "Remove mosquito breeding sites",
    tips: [
      "At least once a week, empty, scrub, turn over, or cover containers that can collect water.",
      "Keep water storage containers tightly covered and clear roof gutters and drains.",
      "Dispose of or store bottles, cans, tires, and other items where rainwater cannot collect.",
    ],
  },
  {
    icon: "body-outline" as const,
    title: "Protect yourself from bites",
    tips: [
      "Use mosquito repellent according to its label, especially when outdoors.",
      "Wear loose-fitting clothes that cover your arms and legs.",
      "Use window and door screens; use a mosquito net when sleeping in an unscreened area.",
    ],
  },
  {
    icon: "people-outline" as const,
    title: "Help protect your community",
    tips: [
      "Check your home and nearby shared spaces regularly for standing water.",
      "Share prevention concerns with your barangay health worker or local health office.",
    ],
  },
];

export default function RecommendationsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={23} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Preventive Recommendations</Text>
          <Text style={styles.subtitle}>Small weekly steps can help reduce mosquito breeding and bites.</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <Ionicons name="information-circle" size={21} color={colors.primary} />
          <Text style={styles.noticeText}>Dengue mosquitoes can bite during the day and at night. Prevention includes both removing breeding sites and avoiding bites.</Text>
        </View>
        {recommendations.map((section, index) => (
          <View key={section.title} style={styles.card}>
            <View style={styles.cardHeading}>
              <View style={styles.icon}><Ionicons name={section.icon} size={23} color={colors.primary} /></View>
              <Text style={styles.cardTitle}>{section.title}</Text>
            </View>
            {section.tips.map((tip) => (
              <View key={tip} style={styles.tip}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.careCard}>
          <View style={styles.cardHeading}>
            <View style={styles.careIcon}><Ionicons name="medical" size={22} color="#B42318" /></View>
            <Text style={styles.cardTitle}>When to seek care</Text>
          </View>
          <Text style={styles.careText}>If you have a fever or feel unwell, contact a health professional. Seek urgent care for severe abdominal pain, persistent vomiting, bleeding, rapid breathing, or unusual tiredness or restlessness.</Text>
          <Text style={styles.disclaimer}>These tips are for general prevention and do not diagnose or treat dengue.</Text>
        </View>
        <Text style={styles.sourceLabel}>Learn more from public health sources</Text>
        <TouchableOpacity style={styles.sourceLink} onPress={() => Linking.openURL("https://www.who.int/health-topics/zika-virus-disease/how-to-prevent-mosquito-breeding")}>
          <Text style={styles.sourceText}>WHO: How to prevent mosquito breeding</Text><Ionicons name="open-outline" size={17} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sourceLink} onPress={() => Linking.openURL("https://www.cdc.gov/dengue/prevention/")}>
          <Text style={styles.sourceText}>CDC: Preventing dengue</Text><Ionicons name="open-outline" size={17} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 22, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,.18)", alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  title: { color: "#fff", fontSize: 23, lineHeight: 29, fontWeight: "800" },
  subtitle: { color: "#D8EEE8", lineHeight: 19, fontSize: 13, marginTop: 5 },
  content: { padding: 16, paddingBottom: 36 },
  notice: { backgroundColor: colors.primaryLight, borderRadius: 13, padding: 13, flexDirection: "row", gap: 9, alignItems: "flex-start", marginBottom: 14 },
  noticeText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: "#fff", borderRadius: 15, padding: 16, marginBottom: 12 },
  cardHeading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "800", flex: 1 },
  tip: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 9 },
  tipText: { color: colors.text, fontSize: 13, lineHeight: 19, flex: 1 },
  careCard: { backgroundColor: "#FFF8F6", borderColor: "#FECDCA", borderWidth: 1, borderRadius: 15, padding: 16, marginTop: 2 },
  careIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FEE4E2", alignItems: "center", justifyContent: "center" },
  careText: { color: colors.text, fontSize: 13, lineHeight: 20 },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  sourceLabel: { color: colors.text, fontWeight: "800", fontSize: 14, marginTop: 20, marginBottom: 8 },
  sourceLink: { backgroundColor: "#fff", borderRadius: 11, padding: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sourceText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
});
