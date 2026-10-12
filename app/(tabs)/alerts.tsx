import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { mobileApi } from "../../src/services/api";
import { colors } from "../../src/theme/colors";
import { AppNotification, DengueAlert } from "../../src/types";

function riskColor(level = "") { return ({ LOW: colors.low, MODERATE: colors.moderate, HIGH: colors.high, CRITICAL: colors.critical } as any)[level.toUpperCase()] || colors.muted; }

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<DengueAlert[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      const [alertData, notificationData] = await Promise.all([mobileApi.alerts(), mobileApi.notifications()]);
      setAlerts(alertData.alerts || []);
      const inbox = notificationData.notifications || [];
      setNotifications(inbox);
      const unreadIds = inbox.filter((item: AppNotification) => !item.is_read).map((item: AppNotification) => item.id);
      if (unreadIds.length) await mobileApi.markNotificationsRead(unreadIds);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const noUpdates = notifications.length === 0 && alerts.length === 0;
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Text style={styles.title}>Alerts & Updates</Text><Text style={styles.subtitle}>CHO replies, report updates, and prevention alerts</Text></View>{loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /> : <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>{noUpdates ? <View style={styles.empty}><Ionicons name="notifications-off" size={48} color={colors.muted} /><Text style={styles.emptyTitle}>No updates yet</Text><Text style={styles.emptyText}>CHO replies and prevention alerts will appear here.</Text></View> : <>{notifications.length > 0 && <Text style={styles.section}>My notifications</Text>}{notifications.map((item) => <View key={`notification-${item.id}`} style={[styles.card, item.type === "ALERT" ? styles.alertNotification : styles.replyCard]}><View style={styles.cardTop}><View style={[styles.icon, { backgroundColor: item.type === "ALERT" ? colors.high : colors.primary }]}><Ionicons name={item.type === "REPLY" ? "chatbubble" : item.type === "ALERT" ? "warning" : "notifications"} size={20} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={[styles.risk, item.type === "ALERT" && { color: colors.high }]}>{item.type === "REPLY" ? "CHO REPLY" : item.type === "ALERT" ? "BARANGAY HEALTH ALERT" : "DENGUEWATCH UPDATE"}</Text></View></View><Text style={styles.message}>{item.message}</Text><Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text></View>)}{alerts.length > 0 && <Text style={styles.section}>Current health alerts</Text>}{alerts.map((a) => <View key={`alert-${a.id}`} style={[styles.card, { borderLeftColor: riskColor(a.risk_level) }]}><View style={styles.cardTop}><View style={[styles.icon, { backgroundColor: riskColor(a.risk_level) }]}><Ionicons name="warning" size={20} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{a.title}</Text><Text style={[styles.risk, { color: riskColor(a.risk_level) }]}>{a.risk_level} RISK • {a.barangay}</Text></View></View><Text style={styles.message}>{a.message}</Text><Text style={styles.date}>{new Date(a.created_at).toLocaleString()}</Text></View>)}</>}</ScrollView>}</SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, header: { padding: 22, backgroundColor: colors.primary }, title: { color: "#fff", fontSize: 25, fontWeight: "800" }, subtitle: { color: "#D8EEE8", marginTop: 4 }, list: { padding: 16, paddingBottom: 90 }, section: { color: colors.text, fontWeight: "800", fontSize: 17, marginTop: 5, marginBottom: 9 }, card: { backgroundColor: "#fff", padding: 16, borderRadius: 14, borderLeftWidth: 5, marginBottom: 12 }, replyCard: { borderLeftColor: colors.primary }, alertNotification: { borderLeftColor: colors.high }, cardTop: { flexDirection: "row", gap: 11, alignItems: "center" }, icon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" }, cardTitle: { color: colors.text, fontWeight: "800", fontSize: 16 }, risk: { fontSize: 11, fontWeight: "800", marginTop: 2, color: colors.primary }, message: { color: colors.text, lineHeight: 21, marginTop: 13 }, date: { color: colors.muted, fontSize: 11, marginTop: 10 }, empty: { alignItems: "center", paddingTop: 80 }, emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 19, marginTop: 15 }, emptyText: { color: colors.muted, textAlign: "center", marginTop: 7 } });
