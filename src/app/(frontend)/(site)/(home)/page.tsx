import { HeroSection } from './_components/hero-section'
import { CategoriesSection } from './_components/categories-section'
import { ProductSection } from './_components/product-section'
import { getCachedGlobal } from '@/lib/get-global.'
import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utils/merge-open-graph'

export const metadata: Metadata = {
  title: 'Drip - Fits Over Feelings',
  description:
    'Shop the latest fashion trends at Drip. Discover classic and flashy styles that make a statement. Fast delivery across Nigeria.',
  alternates: {
    canonical: '/',
  },
  openGraph: mergeOpenGraph({
    title: 'Drip - Fits Over Feelings',
    description:
      'Shop the latest fashion trends at Drip. Discover classic and flashy styles that make a statement. Fast delivery across Nigeria.',
    url: '/',
  }),
  twitter: {
    card: 'summary_large_image',
    title: 'Drip - Fits Over Feelings',
    description:
      'Shop the latest fashion trends at Drip. Discover classic and flashy styles that make a statement. Fast delivery across Nigeria.',
    images: ['/og-image.jpg'],
  },
}

export default async function HomePage() {
  const home = await getCachedGlobal('home', 1)()

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <main className="flex-1">
        <HeroSection slides={home.heroSlides || []} />
        <CategoriesSection />

        {/* Render product sections */}
        {home.productSections?.map((section, index) => (
          <ProductSection
            key={index}
            title={section.title}
            type={section.type}
            category={section.category ?? undefined}
            showViewAll={Boolean(section.showViewAll)}
          />
        ))}
      </main>
    </div>
  )
}
