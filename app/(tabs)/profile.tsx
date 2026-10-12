import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { API_BASE_URL } from "../../src/services/api";
import { colors } from "../../src/theme/colors";

function imageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/api\/mobile$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [pictureChanged, setPictureChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() {
    setEmail(user?.email || ""); setMobile(user?.contact_number || ""); setAddress(user?.address || "");
    setPicture(imageUrl(user?.profile_picture)); setPictureChanged(false); setMessage("");
  }
  useEffect(() => { if (!editing) resetForm(); }, [user, editing]);

  async function choosePicture() {
    setMessage("");
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setMessage("Allow photo-library access to choose a profile picture."); return; }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) { setPicture(result.assets[0].uri); setPictureChanged(true); }
  }

  async function saveProfile() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) { setMessage("Enter a valid email address."); return; }
    setSaving(true); setMessage("");
    try {
      const form = new FormData();
      form.append("email", normalizedEmail); form.append("contact_number", mobile.trim()); form.append("address", address.trim());
      if (pictureChanged && picture) {
        if (Platform.OS === "web") {
          const response = await fetch(picture);
          form.append("profile_picture", await response.blob(), "profile-picture.jpg");
        } else form.append("profile_picture", { uri: picture, name: "profile-picture.jpg", type: "image/jpeg" } as any);
      }
      await updateProfile(form); setEditing(false); setMessage("Profile saved successfully.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your profile."); }
    finally { setSaving(false); }
  }

  function confirmLogout() {
    Alert.alert("Log out", "Do you want to log out?", [{ text: "Cancel", style: "cancel" }, { text: "Log out", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } }]);
  }

  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}` || "R";
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.scroll}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.avatar} onPress={editing ? choosePicture : undefined} disabled={!editing} accessibilityLabel={editing ? "Choose profile picture" : "Profile picture"}>
        {picture ? <Image source={{ uri: picture }} style={styles.avatarImage} /> : <Text style={styles.initials}>{initials}</Text>}
        {editing && <View style={styles.camera}><Ionicons name="camera" size={14} color="#fff" /></View>}
      </TouchableOpacity>
      <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text><Text style={styles.role}>RESIDENT ACCOUNT</Text>
      {editing && <Text style={styles.photoHint}>Tap your photo to change it</Text>}
    </View>
    <View style={styles.content}>
      {message ? <Text style={message.includes("successfully") ? styles.success : styles.error}>{message}</Text> : null}
      {!editing ? <>
        <Info icon="mail" label="Email" value={user?.email || "Not provided"} /><Info icon="call" label="Mobile number" value={user?.contact_number || "Not provided"} />
        <Info icon="location" label="Barangay" value={user?.barangay?.name || "Not assigned"} /><Info icon="home" label="Address" value={user?.address || "Not provided"} />
        <TouchableOpacity style={styles.editButton} onPress={() => { resetForm(); setEditing(true); }}><Ionicons name="create-outline" size={21} color="#fff" /><Text style={styles.editText}>Edit profile</Text></TouchableOpacity>
      </> : <View style={styles.form}>
        <Text style={styles.formTitle}>Edit profile</Text><Text style={styles.formHelp}>You can update your photo, email, mobile number, and address. Your name and barangay are managed by DengueWatch.</Text>
        <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Mobile number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
        <Text style={styles.fieldLabel}>Complete address</Text><TextInput value={address} onChangeText={setAddress} style={[styles.input, styles.address]} multiline placeholder="Enter your complete address" placeholderTextColor={colors.muted} />
        <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={saveProfile} disabled={saving}><Text style={styles.saveText}>{saving ? "Saving..." : "Save changes"}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => { resetForm(); setEditing(false); }} disabled={saving}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
      </View>}
      <TouchableOpacity style={styles.logout} onPress={confirmLogout}><Ionicons name="log-out-outline" size={22} color={colors.danger} /><Text style={styles.logoutText}>Log Out</Text></TouchableOpacity>
    </View>
  </ScrollView></SafeAreaView>;
}

function Info({ icon, label, value }: { icon: any; label: string; value: string }) { return <View style={styles.info}><View style={styles.infoIcon}><Ionicons name={icon} size={21} color={colors.primary} /></View><View style={styles.infoText}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View></View>; }
function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) { return <View><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={colors.muted} /></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary }, scroll: { flexGrow: 1 }, header: { alignItems: "center", paddingVertical: 30 }, avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "visible" }, avatarImage: { width: 90, height: 90, borderRadius: 45 }, camera: { position: "absolute", right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" }, initials: { color: colors.primary, fontWeight: "800", fontSize: 28 }, name: { color: "#fff", fontSize: 23, fontWeight: "800", marginTop: 12 }, role: { color: "#D8EEE8", fontSize: 11, fontWeight: "700", marginTop: 4 }, photoHint: { color: "#D8EEE8", fontSize: 12, marginTop: 8 },
  content: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, minHeight: 500 }, info: { backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 10 }, infoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }, infoText: { flex: 1 }, label: { color: colors.muted, fontSize: 12 }, value: { color: colors.text, fontWeight: "700", marginTop: 2 }, editButton: { backgroundColor: colors.primary, borderRadius: 13, padding: 15, flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10 }, editText: { color: "#fff", fontWeight: "800" },
  form: { backgroundColor: "#fff", borderRadius: 14, padding: 16 }, formTitle: { color: colors.text, fontSize: 18, fontWeight: "800" }, formHelp: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 14 }, fieldLabel: { color: colors.text, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 10 }, input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#D5E3DF", borderRadius: 11, color: colors.text, paddingHorizontal: 13, minHeight: 46, fontSize: 14 }, address: { height: 86, textAlignVertical: "top", paddingTop: 12 }, saveButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 18 }, disabled: { opacity: 0.6 }, saveText: { color: "#fff", fontWeight: "800" }, cancelButton: { alignItems: "center", padding: 13, marginTop: 3 }, cancelText: { color: colors.primary, fontWeight: "800" },
  success: { backgroundColor: "#E6F5EE", color: "#167A4D", borderRadius: 10, padding: 11, marginBottom: 12, fontSize: 13 }, error: { backgroundColor: "#FFF0F0", color: colors.danger, borderRadius: 10, padding: 11, marginBottom: 12, fontSize: 13 }, logout: { borderWidth: 1, borderColor: "#F2C2C2", backgroundColor: "#FFF7F7", borderRadius: 13, padding: 15, flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 20, marginBottom: 18 }, logoutText: { color: colors.danger, fontWeight: "800" },
});
