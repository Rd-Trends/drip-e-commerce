import type { Product } from '@/payload-types'
import { Media } from '@/components/media'
import { Price } from '@/components/price'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import React from 'react'

export const ProductGridItem = ({
  product,
  lazyLoadMedia = false,
}: {
  product: Partial<Product>
  lazyLoadMedia?: boolean
}) => {
  const { gallery, priceInNGN, title, isFeatured } = product

  let price = priceInNGN

  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInNGN &&
      typeof variant.priceInNGN === 'number'
    ) {
      price = variant.priceInNGN
    }
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  return (
    <Link
      className="group relative p-4 flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md"
      href={`/products/${product.slug}`}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <Badge variant="destructive" className="absolute left-3 top-3 z-20 shadow-sm">
          Featured
        </Badge>
      )}

      {/* Product Image */}
      <div className="relative aspect-square w-full rounded-md overflow-hidden">
        {image ? (
          <Media
            className="h-full w-full"
            imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-md"
            resource={image}
            fill
            lazyLoad={lazyLoadMedia}
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-1.5 pt-4">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary dark:group-hover:text-card-foreground transition-colors">
          {title}
        </h3>

        {typeof price === 'number' && (
          <Price amount={price} className="text-base font-semibold text-foreground" />
        )}
      </div>
    </Link>
  )
}

export const ProductGridItemSkeleton = () => {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card">
      {/* Image Skeleton */}
      <Skeleton className="aspect-square w-full" />

      {/* Product Info Skeleton */}
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}
