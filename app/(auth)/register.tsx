import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../src/context/AuthContext";
import { API_BASE_URL, mobileApi } from "../../src/services/api";
import { Barangay } from "../../src/types";
import { offlineBarangays } from "../../src/data/locations";
import { colors } from "../../src/theme/colors";

/*
|--------------------------------------------------------------------------
| BARANGAY LIST
|--------------------------------------------------------------------------
| These are the choices that will appear in the Barangay dropdown.
|
| IMPORTANT:
| The IDs should match the Barangay IDs in your backend/database
| if your registration API expects barangay_id.
|--------------------------------------------------------------------------
*/

export default function RegisterScreen() {
  const { register } = useAuth();
  const [locations, setLocations] = useState<Barangay[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState(false);
  const [usingOfflineLocations, setUsingOfflineLocations] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    barangay_id: 0,
    purok_id: 0,
    address: "",
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);

  async function loadLocations() {
    try {
      setLocationsLoading(true);
      setLocationsError(false);
      const data = await mobileApi.locations();
      const barangays = Array.isArray(data.barangays) ? data.barangays : [];
      if (!barangays.length) throw new Error("No barangays are available.");
      setLocations(barangays);
      setUsingOfflineLocations(false);
    } catch {
      // Do not leave the resident stuck on a loading picker. The official
      // list can be used until the local server is reachable again.
      setLocations(offlineBarangays);
      setUsingOfflineLocations(true);
      setLocationsError(false);
    } finally {
      setLocationsLoading(false);
    }
  }

  useEffect(() => { void loadLocations(); }, []);

  const puroks = useMemo(
    () => locations.find((barangay) => barangay.id === form.barangay_id)?.puroks ?? [],
    [locations, form.barangay_id]
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE FORM
  |--------------------------------------------------------------------------
  */

  function update(
    field: string,
    value: string | number
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | REGISTER USER
  |--------------------------------------------------------------------------
  */

  async function submit() {
    if (!form.first_name.trim()) {
      Alert.alert("Required", "Please enter your first name.");
      return;
    }

    if (!form.last_name.trim()) {
      Alert.alert("Required", "Please enter your last name.");
      return;
    }

    if (!form.email.trim()) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }

    if (locationsLoading || locationsError || !locations.length) {
      Alert.alert("Locations unavailable", "Load the barangay list before registering.");
      return;
    }

    if (!form.barangay_id) {
      Alert.alert("Required", "Please select your barangay.");
      return;
    }

    if (!form.password) {
      Alert.alert("Required", "Please enter a password.");
      return;
    }

    if (form.password.length < 8) {
      Alert.alert(
        "Password",
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (form.password !== form.confirm) {
      Alert.alert(
        "Password mismatch",
        "The passwords you entered do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const registrationData = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        contact_number: form.contact_number.trim(),
        barangay_id: form.barangay_id,
        barangay_name: locations.find((item) => item.id === form.barangay_id)?.name || "",
        purok_id: form.purok_id || null,
        address: form.address.trim(),
        password: form.password,
      };

      await register(registrationData);
      // Alert button callbacks are not consistently supported by React Native
      // Web. Navigate directly so a successful web registration cannot remain
      // trapped on this screen.
      router.replace({
        pathname: "/(auth)/login",
        params: { registered: "1", email: registrationData.email },
      });
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >

          {/* BACK BUTTON */}
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* TITLE */}
          <Text style={styles.title}>
            Create resident account
          </Text>

          <Text style={styles.subtitle}>
            Register to receive dengue information
            for your area.
          </Text>

          {/* FIRST NAME + LAST NAME */}
          <View style={styles.row}>

            <View style={styles.half}>
              <Text style={styles.label}>
                First name *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={form.first_name}
                onChangeText={(value) =>
                  update("first_name", value)
                }
              />
            </View>

            <View style={styles.half}>
              <Text style={styles.label}>
                Last name *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={form.last_name}
                onChangeText={(value) =>
                  update("last_name", value)
                }
              />
            </View>

          </View>

          {/* EMAIL */}
          <Text style={styles.label}>
            Email address *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) =>
              update("email", value)
            }
          />

          {/* MOBILE */}
          <Text style={styles.label}>
            Mobile number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            keyboardType="phone-pad"
            value={form.contact_number}
            onChangeText={(value) =>
              update("contact_number", value)
            }
          />

          {/* ================================================= */}
          {/* BARANGAY */}
          {/* ================================================= */}

          <Text style={styles.label}>
            Barangay *
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.barangay_id}
              enabled={!locationsLoading && !locationsError}
              onValueChange={(value) => {
                update(
                  "barangay_id",
                  Number(value)
                );

                /*
                 * Reset Purok whenever Barangay changes.
                 */
                update("purok_id", 0);
              }}
            >

              {/* DEFAULT OPTION */}
              <Picker.Item
                label={locationsLoading ? "Loading barangays..." : "Select barangay"}
                value={0}
              />

              {/* BARANGAY OPTIONS */}
              {locations.map((barangay) => (
                <Picker.Item
                  key={barangay.id}
                  label={barangay.name}
                  value={barangay.id}
                />
              ))}

            </Picker>
          </View>

          {locationsError ? (
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadLocations()}>
              <Text style={styles.retryText}>Could not load barangays — tap to retry</Text>
              <Text style={styles.retryHint}>Server: {API_BASE_URL}</Text>
            </TouchableOpacity>
          ) : null}
          {usingOfflineLocations ? <Text style={styles.offlineHint}>Using the official 44-barangay list. Purok is optional until the server connection is restored.</Text> : null}

          {/* ================================================= */}
          {/* PUROK */}
          {/* ================================================= */}

          <Text style={styles.label}>
            Purok / Sitio
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.purok_id}
              enabled={form.barangay_id !== 0}
              onValueChange={(value) =>
                update(
                  "purok_id",
                  Number(value)
                )
              }
            >

              <Picker.Item
                label={
                  form.barangay_id
                    ? "Select purok (optional)"
                    : "Select barangay first"
                }
                value={0}
              />
              {puroks.map((purok) => (
                <Picker.Item key={purok.id} label={purok.name} value={purok.id} />
              ))}

            </Picker>
          </View>

          {/* ADDRESS */}
          <Text style={styles.label}>
            Complete address
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.addressInput,
            ]}
            placeholder="Enter your complete address"
            multiline
            numberOfLines={4}
            value={form.address}
            onChangeText={(value) =>
              update("address", value)
            }
          />

          {/* PASSWORD */}
          <Text style={styles.label}>
            Password *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            secureTextEntry
            value={form.password}
            onChangeText={(value) =>
              update("password", value)
            }
          />

          {/* CONFIRM PASSWORD */}
          <Text style={styles.label}>
            Confirm password *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            secureTextEntry
            value={form.confirm}
            onChangeText={(value) =>
              update("confirm", value)
            }
          />

          {/* REGISTER BUTTON */}
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            disabled={loading}
            onPress={submit}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Creating account..."
                : "Register"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: 20,
    paddingBottom: 50,
  },

  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },

  subtitle: {
    color: colors.muted,
    marginTop: 5,
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  half: {
    flex: 1,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    height: 42,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.text,
  },

  addressInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  pickerContainer: {
    height: 42,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },

  retryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  retryHint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },

  offlineHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },

  button: {
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
