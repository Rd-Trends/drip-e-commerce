import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function PromoBanner() {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Summer Sale is Live!</h2>
            <p className="text-lg text-primary-foreground/90">
              Get up to 50% off on selected items. Limited time offer. Don&apos;t miss out on the
              hottest styles of the season.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/shop?sale=true">Shop the Sale</Link>
            </Button>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="w-full max-w-md aspect-video bg-primary-foreground/10 rounded-lg flex items-center justify-center border-2 border-primary-foreground/20">
              <span className="text-2xl font-bold opacity-50">Promo Image</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
