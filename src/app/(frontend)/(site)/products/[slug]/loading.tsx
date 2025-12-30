import { LinkButton } from '@/components/ui/button'
import { Section } from '@/components/layout/section'
import { Container } from '@/components/layout/container'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeftIcon } from 'lucide-react'
import { GallerySkeleton } from '@/components/product/gallery'
import { ProductDescriptionSkeleton } from '@/components/product/product-description'
import { ShippingTimeline } from '@/components/product/shipping-timeline'

export default function ProductLoading() {
  return (
    <>
      <Section paddingY="xs">
        <Container>
          <LinkButton href="/shop" variant="ghost" className="mb-4">
            <ChevronLeftIcon />
            All products
          </LinkButton>
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-8">
            {/* Gallery Skeleton */}
            <div className="h-full w-full basis-full lg:basis-1/2">
              <GallerySkeleton />
            </div>

            {/* Product Description Skeleton */}
            <div className="basis-full lg:basis-1/2 space-y-6">
              <ProductDescriptionSkeleton />
            </div>
          </div>
        </Container>
      </Section>

      {/* Shipping Timeline & Size Guide Skeleton */}
      <Section paddingY="md">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <ShippingTimeline />
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
