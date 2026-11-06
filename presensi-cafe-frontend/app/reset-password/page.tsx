"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { passwordKuat } from "@/lib/password";
import { pesanError } from "@/lib/format";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordChecklist from "@/components/ui/PasswordChecklist";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [berhasil, setBerhasil] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cocok = konfirmasi.length > 0 && password === konfirmasi;
  const linkRusak = !token || !email;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/reset-password", { token, email, password, password_confirmation: konfirmasi });
      setBerhasil(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(pesanError(err, "Gagal mengubah password."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell judul="Buat password baru" subjudul={email ? `Untuk akun ${email}` : "Link reset tidak lengkap"}>
      <Card>
        {berhasil ? (
          <div className="flex animate-fade-in flex-col items-center gap-3 py-2 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-sm text-ink">Password berhasil diubah. Mengarahkan ke halaman masuk...</p>
          </div>
        ) : linkRusak ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-sm text-ink">Link ini tidak lengkap. Minta link baru lewat halaman lupa password.</p>
            <Link href="/lupa-password" className="text-sm font-medium text-espresso-dark underline underline-offset-2">
              Minta link baru
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordInput
              id="password"
              label="Password baru"
              placeholder="Buat password yang kuat"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {password.length > 0 && <PasswordChecklist password={password} />}
            <PasswordInput
              id="konfirmasi"
              label="Ulangi password baru"
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              autoComplete="new-password"
              error={konfirmasi.length > 0 && !cocok ? "Password belum sama." : undefined}
              required
            />
            {error && (
              <p className="animate-fade-in rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}{" "}
                <Link href="/lupa-password" className="underline">
                  Minta link baru
                </Link>
              </p>
            )}
            <Button type="submit" isLoading={isLoading} disabled={!passwordKuat(password) || !cocok} className="w-full">
              Simpan password baru
            </Button>
          </form>
        )}
      </Card>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
