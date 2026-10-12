import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

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

const metroApiBaseUrl = developmentApiBaseUrl();
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
  __DEV__ && metroApiBaseUrl && !useConfiguredHttpsApi
    ? metroApiBaseUrl
    : (configuredApiBaseUrl || "http://127.0.0.1:8000/api/mobile")
).replace(/\/$/, "");

type Options = { method?: "GET" | "POST"; body?: object; useToken?: boolean; token?: string | null };

export async function apiRequest(path: string, options: Options = {}) {
  const token = options.useToken
    ? (options.token ?? await AsyncStorage.getItem("denguewatch_token"))
    : null;

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError"
      ? "The request timed out."
      : "The server could not be reached.";
    throw new Error(
      `${reason} API: ${API_BASE_URL}. Start Django on 0.0.0.0:8000 and connect the phone to the same network.`
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
  boundaries: () => apiRequest("/boundaries/"),
  register: (body: object) => apiRequest("/auth/register/", { method: "POST", body }),
  login: (email: string, password: string) =>
    apiRequest("/auth/login/", { method: "POST", body: { email, password } }),
  logout: (token?: string | null) => apiRequest("/auth/logout/", { method: "POST", useToken: true, token }),
  me: () => apiRequest("/me/", { useToken: true }),
  hotspots: () => apiRequest("/hotspots/?source=historical", { useToken: true }),
  alerts: () => apiRequest("/alerts/", { useToken: true }),
  notifications: () => apiRequest("/notifications/", { useToken: true }),
  markNotificationsRead: (ids: number[]) =>
    apiRequest("/notifications/", { method: "POST", body: { ids }, useToken: true }),
  reports: () => apiRequest("/community-reports/", { useToken: true }),
  submitReport: (body: object) =>
    apiRequest("/community-reports/", { method: "POST", body, useToken: true }),
};
