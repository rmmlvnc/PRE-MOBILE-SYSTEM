import MapView, { Callout, Marker, Polygon } from "react-native-maps";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { mobileApi } from "../../src/services/api";
import { colors } from "../../src/theme/colors";
import { HistoricalHotspotResponse, Hotspot } from "../../src/types";
import { useAuth } from "../../src/context/AuthContext";

type Feature = { properties: { brgy_name?: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } };
function key(value = "") { return value.toLowerCase().replace(/[-]+/g, " ").replace(/\s+/g, " ").trim(); }
function riskColor(level = "") { return ({ Low: colors.low, Moderate: colors.moderate, High: colors.high, Critical: colors.critical } as Record<string, string>)[level] || "#9CA3AF"; }
function rings(feature: Feature): number[][][] { return feature.geometry.type === "Polygon" ? feature.geometry.coordinates as number[][][] : (feature.geometry.coordinates as number[][][][]).flat(); }

export default function HotspotsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Hotspot[]>([]);
  const [boundaries, setBoundaries] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [mode, setMode] = useState<"map" | "list">("map");
  const [period, setPeriod] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selected, setSelected] = useState<Hotspot | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setMapError("");
    try {
      const hotspots = await mobileApi.hotspots() as HistoricalHotspotResponse;
      setItems(hotspots.hotspots || []);
      setPeriod(hotspots.historical_case_period || "Historical records");
      setSelectedYear(hotspots.selected_year_label || "All available historical years");
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

  const focusedHotspot = useMemo(
    () => items.find((item) => key(item.barangay) === key(user?.barangay?.name))
      || items.find((item) => item.latitude != null && item.longitude != null),
    [items, user?.barangay?.name],
  );
  const initialRegion = {
    latitude: focusedHotspot?.latitude ?? 8.228,
    longitude: focusedHotspot?.longitude ?? 124.245,
    latitudeDelta: focusedHotspot ? 0.1 : 0.35,
    longitudeDelta: focusedHotspot ? 0.1 : 0.35,
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  const cards = <ScrollView contentContainerStyle={styles.list}>{items.map((x) => <View key={x.id} style={styles.card}><View style={[styles.dot, { backgroundColor: riskColor(x.risk_level) }]} /><View style={{ flex: 1 }}><Text style={styles.area}>{x.barangay}</Text><Text style={styles.detail}>{x.current_cases ?? 0} recorded historical cases • {x.risk_level} risk</Text></View><Text style={[styles.badge, { color: riskColor(x.risk_level) }]}>{x.risk_level}</Text></View>)}</ScrollView>;
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Text style={styles.title}>Dengue Hotspots</Text><Text style={styles.subtitle}>Historical case map • {period}</Text><Text style={styles.period}>Selected: {selectedYear}</Text>{user?.barangay?.name ? <Text style={styles.focus}>Map starts near your barangay: {user.barangay.name}</Text> : null}<Text style={styles.disclaimer}>Low, Moderate, High, and Critical reflect historically confirmed cases in each barangay. They support planning and awareness only; they do not diagnose dengue or determine individual risk. AI forecasts are separate staff planning information and do not color this map.</Text><View style={styles.switch}><TouchableOpacity style={[styles.switchBtn, mode === "map" && styles.active]} onPress={() => setMode("map")}><Text style={mode === "map" ? styles.activeText : styles.switchText}>Map</Text></TouchableOpacity><TouchableOpacity style={[styles.switchBtn, mode === "list" && styles.active]} onPress={() => setMode("list")}><Text style={mode === "list" ? styles.activeText : styles.switchText}>List</Text></TouchableOpacity></View></View>
    {mode === "map" && boundaries.length ? <View style={{ flex: 1 }}><MapView key={`${initialRegion.latitude}-${initialRegion.longitude}`} style={{ flex: 1 }} initialRegion={initialRegion}>{boundaries.map((feature, index) => { const item = byBoundary[key(feature.properties.brgy_name)]; return rings(feature).map((coordinates, ringIndex) => <Polygon key={`${index}-${ringIndex}`} coordinates={coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))} fillColor={`${riskColor(item?.risk_level)}88`} strokeColor="#FFFFFF" strokeWidth={1} tappable onPress={() => setSelected(item || null)} />); })}{items.filter((item) => item.latitude != null && item.longitude != null).map((item) => <Marker key={`hotspot-${item.id}`} coordinate={{ latitude: Number(item.latitude), longitude: Number(item.longitude) }} pinColor={riskColor(item.risk_level)} onPress={() => setSelected(item)}><Callout><View style={styles.callout}><Text style={styles.popupTitle}>{item.barangay}</Text><Text style={styles.detail}>{item.current_cases ?? 0} recorded historical cases</Text><Text style={[styles.calloutRisk, { color: riskColor(item.risk_level) }]}>{item.risk_level} risk</Text></View></Callout></Marker>)}</MapView><View style={styles.mapHint}><Text style={styles.mapHintText}>Colored areas and pins show recorded barangay hotspots. Tap one for details.</Text></View>{selected ? <View style={styles.popup}><Text style={styles.popupTitle}>{selected.barangay}</Text><Text style={styles.detail}>{selected.current_cases ?? 0} recorded historical cases • {selected.risk_level} risk</Text></View> : null}</View> : mode === "map" ? <View style={{ flex: 1 }}><View style={styles.mapNotice}><Text style={styles.mapNoticeTitle}>Map unavailable</Text><Text style={styles.detail}>{mapError || "No official boundary data is available."}</Text></View>{cards}</View> : cards}
    <View style={styles.legend}>{["Low", "Moderate", "High", "Critical"].map((x) => <View key={x} style={styles.legendItem}><View style={[styles.smallDot, { backgroundColor: riskColor(x) }]} /><Text>{x}</Text></View>)}</View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, justifyContent: "center" }, header: { padding: 20, backgroundColor: "#fff" }, title: { fontSize: 25, fontWeight: "800", color: colors.text }, subtitle: { color: colors.muted, marginTop: 3 }, period: { color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 4 }, focus: { color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 4 }, disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4 }, switch: { flexDirection: "row", backgroundColor: colors.background, padding: 4, borderRadius: 12, marginTop: 14 }, switchBtn: { flex: 1, padding: 9, alignItems: "center", borderRadius: 9 }, active: { backgroundColor: colors.primary }, activeText: { color: "#fff", fontWeight: "700" }, switchText: { color: colors.muted }, list: { padding: 15, paddingBottom: 80 }, mapNotice: { backgroundColor: colors.primaryLight, padding: 14, borderRadius: 13, margin: 15 }, mapNoticeTitle: { color: colors.text, fontWeight: "800", marginBottom: 4 }, mapHint: { position: "absolute", top: 12, left: 12, right: 12, backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 10, padding: 10, elevation: 3 }, mapHintText: { color: colors.text, fontSize: 12, textAlign: "center" }, card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", padding: 15, borderRadius: 13, marginBottom: 9 }, dot: { width: 13, height: 48, borderRadius: 7 }, area: { color: colors.text, fontWeight: "700" }, detail: { color: colors.muted, fontSize: 12, marginTop: 3 }, badge: { fontWeight: "800" }, popup: { position: "absolute", left: 15, right: 15, bottom: 25, padding: 15, borderRadius: 12, backgroundColor: "#FFF", elevation: 4 }, popupTitle: { fontWeight: "800", color: colors.text }, callout: { width: 180 }, calloutRisk: { fontWeight: "800", fontSize: 12, marginTop: 4 }, legend: { position: "absolute", left: 12, right: 12, bottom: 10, backgroundColor: "#fff", borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-around", elevation: 4 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 4 }, smallDot: { width: 9, height: 9, borderRadius: 5 } });
