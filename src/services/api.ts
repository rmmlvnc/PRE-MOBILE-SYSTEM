import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Set EXPO_PUBLIC_API_BASE_URL in .env.local when running against a device.
 * Example: http://192.168.1.15:8000/api/mobile
 */
function developmentApiBaseUrl() {
  // Expo Go runs on the phone, so 127.0.0.1 would point at the phone rather
  // than the computer running Django. In SDK 57 the current development host
  // can be present on expoConfig or Expo Go's debugger configuration.
  const config = Constants.expoConfig as { hostUri?: string } | null;
  const expoGoConfig = Constants.expoGoConfig as { debuggerHost?: string } | null;
  const hostUri = config?.hostUri ?? expoGoConfig?.debuggerHost;
  const host = hostUri?.replace(/^\w+:\/\//, "").split(":")[0];

  return host && host !== "localhost" && host !== "127.0.0.1"
    ? `http://${host}:8000/api/mobile`
    : null;
}

function browserApiBaseUrl() {
  // A browser running Expo web is on the same computer as Django. Do not use
  // a saved Wi-Fi address here: it becomes stale whenever the network changes.
  if (typeof window === "undefined" || !window.location.hostname) return null;
  const host = window.location.hostname === "localhost"
    ? "127.0.0.1"
    : window.location.hostname;
  return `http://${host}:8000/api/mobile`;
}

const metroApiBaseUrl = developmentApiBaseUrl();
const webApiBaseUrl = browserApiBaseUrl();
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
// A deployed API or an HTTPS development tunnel must take precedence over
// Metro's LAN host. This is needed when a phone hotspot/client-isolation rule
// blocks direct access to the laptop, while preserving automatic LAN setup for
// normal same-Wi-Fi development.
const useConfiguredHttpsApi = configuredApiBaseUrl?.startsWith("https://");
// In Expo Go development, Metro always knows the computer's current LAN
// address. Prefer it over a stale .env.local value after changing routers.
// An explicit HTTPS URL is retained for hosted deployments and local tunnels.
export const API_BASE_URL = (
  __DEV__ && !useConfiguredHttpsApi && Platform.OS === "web" && webApiBaseUrl
    ? webApiBaseUrl
    : __DEV__ && metroApiBaseUrl && !useConfiguredHttpsApi
      ? metroApiBaseUrl
    : (configuredApiBaseUrl || "http://127.0.0.1:8000/api/mobile")
).replace(/\/$/, "");

type Options = {
  method?: "GET" | "POST";
  body?: object | FormData;
  useToken?: boolean;
  token?: string | null;
};

export async function apiRequest(path: string, options: Options = {}) {
  const token = options.useToken
    ? (options.token ?? await AsyncStorage.getItem("denguewatch_token"))
    : null;

  let response: Response;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 10000);
  try {
    const body = options.body;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const requestBody: BodyInit | undefined = !body
      ? undefined
      : isFormData
        ? body as FormData
        : JSON.stringify(body);
    const request = fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: requestBody,
      signal: controller.signal,
    });
    response = await Promise.race([
      request,
      new Promise<never>((_, reject) => setTimeout(
        () => reject(new Error("DengueWatch service request timed out.")),
        10500,
      )),
    ]);
  } catch (error) {
    const reason = timedOut || (error instanceof Error && error.name === "AbortError")
      ? "The request timed out."
      : "The server could not be reached.";
    throw new Error(
      `${reason} The mobile app could not reach the DengueWatch service at ${API_BASE_URL}.`
    );
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const preview = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
    throw new Error(`Server error (${response.status}). ${preview || "Expected a JSON API response."}`);
  }

  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export const mobileApi = {
  health: () => apiRequest("/health/"),
  locations: () => apiRequest("/locations/"),
  puroks: (barangayId: number) => apiRequest(`/locations/${barangayId}/puroks/`),
  boundaries: () => apiRequest("/boundaries/"),
  register: (body: object) => apiRequest("/auth/register/", { method: "POST", body }),
  login: (email: string, password: string) =>
    apiRequest("/auth/login/", { method: "POST", body: { email, password } }),
  logout: (token?: string | null) => apiRequest("/auth/logout/", { method: "POST", useToken: true, token }),
  me: () => apiRequest("/me/", { useToken: true }),
  updateProfile: (form: FormData) =>
    apiRequest("/profile/", { method: "POST", body: form, useToken: true }),
  hotspots: () => apiRequest("/hotspots/?source=historical", { useToken: true }),
  alerts: () => apiRequest("/alerts/", { useToken: true }),
  notifications: () => apiRequest("/notifications/", { useToken: true }),
  markNotificationsRead: (ids: number[]) =>
    apiRequest("/notifications/", { method: "POST", body: { ids }, useToken: true }),
  reports: () => apiRequest("/community-reports/", { useToken: true }),
  submitReport: (body: object) =>
    apiRequest("/community-reports/", { method: "POST", body, useToken: true }),
};
