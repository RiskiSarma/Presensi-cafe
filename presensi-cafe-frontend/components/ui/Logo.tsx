import Image from "next/image";

/**
 * Logo brand. Untuk mengganti logo cukup timpa file di folder public/:
 *   public/logo-mark.png  -> simbol (dipakai di sidebar, login, navbar, dsb.)
 *   public/logo.png       -> logo lengkap dengan tulisan
 */

/** Simbol logo tanpa latar. Atur ukuran lewat className, mis. "h-6 w-6". */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="Presensi Cafe"
      width={128}
      height={128}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

/** Simbol di dalam kotak putih membulat, tetap terbaca di atas latar apa pun. */
export function LogoTile({ className = "h-9 w-9 rounded-xl" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-white shadow-warm ring-1 ring-black/5 ${className}`}>
      <LogoMark className="h-full w-full p-1" />
    </span>
  );
}

/** Logo lengkap (simbol + tulisan KARYALOKAL). */
export function LogoFull({ className = "h-16 w-auto" }: { className?: string }) {
  return <Image src="/logo.png" alt="KaryaLokal" width={600} height={600} className={`object-contain ${className}`} />;
}
