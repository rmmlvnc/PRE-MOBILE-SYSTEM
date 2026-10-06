import MapView, { Polygon } from "react-native-maps";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { mobileApi } from "../../src/services/api";
import { colors } from "../../src/theme/colors";
import { Hotspot } from "../../src/types";

type Feature = { properties: { brgy_name?: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } };
function key(value = "") { return value.toLowerCase().replace(/[-]+/g, " ").replace(/\s+/g, " ").trim(); }
function riskColor(level = "") { return ({ Low: colors.low, Moderate: colors.moderate, High: colors.high, Critical: colors.critical } as Record<string, string>)[level] || "#9CA3AF"; }
function rings(feature: Feature): number[][][] { return feature.geometry.type === "Polygon" ? feature.geometry.coordinates as number[][][] : (feature.geometry.coordinates as number[][][][]).flat(); }

export default function HotspotsScreen() {
  const [items, setItems] = useState<Hotspot[]>([]);
  const [boundaries, setBoundaries] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [mode, setMode] = useState<"map" | "list">("map");
  const [period, setPeriod] = useState("");
  const [selected, setSelected] = useState<Hotspot | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setMapError("");
    try {
      const hotspots = await mobileApi.hotspots();
      setItems(hotspots.hotspots || []); setPeriod(hotspots.forecast_period || "Latest forecast");
      try {
        const geojson = await mobileApi.boundaries();
        if (!Array.isArray(geojson.features)) throw new Error();
        setBoundaries(geojson.features);
      } catch { setMapError("Official map boundaries could not be loaded. You can still use the list below."); }
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const byBoundary = useMemo(() => {
    const result: Record<string, Hotspot> = {};
    items.forEach((item) => { result[key(item.barangay)] = item; });
    if (result.saray) result["saray tibanga"] = result.saray;
    if (result["acmac mariano badelles sr"]) result.acmac = result["acmac mariano badelles sr"];
    if (result.mahayahay) result.mahayhay = result.mahayahay;
    if (result["tomas l cabili"]) result["tominobo proper"] = result["tomas l cabili"];
    if (result["upper tominobo"]) result["tominobo upper"] = result["upper tominobo"];
    return result;
  }, [items]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  const cards = <ScrollView contentContainerStyle={styles.list}>{items.map((x) => <View key={x.id} style={styles.card}><View style={[styles.dot, { backgroundColor: riskColor(x.risk_level) }]} /><View style={{ flex: 1 }}><Text style={styles.area}>{x.barangay}</Text><Text style={styles.detail}>{x.predicted_cases ?? "N/A"} predicted • {x.trend || "No trend"}</Text>{x.training_blood_type ? <Text style={styles.detail}>Historical training feature: {x.training_blood_type} ({x.training_blood_type_share ?? 0}%)</Text> : null}</View><Text style={[styles.badge, { color: riskColor(x.risk_level) }]}>{x.risk_level}</Text></View>)}</ScrollView>;
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Text style={styles.title}>Dengue Hotspots</Text><Text style={styles.subtitle}>AI-assisted forecast • {period}</Text><View style={styles.switch}><TouchableOpacity style={[styles.switchBtn, mode === "map" && styles.active]} onPress={() => setMode("map")}><Text style={mode === "map" ? styles.activeText : styles.switchText}>Map</Text></TouchableOpacity><TouchableOpacity style={[styles.switchBtn, mode === "list" && styles.active]} onPress={() => setMode("list")}><Text style={mode === "list" ? styles.activeText : styles.switchText}>List</Text></TouchableOpacity></View></View>
    {mode === "map" && boundaries.length ? <View style={{ flex: 1 }}><MapView style={{ flex: 1 }} initialRegion={{ latitude: 8.228, longitude: 124.245, latitudeDelta: .35, longitudeDelta: .35 }}>{boundaries.map((feature, index) => { const item = byBoundary[key(feature.properties.brgy_name)]; return rings(feature).map((coordinates, ringIndex) => <Polygon key={`${index}-${ringIndex}`} coordinates={coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))} fillColor={`${riskColor(item?.risk_level)}88`} strokeColor="#FFFFFF" strokeWidth={1} tappable onPress={() => setSelected(item || null)} />); })}</MapView>{selected ? <View style={styles.popup}><Text style={styles.popupTitle}>{selected.barangay}</Text><Text style={styles.detail}>{selected.predicted_cases ?? "N/A"} predicted cases • {selected.risk_level} risk</Text></View> : null}</View> : mode === "map" ? <View style={{ flex: 1 }}><View style={styles.mapNotice}><Text style={styles.mapNoticeTitle}>Map unavailable</Text><Text style={styles.detail}>{mapError || "No official boundary data is available."}</Text></View>{cards}</View> : cards}
    <View style={styles.legend}>{["Low", "Moderate", "High", "Critical"].map((x) => <View key={x} style={styles.legendItem}><View style={[styles.smallDot, { backgroundColor: riskColor(x) }]} /><Text>{x}</Text></View>)}</View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, justifyContent: "center" }, header: { padding: 20, backgroundColor: "#fff" }, title: { fontSize: 25, fontWeight: "800", color: colors.text }, subtitle: { color: colors.muted, marginTop: 3 }, switch: { flexDirection: "row", backgroundColor: colors.background, padding: 4, borderRadius: 12, marginTop: 14 }, switchBtn: { flex: 1, padding: 9, alignItems: "center", borderRadius: 9 }, active: { backgroundColor: colors.primary }, activeText: { color: "#fff", fontWeight: "700" }, switchText: { color: colors.muted }, list: { padding: 15, paddingBottom: 80 }, mapNotice: { backgroundColor: colors.primaryLight, padding: 14, borderRadius: 13, margin: 15 }, mapNoticeTitle: { color: colors.text, fontWeight: "800", marginBottom: 4 }, card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", padding: 15, borderRadius: 13, marginBottom: 9 }, dot: { width: 13, height: 48, borderRadius: 7 }, area: { color: colors.text, fontWeight: "700" }, detail: { color: colors.muted, fontSize: 12, marginTop: 3 }, badge: { fontWeight: "800" }, popup: { position: "absolute", left: 15, right: 15, bottom: 25, padding: 15, borderRadius: 12, backgroundColor: "#FFF", elevation: 4 }, popupTitle: { fontWeight: "800", color: colors.text }, legend: { position: "absolute", left: 12, right: 12, bottom: 10, backgroundColor: "#fff", borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-around", elevation: 4 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 4 }, smallDot: { width: 9, height: 9, borderRadius: 5 } });
