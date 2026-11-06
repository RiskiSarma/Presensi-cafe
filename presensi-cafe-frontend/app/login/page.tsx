"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Coffee, ScanFace, Sparkles, Leaf, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Card from "@/components/ui/Card";
import CoffeeBeanPattern from "@/components/ui/CoffeeBeanPattern";
import OrganicBlob from "@/components/ui/OrganicBlob";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Email atau password salah. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Panel dekoratif - dwiwarna mustard + hijau tua, bentuk organik biar gak kaku */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-bistro-gradient lg:flex">
        <CoffeeBeanPattern className="text-cream" opacity={0.1} />
        <OrganicBlob className="absolute -left-20 -top-24 h-72 w-72 bg-latte/25 blur-3xl" />
        <OrganicBlob className="absolute -bottom-28 -right-16 h-96 w-96 bg-forest-light/20 blur-3xl" />
        <OrganicBlob className="absolute right-16 top-1/3 h-24 w-24 bg-cream/15" />

        <div className="relative z-10 flex max-w-sm flex-col items-start gap-5 px-10 text-cream">
          <Link href="/" aria-label="Ke beranda" className="flex h-14 w-14 items-center justify-center rounded-blob bg-cream/15 backdrop-blur transition-transform hover:scale-105">
            <Coffee className="h-7 w-7" />
          </Link>
          <h1 className="text-3xl font-semibold leading-tight">
            Presensi hangat,<br />secepat pesanan.
          </h1>
          <p className="text-sm leading-relaxed text-cream/75">
            Kelola kehadiran, shift, dan tim cafe & resto kamu dengan pengenalan wajah — tanpa kertas, tanpa ribet.
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-full bg-cream/15 px-4 py-2 text-xs text-cream/85 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Ditenagai face recognition
          </div>
          <div className="flex items-center gap-2 text-xs text-cream/60">
            <Leaf className="h-3.5 w-3.5" />
            Dibuat untuk bisnis F&B yang gesit
          </div>
        </div>
      </div>

      {/* Form login */}
      <div className="relative flex w-full flex-1 items-center justify-center px-4 py-12 lg:w-1/2">
        <CoffeeBeanPattern className="text-espresso lg:hidden" opacity={0.04} />
        <Link
          href="/"
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Beranda
        </Link>

        <div className="relative w-full max-w-sm animate-fade-in-up">
          <Link href="/" className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-blob bg-bistro-gradient shadow-warm">
              <Coffee className="h-6 w-6 text-cream" />
            </div>
            <h1 className="text-xl font-semibold text-ink">Presensi Cafe</h1>
          </Link>

          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-semibold text-ink">Selamat datang kembali</h2>
            <p className="mt-1 text-sm text-muted">Masuk untuk lanjut ke akun kamu</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <PasswordInput
                  id="password"
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <Link href="/lupa-password" className="self-end text-xs text-muted transition-colors hover:text-espresso-dark">
                  Lupa password?
                </Link>
              </div>
              {error && (
                <p className="animate-fade-in rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
              )}
              <Button type="submit" isLoading={isLoading} className="mt-1 w-full">
                Masuk
              </Button>
            </form>
          </Card>

          <p className="mt-4 text-center text-sm text-muted">
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-espresso-dark underline-offset-2 hover:underline">
              Daftar gratis
            </Link>
          </p>

          <Link
            href="/kiosk"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-forest/30 py-3 text-sm text-muted transition-all duration-150 hover:-translate-y-0.5 hover:border-forest hover:bg-forest-soft/40 hover:text-forest"
          >
            <ScanFace className="h-4 w-4" />
            Buka mode Kiosk (tablet cafe)
          </Link>
        </div>
      </div>
    </div>
  );
}
