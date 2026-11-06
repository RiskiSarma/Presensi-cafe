"use client";

// Dipakai kalau error terjadi di level paling atas (layout). Tanpa Tailwind karena layout utama ikut gagal.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FAF9F6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #E7E2DB", borderRadius: 20, padding: "40px 32px", maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#A9791F" }}>500</div>
          <h1 style={{ fontSize: 18, color: "#24211D", margin: "8px 0 10px" }}>Ada yang tidak beres di sisi kami</h1>
          <p style={{ fontSize: 14, color: "#6B6459", lineHeight: 1.6, marginBottom: 24 }}>Silakan coba lagi beberapa saat.</p>
          <button onClick={reset} style={{ background: "#A9791F", color: "#fff", border: 0, padding: "11px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
