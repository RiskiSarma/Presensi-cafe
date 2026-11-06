export interface AturanPassword {
  kunci: string;
  label: string;
  ok: boolean;
}

/** Aturan sama persis dengan App\Rules\PasswordKuat di backend. */
export function cekPassword(password: string): AturanPassword[] {
  return [
    { kunci: "panjang", label: "Minimal 8 karakter", ok: password.length >= 8 },
    { kunci: "besar", label: "Huruf besar (A-Z)", ok: /[A-Z]/.test(password) },
    { kunci: "kecil", label: "Huruf kecil (a-z)", ok: /[a-z]/.test(password) },
    { kunci: "angka", label: "Angka (0-9)", ok: /\d/.test(password) },
    { kunci: "simbol", label: "Simbol (! @ # $ % dll)", ok: /[^A-Za-z0-9\s]/.test(password) },
    { kunci: "spasi", label: "Tanpa spasi", ok: password.length > 0 && !/\s/.test(password) },
  ];
}

export function passwordKuat(password: string): boolean {
  return cekPassword(password).every((a) => a.ok);
}
