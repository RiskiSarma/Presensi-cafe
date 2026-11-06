import ErrorPage from "@/components/ui/ErrorPage";

export default function ServerError() {
  return <ErrorPage kode="500" judul="Ada yang tidak beres di sisi kami" pesan="Coba lagi beberapa saat. Kalau masih berlanjut, hubungi dukungan kami." />;
}
