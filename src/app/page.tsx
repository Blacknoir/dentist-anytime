import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Hero } from "@/components/home/hero"
import { HowItWorks } from "@/components/home/how-it-works"
import { FeaturedDentists } from "@/components/home/featured-dentists"
import { PopularTreatments } from "@/components/home/popular-treatments"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <HowItWorks />
      <FeaturedDentists />
      <PopularTreatments />
      <Footer />
    </main>
  );
}
