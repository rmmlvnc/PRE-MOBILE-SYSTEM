import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { mobileApi } from "../services/api";
import { Resident } from "../types";

type AuthValue = {
  user: Resident | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: object) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await AsyncStorage.getItem("denguewatch_token");
      if (!token) return;
      const data = await mobileApi.me();
      setUser(data.user);
    } catch {
      await AsyncStorage.multiRemove(["denguewatch_token", "denguewatch_user"]);
    } finally {
      setLoading(false);
    }
  }

  async function saveSession(data: any) {
    await AsyncStorage.setItem("denguewatch_token", data.token);
    await AsyncStorage.setItem("denguewatch_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    const data = await mobileApi.login(email.trim().toLowerCase(), password);
    await saveSession(data);
  }

  async function register(form: object) {
    // Registration deliberately does not create a local session. The user is
    // sent to the sign-in screen so the login endpoint is the single place
    // that persists an access token.
    await mobileApi.register(form);
  }

  async function logout() {
    // Always end the local session first. This lets residents leave the app
    // even when the Django server is offline; the token is still revoked when
    // the server can be reached.
    const token = await AsyncStorage.getItem("denguewatch_token");
    await AsyncStorage.multiRemove(["denguewatch_token", "denguewatch_user"]);
    setUser(null);

    try {
      if (token) await mobileApi.logout(token);
    } catch {
      // The device is already signed out. A revoked/expired token cannot be
      // reused locally, so a network failure must not block logout.
    }
  }

  async function refreshProfile() {
    const data = await mobileApi.me();
    setUser(data.user);
    await AsyncStorage.setItem("denguewatch_user", JSON.stringify(data.user));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
