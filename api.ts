import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./src/services/api";

export { API_BASE_URL };

type RequestOptions = {
  method?: "GET" | "POST";
  body?: object;
  useToken?: boolean;
};

export async function apiRequest(path: string, options: RequestOptions = {}) {
  const token = options.useToken
    ? await AsyncStorage.getItem("denguewatch_token")
    : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiRequest("/auth/login/", {
    method: "POST",
    body: { email, password },
  });
  await AsyncStorage.setItem("denguewatch_token", data.token);
  await AsyncStorage.setItem("denguewatch_user", JSON.stringify(data.user));
  return data.user;
}

export async function loadHotspots() {
  return apiRequest("/hotspots/", { useToken: true });
}

export async function loadAlerts() {
  return apiRequest("/alerts/", { useToken: true });
}

export async function submitCommunityReport(report: {
  barangay_id: number;
  purok_id?: number;
  observation_type: string;
  description: string;
  latitude?: number;
  longitude?: number;
}) {
  return apiRequest("/community-reports/", {
    method: "POST",
    body: report,
    useToken: true,
  });
}

