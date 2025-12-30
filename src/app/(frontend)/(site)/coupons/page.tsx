import { Section } from '@/components/layout/section'
import { Container } from '@/components/layout/container'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, LinkButton } from '@/components/ui/button'
import { Tag, Clock, ShoppingBag } from 'lucide-react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Metadata } from 'next'
import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { Coupon } from '@/payload-types'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  description: 'View all available coupon codes and special offers.',
  openGraph: mergeOpenGraph({
    title: 'Available Coupons',
    url: '/coupons',
  }),
  title: 'Available Coupons',
}

async function getCoupons() {
  const payload = await getPayload({ config: configPromise })

  const now = new Date()

  const result = await payload.find({
    collection: 'coupons',
    where: {
      and: [
        {
          active: {
            equals: true,
          },
        },
        {
          validFrom: {
            less_than_equal: now.toISOString(),
          },
        },
        {
          validUntil: {
            greater_than: now.toISOString(),
          },
        },
      ],
    },
    sort: '-createdAt',
    limit: 50,
  })

  return result.docs as Coupon[]
}

export default async function CouponsPage() {
  return (
    <Section paddingY="xs" className="pb-20 md:pb-0">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Tag className="h-8 w-8" />
            Available Coupons
          </h1>
          <p className="text-muted-foreground">
            Save more on your favorite items with our exclusive coupon codes
          </p>
        </div>

        <Suspense fallback={<CouponListSkeleton />}>
          <CouponList />
        </Suspense>
      </Container>
    </Section>
  )
}

async function CouponList() {
  const coupons = await getCoupons()

  if (coupons.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Tag className="h-12 w-12" />
          </EmptyMedia>
          <EmptyTitle>No Active Coupons</EmptyTitle>
          <EmptyDescription>
            Check back later for new offers and deals on your favorite items.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <LinkButton href="/shop" variant="outline" size="sm">
            Browse Products
          </LinkButton>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {coupons.map((coupon) => {
        const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null
        const minPurchase = coupon.minPurchaseAmount
          ? Math.floor(coupon.minPurchaseAmount / 100)
          : null
        const discountText =
          coupon.type === 'percentage'
            ? `${coupon.value}% OFF`
            : coupon.fixedAmount
              ? `₦${Math.floor(coupon.fixedAmount / 100).toLocaleString()} OFF`
              : 'DISCOUNT'

        return (
          <Card key={coupon.id} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold font-mono">{coupon.code}</CardTitle>
                  <CardDescription className="mt-1">
                    {coupon.description || 'Special discount offer'}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1 font-semibold">
                  {discountText}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {minPurchase && minPurchase > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Min. purchase: ₦{minPurchase.toLocaleString()}</span>
                </div>
              )}
              {validUntil && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Valid until: {validUntil.toLocaleDateString()}</span>
                </div>
              )}
              {coupon.usageLimit && coupon.usageLimit > 0 && (
                <div className="text-sm text-muted-foreground">
                  {coupon.usageLimit - (coupon.usageCount || 0)} uses remaining
                </div>
              )}
              <Button variant="outline" className="w-full">
                Copy Code
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function CouponListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
