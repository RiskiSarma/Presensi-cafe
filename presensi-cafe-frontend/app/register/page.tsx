"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { passwordKuat } from "@/lib/password";
import { pesanError } from "@/lib/format";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordChecklist from "@/components/ui/PasswordChecklist";

function RegisterForm() {
  const { register } = useAuth();
  const params = useSearchParams();
  const paketPilihan = params.get("paket"); // dari tombol harga di landing page

  const [namaBisnis, setNamaBisnis] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [setuju, setSetuju] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const kuat = passwordKuat(password);
  const cocok = konfirmasi.length > 0 && password === konfirmasi;
  const siapKirim = namaBisnis.trim().length >= 3 && name.trim().length >= 3 && email && kuat && cocok && setuju;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      // Pilih paket berbayar di landing -> setelah daftar langsung ke halaman pembayaran
      await register(
        { nama_bisnis: namaBisnis, name, email, password, password_confirmation: konfirmasi, setuju },
        paketPilihan ? "/admin/langganan" : "/admin"
      );
    } catch (err) {
      setError(pesanError(err, "Pendaftaran gagal. Coba lagi."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell judul="Daftar gratis" subjudul="Uji coba 14 hari penuh, tanpa kartu kredit" lebar="max-w-xl">
      {paketPilihan && (
        <p className="mb-4 flex items-start gap-2 rounded-lg bg-espresso-soft px-3 py-2 text-sm text-espresso-dark">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          Setelah daftar, Anda langsung diarahkan ke halaman pilih paket & pembayaran.
        </p>
      )}
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="nama_bisnis"
            label="Nama cafe / bisnis"
            placeholder="Kopi Senja"
            value={namaBisnis}
            onChange={(e) => setNamaBisnis(e.target.value)}
            required
          />
          <Input
            id="name"
            label="Nama lengkap pemilik"
            placeholder="Budi Santoso"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
          </div>
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Buat password yang kuat"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordInput
            id="konfirmasi"
            label="Ulangi password"
            placeholder="Ketik ulang password"
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            autoComplete="new-password"
            error={konfirmasi.length > 0 && !cocok ? "Password belum sama." : undefined}
            required
          />

          </div>
          {password.length > 0 && <PasswordChecklist password={password} />}
          <label className="flex cursor-pointer items-start gap-2 text-sm text-muted">
            <input type="checkbox" className="mt-0.5" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
            <span>Saya setuju dengan syarat penggunaan dan kebijakan privasi Presensi Cafe, termasuk pemrosesan data wajah pegawai.</span>
          </label>

          {error && <p className="animate-fade-in rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <Button type="submit" isLoading={isLoading} disabled={!siapKirim} className="w-full">
            Buat akun & mulai uji coba
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-espresso-dark underline-offset-2 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
