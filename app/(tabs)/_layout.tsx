import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function TabLayout() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={colors.primary} /></View>;
  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: "#7C8D89", tabBarStyle: { height: 65, paddingTop: 7, paddingBottom: 7 } }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="hotspots" options={{ title: "Hotspots", tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} /> }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts", tabBarIcon: ({ color, size }) => <Ionicons name="notifications" color={color} size={size} /> }} />
      <Tabs.Screen name="report" options={{ title: "Report", tabBarIcon: ({ color, size }) => <Ionicons name="megaphone" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
      <Tabs.Screen name="recommendations" options={{ href: null }} />
    </Tabs>
  );
}
