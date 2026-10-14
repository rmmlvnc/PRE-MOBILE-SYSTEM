import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { mobileApi } from "../../src/services/api";
import { colors } from "../../src/theme/colors";
import { DengueAlert, Hotspot } from "../../src/types";

function riskColor(level = "") { const key = level.toLowerCase() as keyof typeof colors; return (colors as any)[key] || colors.muted; }

export default function HomeScreen() {
  const { user } = useAuth();
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);
  const [alerts, setAlerts] = useState<DengueAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [h, a] = await Promise.all([mobileApi.hotspots(), mobileApi.alerts()]);
      setHotspot(h.hotspots.find((x: Hotspot) => x.barangay_id === user?.barangay?.id) || null);
      setAlerts(a.alerts.slice(0, 2));
    } finally { setRefreshing(false); }
  }, [user?.barangay?.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={styles.header}><View><Text style={styles.hello}>Hello, {user?.first_name}</Text><Text style={styles.area}><Ionicons name="location" /> {user?.barangay?.name || "Iligan City"}</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Text></View></View>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Your barangay risk</Text>
        <View style={[styles.riskCard, { borderLeftColor: riskColor(hotspot?.risk_level) }]}>
          <View><Text style={styles.riskArea}>{hotspot?.barangay || user?.barangay?.name || "No assigned barangay"}</Text><Text style={[styles.riskLevel, { color: riskColor(hotspot?.risk_level) }]}>{hotspot ? `${hotspot.risk_level} Risk` : "No historical level available"}</Text></View>
          <View style={[styles.riskCircle, { backgroundColor: riskColor(hotspot?.risk_level) }]}><Ionicons name="pulse" size={27} color="#fff" /></View>
          {hotspot && <Text style={styles.details}>Predicted cases: {hotspot.predicted_cases ?? "N/A"}  •  Trend: {hotspot.trend || "N/A"}</Text>}
          <View style={styles.riskExplanation}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.riskExplanationTitle}>How to read this risk level</Text>
              <Text style={styles.riskExplanationText}>Low, Moderate, High, and Critical are based on historically confirmed dengue cases recorded in your barangay. They support community planning and awareness only; they do not diagnose dengue or determine an individual’s risk.</Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>If you have dengue symptoms or warning signs, seek assessment from a health professional.</Text>
        </View>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quick} onPress={() => router.push("/(tabs)/hotspots")}><Ionicons name="map" size={30} color={colors.primary} /><Text style={styles.quickText}>Hotspot Map</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quick} onPress={() => router.push("/(tabs)/report")}><Ionicons name="megaphone" size={30} color={colors.primary} /><Text style={styles.quickText}>Send Report</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quick} onPress={() => router.push("/(tabs)/alerts")}><Ionicons name="notifications" size={30} color={colors.primary} /><Text style={styles.quickText}>View Alerts</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.recommendationLink} onPress={() => router.push("/(tabs)/recommendations")} accessibilityRole="button">
          <View style={styles.recommendationIcon}><Ionicons name="shield-checkmark" size={24} color={colors.primary} /></View>
          <View style={styles.recommendationCopy}><Text style={styles.recommendationTitle}>View Preventive Recommendations</Text><Text style={styles.recommendationSubtitle}>Practical steps to reduce mosquito bites and breeding sites</Text></View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Latest alerts</Text>
        {alerts.length === 0 ? <Text style={styles.empty}>No active alerts for your barangay.</Text> : alerts.map((a) => <View key={a.id} style={styles.alert}><Ionicons name="warning" size={24} color={riskColor(a.risk_level)} /><View style={{ flex: 1 }}><Text style={styles.alertTitle}>{a.title}</Text><Text style={styles.alertText} numberOfLines={2}>{a.message}</Text></View></View>)}
        <View style={styles.healthGuidance}>
          <View style={styles.healthHeading}><Ionicons name="medical" size={22} color="#B42318" /><Text style={styles.healthTitle}>Dengue health guidance</Text></View>
          <Text style={styles.healthText}>This app does not diagnose dengue. Seek advice from a health professional if you are unwell or concerned about dengue symptoms.</Text>
          <View style={styles.urgentNotice}><Ionicons name="warning" size={20} color="#B42318" /><View style={{ flex: 1 }}><Text style={styles.urgentTitle}>Seek a health facility immediately</Text><Text style={styles.urgentText}>for severe abdominal pain, persistent vomiting, bleeding from the gums or nose, blood in vomit or stool, rapid breathing, or unusual tiredness or restlessness.</Text></View></View>
        </View>
        <View style={styles.tip}><Ionicons name="water" size={25} color={colors.primary} /><Text style={styles.tipText}>Remove standing water and clean possible mosquito breeding areas every week.</Text></View>
      </View>
    </ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.primary }, header: { padding: 22, paddingBottom: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, hello: { color: "#fff", fontSize: 25, fontWeight: "800" }, area: { color: "#D8EEE8", marginTop: 5 }, avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,.2)", alignItems: "center", justifyContent: "center" }, avatarText: { color: "#fff", fontWeight: "800" }, content: { backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, minHeight: 650 }, sectionTitle: { color: colors.text, fontWeight: "800", fontSize: 18, marginTop: 6, marginBottom: 12 }, riskCard: { backgroundColor: "#fff", padding: 18, borderRadius: 16, borderLeftWidth: 6, marginBottom: 20 }, riskArea: { color: colors.muted }, riskLevel: { fontSize: 25, fontWeight: "800", marginTop: 3 }, riskCircle: { position: "absolute", right: 18, top: 18, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }, details: { color: colors.text, marginTop: 14 }, riskExplanation: { flexDirection: "row", gap: 8, backgroundColor: colors.primaryLight, borderRadius: 10, padding: 10, marginTop: 12 }, riskExplanationTitle: { color: colors.text, fontSize: 12, fontWeight: "800", marginBottom: 3 }, riskExplanationText: { color: colors.text, fontSize: 11, lineHeight: 16 }, disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 12 }, quickRow: { flexDirection: "row", gap: 10, marginBottom: 14 }, quick: { flex: 1, backgroundColor: "#fff", paddingVertical: 17, borderRadius: 14, alignItems: "center" }, quickText: { color: colors.text, fontSize: 12, fontWeight: "600", marginTop: 7, textAlign: "center" }, recommendationLink: { backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }, recommendationIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }, recommendationCopy: { flex: 1 }, recommendationTitle: { color: colors.text, fontSize: 14, fontWeight: "800" }, recommendationSubtitle: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, alert: { backgroundColor: "#fff", padding: 14, borderRadius: 14, flexDirection: "row", gap: 12, marginBottom: 10 }, alertTitle: { color: colors.text, fontWeight: "700" }, alertText: { color: colors.muted, fontSize: 13, marginTop: 3 }, empty: { color: colors.muted, paddingVertical: 14 }, healthGuidance: { backgroundColor: "#FFF8F6", borderWidth: 1, borderColor: "#FECDCA", borderRadius: 14, padding: 14, marginTop: 12 }, healthHeading: { flexDirection: "row", alignItems: "center", gap: 8 }, healthTitle: { color: colors.text, fontWeight: "800", fontSize: 16 }, healthText: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 8 }, urgentNotice: { flexDirection: "row", gap: 8, backgroundColor: "#fff", borderRadius: 10, padding: 10, marginTop: 10 }, urgentTitle: { color: "#B42318", fontWeight: "800", fontSize: 12 }, urgentText: { color: colors.text, fontSize: 11, lineHeight: 16, marginTop: 3 }, tip: { backgroundColor: colors.primaryLight, padding: 15, borderRadius: 14, flexDirection: "row", gap: 12, marginTop: 12 }, tipText: { flex: 1, color: colors.text, lineHeight: 20 } });
