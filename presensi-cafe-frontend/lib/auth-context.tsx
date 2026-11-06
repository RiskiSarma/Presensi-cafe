"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, AuthUser } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface RegisterPayload {
  nama_bisnis: string;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  setuju: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    const storedToken = localStorage.getItem("auth_token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/login", { email, password });
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setUser(data.user);

    if (data.user.role === "super_admin") {
      router.push("/super-admin");
    } else if (data.user.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/pegawai");
    }
  }

  // Daftar mandiri: akun langsung login, lalu diarahkan ke redirectTo (default dashboard admin)
  async function register(payload: RegisterPayload, redirectTo = "/admin") {
    const { data } = await api.post("/register", payload);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setUser(data.user);
    router.push(redirectTo);
  }

  async function logout() {
    try {
      await api.post("/logout");
    } catch {
      // Tetap lanjut hapus sesi lokal walau request logout gagal
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    router.push("/login");
  }

  async function refreshUser() {
    const { data } = await api.get("/me");
    localStorage.setItem("auth_user", JSON.stringify(data));
    setUser(data);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
