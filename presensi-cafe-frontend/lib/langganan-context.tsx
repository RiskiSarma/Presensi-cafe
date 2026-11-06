"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, FiturKey, LanggananSaya } from "./api";

interface LanggananContextValue {
  data: LanggananSaya | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  punyaFitur: (key: FiturKey) => boolean;
}

const LanggananContext = createContext<LanggananContextValue | undefined>(undefined);

export function LanggananProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LanggananSaya | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<LanggananSaya>("/langganan/saya");
      setData(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const punyaFitur = (key: FiturKey) => !!data?.fitur.includes(key);

  return (
    <LanggananContext.Provider value={{ data, isLoading, refresh, punyaFitur }}>
      {children}
    </LanggananContext.Provider>
  );
}

export function useLangganan() {
  const ctx = useContext(LanggananContext);
  if (!ctx) throw new Error("useLangganan harus dipakai di dalam LanggananProvider");
  return ctx;
}
