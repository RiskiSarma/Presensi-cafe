"use client";

import { useState, FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ProfilSayaPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inginGantiPassword = password.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const payload: Record<string, string> = { name, email };
      if (inginGantiPassword) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
        payload.current_password = currentPassword;
      }

      await api.put("/profil", payload);
      await refreshUser();

      setSuccess(true);
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : "Gagal menyimpan profil.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Profil Saya</h1>
      <p className="mb-6 text-sm text-muted">Ubah nama, email, atau password akun kamu</p>

      <Card className="max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <div className="mt-2 border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-ink">Ganti Password (opsional)</p>
            <div className="flex flex-col gap-3">
              <Input
                label="Password Saat Ini"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Isi kalau mau ganti password"
              />
              <Input
                label="Password Baru"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                minLength={8}
              />
            </div>
          </div>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          {success && (
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Profil berhasil diperbarui.
            </p>
          )}

          <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
            Simpan Perubahan
          </Button>
        </form>
      </Card>
    </div>
  );
}
