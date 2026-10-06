import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/**
 * Set EXPO_PUBLIC_API_BASE_URL in .env.local when running against a device.
 * Example: http://192.168.1.15:8000/api/mobile
 */
function developmentApiBaseUrl() {
  // Expo Go runs on the phone, so 127.0.0.1 would point at the phone rather
  // than the computer running Django. Metro provides the computer's LAN host
  // in development; use it automatically unless an explicit .env URL exists.
  const config = Constants.expoConfig as { hostUri?: string } | null;
  const hostUri = config?.hostUri;
  const host = hostUri?.split(":")[0];
  return host && host !== "localhost" && host !== "127.0.0.1"
    ? `http://${host}:8000/api/mobile`
    : "http://127.0.0.1:8000/api/mobile";
}

const metroApiBaseUrl = developmentApiBaseUrl();
// In Expo Go development, Metro always knows the computer's current LAN
// address. Prefer it over a stale .env.local value after changing routers.
// Release builds continue to use the explicitly configured production URL.
export const API_BASE_URL = (
  __DEV__ && !metroApiBaseUrl.includes("127.0.0.1")
    ? metroApiBaseUrl
    : (process.env.EXPO_PUBLIC_API_BASE_URL || metroApiBaseUrl)
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
  } catch {
    throw new Error("Unable to reach the server. Confirm the phone and computer use the same Wi-Fi network.");
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
  reports: () => apiRequest("/community-reports/", { useToken: true }),
  submitReport: (body: object) =>
    apiRequest("/community-reports/", { method: "POST", body, useToken: true }),
};
