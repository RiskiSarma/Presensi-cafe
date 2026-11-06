"use client";

import { Coffee, LogOut } from "lucide-react";
import { useRequireRole } from "@/lib/useRequireRole";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function PegawaiLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireRole("pegawai");
  const { logout } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-espresso" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-sm items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-espresso" />
            <div>
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="text-xs capitalize text-muted">{user.pegawai_profil?.jabatan}</p>
            </div>
          </div>
          <button onClick={logout} className="text-muted hover:text-danger" aria-label="Keluar">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
