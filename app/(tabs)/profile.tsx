import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  function confirmLogout() {
    Alert.alert("Log out", "Do you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          // Replace the tabs route so the Back button cannot reopen a
          // protected resident screen after logout.
          router.replace("/(auth)/login");
        },
      },
    ]);
  }
  return <SafeAreaView style={styles.safe}><View style={styles.header}><View style={styles.avatar}><Text style={styles.initials}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Text></View><Text style={styles.name}>{user?.first_name} {user?.last_name}</Text><Text style={styles.role}>RESIDENT ACCOUNT</Text></View><View style={styles.content}>
    <Info icon="mail" label="Email" value={user?.email || "Not provided"} /><Info icon="call" label="Mobile number" value={user?.contact_number || "Not provided"} /><Info icon="location" label="Barangay" value={user?.barangay?.name || "Not assigned"} /><Info icon="home" label="Address" value={user?.address || "Not provided"} />
    <View style={styles.notice}><Ionicons name="information-circle" size={23} color={colors.primary} /><Text style={styles.noticeText}>This resident account can only be used in the DengueWatch mobile application.</Text></View>
    <TouchableOpacity style={styles.logout} onPress={confirmLogout}><Ionicons name="log-out-outline" size={22} color={colors.danger} /><Text style={styles.logoutText}>Log Out</Text></TouchableOpacity>
  </View></SafeAreaView>;
}
function Info({ icon, label, value }: { icon: any; label: string; value: string }) { return <View style={styles.info}><View style={styles.infoIcon}><Ionicons name={icon} size={21} color={colors.primary} /></View><View><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View></View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.primary }, header: { alignItems: "center", paddingVertical: 35 }, avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }, initials: { color: colors.primary, fontWeight: "800", fontSize: 28 }, name: { color: "#fff", fontSize: 23, fontWeight: "800", marginTop: 12 }, role: { color: "#D8EEE8", fontSize: 11, fontWeight: "700", marginTop: 4 }, content: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20 }, info: { backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 10 }, infoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }, label: { color: colors.muted, fontSize: 12 }, value: { color: colors.text, fontWeight: "700", marginTop: 2 }, notice: { backgroundColor: colors.primaryLight, padding: 14, borderRadius: 13, flexDirection: "row", gap: 10, marginTop: 8 }, noticeText: { flex: 1, color: colors.text, lineHeight: 19, fontSize: 13 }, logout: { borderWidth: 1, borderColor: "#F2C2C2", backgroundColor: "#FFF7F7", borderRadius: 13, padding: 15, flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 20 }, logoutText: { color: colors.danger, fontWeight: "800" } });
