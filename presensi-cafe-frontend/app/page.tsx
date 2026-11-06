import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Fitur from "@/components/landing/Fitur";
import CaraKerja from "@/components/landing/CaraKerja";
import Harga from "@/components/landing/Harga";
import Panduan from "@/components/landing/Panduan";
import Faq from "@/components/landing/Faq";
import { Cta, Footer } from "@/components/landing/CtaFooter";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Fitur />
      <CaraKerja />
      <Harga />
      <Panduan />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}
