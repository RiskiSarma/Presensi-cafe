import ErrorPage from "@/components/ui/ErrorPage";

export default function Forbidden() {
  return <ErrorPage kode="403" judul="Akses ditolak" pesan="Anda tidak punya izin untuk membuka halaman ini." />;
}
