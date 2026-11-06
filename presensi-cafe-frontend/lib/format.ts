import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(n: number): string {
  return rupiah.format(n);
}

export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "-";
  return format(new Date(iso), "d MMM yyyy", { locale: localeId });
}

export function pesanError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
  const errors = e.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join(" ");
  return e.response?.data?.message ?? fallback;
}
