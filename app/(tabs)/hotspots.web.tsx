import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { mobileApi } from "../../src/services/api";
import { colors } from "../../src/theme/colors";
import { HistoricalHotspotResponse, Hotspot } from "../../src/types";

function riskColor(level = "") {
  return (
    {
      Low: colors.low,
      Moderate: colors.moderate,
      High: colors.high,
      Critical: colors.critical,
    } as any
  )[level] || colors.muted;
}

export default function HotspotsScreen() {
  const [items, setItems] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"map" | "list">("map");
  const [period, setPeriod] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selected, setSelected] = useState<Hotspot | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    mobileApi
      .hotspots()
      .then((d: HistoricalHotspotResponse) => {
        setItems(d.hotspots);
        setPeriod(d.historical_case_period || "Historical records");
        setSelectedYear(d.selected_year_label || "All available historical years");
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const plottedHotspots = useMemo(() => {
    const located = items.filter((item) => item.latitude != null && item.longitude != null);
    if (!located.length) return [];
    const latitudes = located.map((item) => Number(item.latitude));
    const longitudes = located.map((item) => Number(item.longitude));
    const minLatitude = Math.min(...latitudes), maxLatitude = Math.max(...latitudes);
    const minLongitude = Math.min(...longitudes), maxLongitude = Math.max(...longitudes);
    const latRange = Math.max(maxLatitude - minLatitude, 0.01);
    const lngRange = Math.max(maxLongitude - minLongitude, 0.01);
    return located.map((item) => ({
      item,
      left: `${8 + ((Number(item.longitude) - minLongitude) / lngRange) * 84}%`,
      top: `${8 + ((maxLatitude - Number(item.latitude)) / latRange) * 84}%`,
    }));
  }, [items]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading dengue hotspots...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Dengue Hotspots</Text>
        <Text style={styles.subtitle}>Historical case map • {period}</Text>
        <Text style={styles.period}>Selected: {selectedYear}</Text>
        <Text style={styles.disclaimer}>Low, Moderate, High, and Critical reflect historically confirmed cases in each barangay. They support planning and awareness only; they do not diagnose dengue or determine individual risk. AI forecasts are separate staff planning information and do not color this map.</Text>

        <View style={styles.switch}>
          <TouchableOpacity
            style={[styles.switchBtn, mode === "map" && styles.active]}
            onPress={() => setMode("map")}
          >
            <Text style={mode === "map" ? styles.activeText : styles.switchText}>
              Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, mode === "list" && styles.active]}
            onPress={() => setMode("list")}
          >
            <Text style={mode === "list" ? styles.activeText : styles.switchText}>
              List
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === "map" ? (
        <ScrollView contentContainerStyle={styles.webMap}>
          <View style={styles.mapNotice}>
            <Text style={styles.mapTitle}>Dengue Hotspot Overview</Text>
            <Text style={styles.mapText}>Each colored point represents a barangay hotspot. Select a point to see the recorded case level. Open this screen in Expo Go for the full interactive boundary map.</Text>
          </View>

          <View style={styles.heatmap}>
            <Text style={styles.compass}>N</Text><Text style={styles.mapLabel}>Iligan City barangay hotspot overview</Text>
            {plottedHotspots.map(({ item, left, top }) => <TouchableOpacity key={item.id} onPress={() => setSelected(item)} style={[styles.hotspotPoint, { left, top, backgroundColor: riskColor(item.risk_level) } as any]} accessibilityLabel={`${item.barangay}, ${item.risk_level} risk`} />)}
            {selected ? <View style={styles.selectedCard}><Text style={styles.selectedArea}>{selected.barangay}</Text><Text style={styles.selectedText}>{selected.current_cases ?? 0} recorded historical cases • {selected.risk_level} risk</Text></View> : <Text style={styles.mapPrompt}>Select a colored hotspot point</Text>}
          </View>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No hotspot data</Text>
              <Text style={styles.emptyText}>
                No historical dengue hotspot records are available for this selected period.
              </Text>
            </View>
          ) : (
            items.map((x) => (
              <View key={x.id} style={styles.card}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: riskColor(x.risk_level) },
                  ]}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.area}>{x.barangay}</Text>
                  <Text style={styles.detail}>
                    {x.current_cases ?? 0} recorded historical cases • {x.risk_level} risk
                  </Text>
                  {x.latitude != null && x.longitude != null ? (
                    <Text style={styles.coordinates}>
                      Coordinates: {Number(x.latitude).toFixed(4)}, {Number(x.longitude).toFixed(4)}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.badge, { color: riskColor(x.risk_level) }]}>
                  {x.risk_level}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((x) => (
            <View key={x.id} style={styles.card}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: riskColor(x.risk_level) },
                ]}
              />
              <View style={styles.cardBody}>
                <Text style={styles.area}>{x.barangay}</Text>
                <Text style={styles.detail}>
                  {x.predicted_cases ?? "N/A"} predicted • {x.trend || "No trend"}
                </Text>
              </View>
              <Text style={[styles.badge, { color: riskColor(x.risk_level) }]}>
                {x.risk_level}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.legend}>
        {["Low", "Moderate", "High", "Critical"].map((x) => (
          <View key={x} style={styles.legendItem}>
            <View style={[styles.smallDot, { backgroundColor: riskColor(x) }]} />
            <Text>{x}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: colors.muted },
  header: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 25, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.muted, marginTop: 3 },
  period: { color: colors.primary, marginTop: 4, fontWeight: "700", fontSize: 12 },
  disclaimer: { color: colors.muted, marginTop: 4, fontSize: 11 },
  switch: {
    flexDirection: "row",
    backgroundColor: colors.background,
    padding: 4,
    borderRadius: 12,
    marginTop: 14,
  },
  switchBtn: { flex: 1, padding: 9, alignItems: "center", borderRadius: 9 },
  active: { backgroundColor: colors.primary },
  activeText: { color: "#fff", fontWeight: "700" },
  switchText: { color: colors.muted },
  webMap: { padding: 15, paddingBottom: 100 },
  mapNotice: {
    backgroundColor: "#fff",
    borderRadius: 13,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mapTitle: { color: colors.text, fontWeight: "800", fontSize: 18 },
  mapText: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  heatmap: { height: 330, borderRadius: 16, backgroundColor: "#E6F1EC", borderWidth: 1, borderColor: "#C8DDD5", overflow: "hidden", position: "relative", marginBottom: 14 },
  mapLabel: { position: "absolute", top: 14, left: 16, color: colors.text, fontWeight: "800", fontSize: 13 }, compass: { position: "absolute", top: 12, right: 16, color: colors.primary, fontWeight: "900", fontSize: 16 },
  hotspotPoint: { position: "absolute", width: 19, height: 19, borderRadius: 10, borderWidth: 3, borderColor: "#fff", transform: [{ translateX: -10 }, { translateY: -10 }], boxShadow: "0px 1px 3px rgba(0,0,0,0.25)" as any },
  mapPrompt: { position: "absolute", left: 16, right: 16, bottom: 15, backgroundColor: "rgba(255,255,255,0.9)", padding: 10, borderRadius: 9, textAlign: "center", color: colors.text, fontSize: 12 },
  selectedCard: { position: "absolute", left: 16, right: 16, bottom: 15, backgroundColor: "rgba(255,255,255,0.95)", padding: 10, borderRadius: 9 }, selectedArea: { color: colors.text, fontWeight: "800" }, selectedText: { color: colors.muted, fontSize: 12, marginTop: 3 },
  list: { padding: 15, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 13,
    marginBottom: 9,
  },
  dot: { width: 13, height: 48, borderRadius: 7 },
  cardBody: { flex: 1 },
  area: { color: colors.text, fontWeight: "700" },
  detail: { color: colors.muted, fontSize: 12, marginTop: 3 },
  coordinates: { color: colors.muted, fontSize: 11, marginTop: 5 },
  badge: { fontWeight: "800" },
  empty: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  emptyText: { color: colors.muted, textAlign: "center", marginTop: 5 },
  legend: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    elevation: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  smallDot: { width: 9, height: 9, borderRadius: 5 },
});
