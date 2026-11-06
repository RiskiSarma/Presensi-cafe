import { Check, Circle } from "lucide-react";
import { cekPassword } from "@/lib/password";

/** Checklist aturan password yang ter-update langsung saat mengetik + bar kekuatan. */
export default function PasswordChecklist({ password }: { password: string }) {
  const aturan = cekPassword(password);
  const terpenuhi = aturan.filter((a) => a.ok).length;
  const persen = password ? Math.round((terpenuhi / aturan.length) * 100) : 0;
  const warna = persen === 100 ? "bg-success" : persen >= 60 ? "bg-warning" : "bg-danger";
  const label = !password ? "" : persen === 100 ? "Kuat" : persen >= 60 ? "Hampir" : "Lemah";

  return (
    <div className="rounded-lg bg-paper px-3 py-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div className={`h-full rounded-full transition-all duration-300 ${warna}`} style={{ width: `${persen}%` }} />
        </div>
        <span className="w-12 text-right text-xs font-medium text-muted">{label}</span>
      </div>
      <ul className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
        {aturan.map((a) => (
          <li key={a.kunci} className={`flex items-center gap-1.5 text-xs transition-colors ${a.ok ? "text-success" : "text-muted"}`}>
            {a.ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3 w-3 shrink-0 opacity-50" />}
            {a.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
