import { HeroSection } from './_components/hero-section'
import { CategoriesSection } from './_components/categories-section'
import { ProductSection } from './_components/product-section'
import { getCachedGlobal } from '@/lib/get-global.'

export const metadata = {
  title: 'Drip E-Commerce | Home',
  description: 'Your one-stop shop for the latest fashion trends.',
}

export default async function HomePage() {
  const home = await getCachedGlobal('home', 1)()

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <main className="flex-1">
        <HeroSection slides={home.heroSlides} />
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
