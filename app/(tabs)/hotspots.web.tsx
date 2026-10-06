import { useCallback, useState } from "react";
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
import { Hotspot } from "../../src/types";

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

  const load = useCallback(() => {
    setLoading(true);
    mobileApi
      .hotspots()
      .then((d) => {
        setItems(d.hotspots);
        setPeriod(d.forecast_period || "Latest forecast");
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
        <Text style={styles.subtitle}>AI-assisted forecast • {period}</Text>

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
            <Text style={styles.mapTitle}>Dengue Hotspot Map</Text>
            <Text style={styles.mapText}>
              The interactive native map is available on Android/iOS. The web
              version shows the same hotspot data below so the dashboard works
              in Chrome without loading the native map component.
            </Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No hotspot data</Text>
              <Text style={styles.emptyText}>
                No dengue hotspot records are available for this forecast period.
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
                    {x.predicted_cases ?? "N/A"} predicted cases • {x.trend || "No trend"}
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
