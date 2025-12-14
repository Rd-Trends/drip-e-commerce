import { HeroSection } from './_components/hero-section'
import { FeaturedCategories } from './_components/featured-categories'
import { NewArrivals } from './_components/new-arrivals'
import { TrendingProducts } from './_components/trending-products'
import { PromoBanner } from './_components/promo-banner'
import { Newsletter } from './_components/newsletter'

export const metadata = {
  title: 'Drip E-Commerce | Home',
  description: 'Your one-stop shop for the latest fashion trends.',
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturedCategories />
      <NewArrivals />
      <PromoBanner />
      <TrendingProducts />
      {/* <Newsletter /> */}
    </div>
  )
}
