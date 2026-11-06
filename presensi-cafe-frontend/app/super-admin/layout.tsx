"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, LogOut, Loader2, Building2, Package, CreditCard, UserCog } from "lucide-react";
import { useRequireRole } from "@/lib/useRequireRole";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const navItems = [
  { href: "/super-admin", label: "Bisnis", icon: Building2 },
  { href: "/super-admin/paket", label: "Paket", icon: Package },
  { href: "/super-admin/pembayaran", label: "Pembayaran", icon: CreditCard },
  { href: "/super-admin/profil", label: "Profil", icon: UserCog },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireRole("super_admin");
  const { logout } = useAuth();
  const pathname = usePathname();
  const [perluDicek, setPerluDicek] = useState(0);

  // Penanda jumlah pembayaran yang menunggu verifikasi, diperbarui tiap pindah halaman
  useEffect(() => {
    if (!user) return;
    api
      .get("/super-admin/pembayaran", { params: { status: "menunggu_konfirmasi" } })
      .then(({ data }) => setPerluDicek(Array.isArray(data) ? data.length : 0))
      .catch(() => setPerluDicek(0));
  }, [user, pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-espresso" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <aside className="hidden h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-border/70 bg-surface px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-espresso-gradient shadow-warm">
            <Layers className="h-4 w-4 text-cream" />
          </span>
          <span className="font-semibold text-ink">Super Admin</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                  active
                    ? "bg-forest-soft font-medium text-forest before:absolute before:-left-4 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-forest"
                    : "text-muted hover:translate-x-0.5 hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.href === "/super-admin/pembayaran" && perluDicek > 0 && (
                  <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-xs font-medium text-white">{perluDicek}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4">
          <Link href="/super-admin/profil" className="block rounded-lg px-3 py-1.5 transition-colors hover:bg-paper">
            <p className="text-sm font-medium text-ink">{user.name}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </Link>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-danger-soft hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-espresso" />
            <span className="font-semibold text-ink">Super Admin</span>
          </div>
          <button onClick={logout} className="text-muted hover:text-danger" aria-label="Keluar">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-border bg-surface py-2 md:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${active ? "text-espresso" : "text-muted"}`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
