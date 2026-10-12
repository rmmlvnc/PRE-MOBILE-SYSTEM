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
  updateProfile: (form: FormData) => Promise<void>;
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

  async function login(email: string, password: string) {
    const data = await mobileApi.login(email.trim().toLowerCase(), password);
    await AsyncStorage.setItem("denguewatch_token", data.token);
    await AsyncStorage.setItem("denguewatch_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(form: object) {
    const data = await mobileApi.register(form);
    if (!data?.token || !data?.user) {
      throw new Error("Registration completed without a valid resident session.");
    }
    await AsyncStorage.setItem("denguewatch_token", data.token);
    await AsyncStorage.setItem("denguewatch_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function logout() {
    const token = await AsyncStorage.getItem("denguewatch_token");
    await AsyncStorage.multiRemove(["denguewatch_token", "denguewatch_user"]);
    setUser(null);

    try {
      if (token) await mobileApi.logout(token);
    } catch {
      // The local session has already been cleared. A failed remote logout
      // must not prevent the resident from leaving the app.
    }
  }

  async function refreshProfile() {
    const data = await mobileApi.me();
    setUser(data.user);
    await AsyncStorage.setItem("denguewatch_user", JSON.stringify(data.user));
  }

  async function updateProfile(form: FormData) {
    const data = await mobileApi.updateProfile(form);
    setUser(data.user);
    await AsyncStorage.setItem("denguewatch_user", JSON.stringify(data.user));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
