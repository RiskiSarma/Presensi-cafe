"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LogOut,
  Loader2,
  MapPin,
  CreditCard,
  Lock,
} from "lucide-react";
import { useRequireRole } from "@/lib/useRequireRole";
import { useAuth } from "@/lib/auth-context";
import { LanggananProvider, useLangganan } from "@/lib/langganan-context";
import type { AuthUser, FiturKey } from "@/lib/api";
import LanggananBanner from "@/components/ui/LanggananBanner";
import { AksesDitutup, FiturTerkunci } from "@/components/ui/AksesDitutup";

const navItems: { href: string; label: string; icon: typeof Coffee; fitur?: FiturKey }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pegawai", label: "Pegawai", icon: Users },
  { href: "/admin/shift", label: "Shift & Jadwal", icon: CalendarDays },
  { href: "/admin/presensi", label: "Laporan Presensi", icon: ClipboardCheck },
  { href: "/admin/izin", label: "Pengajuan Izin", icon: FileText, fitur: "izin" },
  { href: "/admin/cabang", label: "Cabang", icon: MapPin },
  { href: "/admin/langganan", label: "Langganan", icon: CreditCard },
];

// Halaman yang tetap bisa dibuka walau langganan habis (supaya admin bisa bayar)
const HALAMAN_BEBAS = ["/admin/langganan", "/admin/profil"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireRole("admin");
  const { logout } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-espresso" />
      </div>
    );
  }

  return (
    <LanggananProvider>
      <AdminShell user={user} logout={logout}>
        {children}
      </AdminShell>
    </LanggananProvider>
  );
}

function AdminShell({ user, logout, children }: { user: AuthUser; logout: () => void; children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, isLoading, punyaFitur } = useLangganan();

  const bebas = HALAMAN_BEBAS.includes(pathname);
  const itemTerkunci = navItems.find((i) => i.fitur && pathname === i.href && !punyaFitur(i.fitur));

  function renderKonten() {
    if (isLoading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-espresso" />
        </div>
      );
    }
    if (data && !data.akses && !bebas) {
      return data.status === "nonaktif" ? (
        <AksesDitutup
          judul="Akun bisnis dinonaktifkan"
          pesan="Akses ke akun bisnis ini sedang ditutup. Hubungi pengelola aplikasi untuk informasi lebih lanjut."
          tampilkanTombol={false}
        />
      ) : (
        <AksesDitutup
          judul={
            data.status === "tanpa_langganan"
              ? "Belum ada langganan aktif"
              : data.adalah_trial
                ? "Masa uji coba gratis Anda sudah berakhir"
                : "Langganan Anda sudah berakhir"
          }
          pesan="Akun dinonaktifkan: pegawai belum bisa presensi sampai Anda berlangganan. Data Anda tetap aman dan utuh."
        />
      );
    }
    if (itemTerkunci) return <FiturTerkunci nama={itemTerkunci.label} />;
    return children;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <aside className="hidden h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-border/70 bg-surface px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-espresso-gradient shadow-warm">
            <Coffee className="h-4 w-4 text-cream" />
          </span>
          <span className="font-semibold text-ink">Presensi Cafe</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const terkunci = !!item.fitur && !!data && !punyaFitur(item.fitur);
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
                {terkunci && <Lock className="ml-auto h-3.5 w-3.5 text-muted/70" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4">
          {data?.paket && (
            <Link
              href="/admin/langganan"
              className="mb-3 block rounded-lg bg-espresso-soft px-3 py-2 text-xs text-espresso-dark transition-colors hover:bg-latte/50"
            >
              Paket <span className="font-semibold">{data.paket.nama}</span>
              {data.status === "trial" && " (percobaan)"}
            </Link>
          )}
          <Link href="/admin/profil" className="block rounded-lg px-3 py-1.5 transition-colors hover:bg-paper">
            <p className="text-sm font-medium text-ink">{user.name}</p>
            <p className="text-xs text-muted">Owner Cafe</p>
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

      {/* Mobile topbar sederhana */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-espresso" />
            <span className="font-semibold text-ink">Presensi Cafe</span>
          </div>
          <button onClick={logout} className="text-muted hover:text-danger">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {data && pathname !== "/admin/langganan" && <LanggananBanner data={data} />}

        <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">{renderKonten()}</main>

        {/* Bottom nav mobile */}
        <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-border bg-surface py-2 md:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-1 py-1 text-[10px] ${
                  active ? "text-espresso" : "text-muted"
                }`}
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
