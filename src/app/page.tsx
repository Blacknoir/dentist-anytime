import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Hero } from "@/components/home/hero"
import { HowItWorks } from "@/components/home/how-it-works"
import { FeaturedDentists } from "@/components/home/featured-dentists"
import { PopularTreatments } from "@/components/home/popular-treatments"
import { getDentists } from "@/app/actions/dentists"
import { getBlogPosts } from "@/app/actions/blog"
import { LatestBlogPosts } from "@/components/home/latest-blog-posts"

export default async function Home() {
  const dentists = await getDentists()
  const posts = await getBlogPosts()

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <HowItWorks />
      <FeaturedDentists initialDentists={dentists} />
      <PopularTreatments />
      <LatestBlogPosts posts={posts} />
      <Footer />
    </main>
  );
}
