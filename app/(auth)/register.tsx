import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";

import {
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
  const [usingBundledBarangays, setUsingBundledBarangays] = useState(false);

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
    address: "",
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  async function loadLocations() {
    try {
      setLocationsLoading(true);
      setLocationsError(false);
      const data = await mobileApi.locations();
      const barangays = Array.isArray(data.barangays) ? data.barangays : [];
      if (!barangays.length) throw new Error("No barangays are available.");
      if (usingBundledBarangays) {
        // Bundled choices have local placeholder IDs. Re-select from the
        // database list after a successful refresh to obtain its real ID.
        setForm((previous) => ({ ...previous, barangay_id: 0 }));
      }
      setLocations(barangays);
      setUsingBundledBarangays(false);
    } catch {
      // The official 44 names keep the form usable while the endpoint is
      // reconnecting. Django resolves the selected canonical name on submit.
      setLocations(offlineBarangays);
      setUsingBundledBarangays(true);
      setLocationsError(false);
    } finally {
      setLocationsLoading(false);
    }
  }

  useEffect(() => { void loadLocations(); }, []);

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
    setSubmissionError("");
  }

  function showSubmissionError(message: string) {
    setSubmissionError(message);
  }

  /*
  |--------------------------------------------------------------------------
  | REGISTER USER
  |--------------------------------------------------------------------------
  */

  async function submit() {
    setSubmissionError("");
    if (!form.first_name.trim()) {
      showSubmissionError("Enter your first name.");
      return;
    }

    if (!form.last_name.trim()) {
      showSubmissionError("Enter your last name.");
      return;
    }

    if (!form.email.trim()) {
      showSubmissionError("Enter your email address.");
      return;
    }

    if (locationsLoading || !locations.length) {
      showSubmissionError("The barangay list is still loading. Please try again in a moment.");
      return;
    }

    if (!form.barangay_id) {
      showSubmissionError("Select your barangay.");
      return;
    }

    if (!form.password) {
      showSubmissionError("Enter a password.");
      return;
    }

    if (form.password.length < 8) {
      showSubmissionError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirm) {
      showSubmissionError("The passwords you entered do not match.");
      return;
    }

    try {
      setLoading(true);

      const registrationData = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        contact_number: form.contact_number.trim(),
        barangay_id: form.barangay_id > 0 ? form.barangay_id : null,
        barangay_name: locations.find((item) => item.id === form.barangay_id)?.name || "",
        // Purok/Sitio is intentionally collected with a report, not during
        // account creation, so residents can register with barangay alone.
        purok_id: null,
        address: form.address.trim(),
        password: form.password,
      };

      await register(registrationData);
      // The backend returns a mobile access token. AuthContext persists it,
      // so a confirmed registration enters the resident dashboard directly.
      router.replace("/(tabs)");
    } catch (error) {
      showSubmissionError(
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
          {usingBundledBarangays ? (
            <View style={styles.bundledNotice}>
              <Text style={styles.bundledText}>
                Official barangay choices are available. Your registration will be saved as soon as the DengueWatch service is reachable.
              </Text>
              <TouchableOpacity onPress={() => void loadLocations()}>
                <Text style={styles.retryText}>Retry connection</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
          {submissionError ? (
            <View accessibilityRole="alert" style={styles.submissionError}>
              <Ionicons name="alert-circle-outline" size={18} color="#B42318" />
              <Text style={styles.submissionErrorText}>{submissionError}</Text>
            </View>
          ) : null}

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

  bundledNotice: {
    marginTop: 8,
    gap: 5,
  },

  bundledText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
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

  submissionError: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
  },

  submissionErrorText: {
    flex: 1,
    color: "#B42318",
    fontSize: 13,
    lineHeight: 18,
  },
});
