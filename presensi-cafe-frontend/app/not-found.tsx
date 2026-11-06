import ErrorPage from "@/components/ui/ErrorPage";

export default function NotFound() {
  return <ErrorPage kode="404" judul="Halaman tidak ditemukan" pesan="Halaman yang dicari mungkin sudah dipindah atau memang tidak pernah ada." />;
}
