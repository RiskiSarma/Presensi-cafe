"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { pesanError } from "@/lib/format";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [terkirim, setTerkirim] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await api.post("/forgot-password", { email });
      setTerkirim(data.message);
    } catch (err) {
      setError(pesanError(err, "Gagal mengirim link. Coba lagi."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell judul="Lupa password?" subjudul="Masukkan email akun Anda, kami kirim link untuk membuat password baru">
      <Card>
        {terkirim ? (
          <div className="flex animate-fade-in flex-col items-center gap-3 py-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">
              <MailCheck className="h-6 w-6 text-success" />
            </span>
            <p className="text-sm text-ink">{terkirim}</p>
            <button onClick={() => setTerkirim(null)} className="text-xs text-muted underline underline-offset-2 hover:text-ink">
              Email salah? Kirim ulang ke alamat lain
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              type="email"
              label="Email terdaftar"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {error && <p className="animate-fade-in rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
            <Button type="submit" isLoading={isLoading} className="w-full">
              Kirim link reset password
            </Button>
          </form>
        )}
      </Card>

      <Link href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke halaman masuk
      </Link>
    </AuthShell>
  );
}
