import { Hero } from "@/components/landing/hero"
import { ProductPreview } from "@/components/landing/product-preview"
import { Science } from "@/components/landing/science"
import { ScrollStory } from "@/components/landing/scroll-story"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"
import { storyStages } from "@/lib/demo/margaret"

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <ScrollStory stages={storyStages} />
        <ProductPreview />
        <Science />
      </main>
      <SiteFooter />
    </>
  )
}
