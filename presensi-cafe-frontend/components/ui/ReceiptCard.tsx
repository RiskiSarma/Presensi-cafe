import { ReactNode } from "react";

/**
 * Signature element aplikasi ini: kartu konfirmasi presensi yang tampilannya
 * meniru struk kasir (tema cafe/kasir) - font monospace, garis putus-putus,
 * dan tepi bawah "robek" bergerigi lewat SVG zigzag.
 */
export default function ReceiptCard({ children }: { children: ReactNode }) {
  const teeth = 16;
  const points = Array.from({ length: teeth + 1 }, (_, i) => {
    const x = (i / teeth) * 300;
    const y = i % 2 === 0 ? 0 : 14;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-t-card border border-b-0 border-dashed border-border bg-surface px-6 pt-6 pb-5 font-mono text-ink">
        {children}
      </div>
      <svg viewBox="0 0 300 14" preserveAspectRatio="none" className="block h-3.5 w-full">
        <polygon points={points} fill="#FFFFFF" stroke="#E7E2DB" strokeWidth="1" />
      </svg>
    </div>
  );
}
