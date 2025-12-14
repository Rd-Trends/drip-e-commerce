import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative h-[600px] flex items-center justify-center bg-muted text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* Placeholder for hero image */}
        <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5" />
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
            Elevate Your Style with Drip
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover the latest trends in fashion. Quality pieces for the modern wardrobe.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild size="lg">
              <Link href="/shop">Shop Now</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/shop?category=new-arrivals">View New Arrivals</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
