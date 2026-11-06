"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coffee, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const tautan = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#harga", label: "Harga" },
  { href: "#panduan", label: "Panduan" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const { user } = useAuth();
  const [terbuka, setTerbuka] = useState(false);
  const [bergulir, setBergulir] = useState(false);

  useEffect(() => {
    const onScroll = () => setBergulir(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboard = user?.role === "super_admin" ? "/super-admin" : user?.role === "admin" ? "/admin" : "/pegawai";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        bergulir || terbuka ? "border-b border-border/70 bg-paper/85 shadow-warm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-blob bg-bistro-gradient shadow-warm">
            <Coffee className="h-4 w-4 text-cream" />
          </span>
          <span className="font-semibold text-ink">Presensi Cafe</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {tautan.map((t) => (
            <a key={t.href} href={t.href} className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink">
              {t.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link href={dashboard} className="rounded-lg bg-espresso-gradient px-4 py-2 text-sm font-medium text-white shadow-warm transition-transform hover:-translate-y-0.5">
              Buka Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface">
                Masuk
              </Link>
              <Link href="/register" className="rounded-lg bg-espresso-gradient px-4 py-2 text-sm font-medium text-white shadow-warm transition-transform hover:-translate-y-0.5">
                Coba Gratis
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-ink md:hidden"
          onClick={() => setTerbuka((t) => !t)}
          aria-label={terbuka ? "Tutup menu" : "Buka menu"}
          aria-expanded={terbuka}
        >
          {terbuka ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {terbuka && (
        <div className="animate-fade-in border-t border-border/70 px-4 pb-4 pt-2 md:hidden">
          {tautan.map((t) => (
            <a key={t.href} href={t.href} onClick={() => setTerbuka(false)} className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-surface">
              {t.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {user ? (
              <Link href={dashboard} className="col-span-2 rounded-lg bg-espresso-gradient px-4 py-2.5 text-center text-sm font-medium text-white">
                Buka Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-lg border border-border bg-surface px-4 py-2.5 text-center text-sm font-medium text-ink">
                  Masuk
                </Link>
                <Link href="/register" className="rounded-lg bg-espresso-gradient px-4 py-2.5 text-center text-sm font-medium text-white">
                  Coba Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
