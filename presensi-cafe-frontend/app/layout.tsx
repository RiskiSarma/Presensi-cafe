import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Presensi wajah untuk cafe & resto",
  applicationName: "Presensi Cafe",
  description:
    "Presensi pegawai cafe dengan pengenalan wajah dan verifikasi lokasi. Shift, lembur, izin, dan laporan dalam satu aplikasi. Coba gratis 14 hari.",
  appleWebApp: { capable: true, title: "Presensi", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#A9791F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} ${mono.variable} font-sans`}>
        <AuthProvider>{children}</AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}