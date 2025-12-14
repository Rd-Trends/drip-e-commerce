'use client'
import type { Product, Variant } from '@/payload-types'

import { RichText } from '@/components/rich-text'
import { AddToCart } from '@/components/cart/add-to-cart'
import { Price } from '@/components/price'
import React, { Suspense } from 'react'
import { Star } from 'lucide-react'
import Link from 'next/link'

import { VariantSelector } from './variant-selector'
;('@/providers/currency')
import { StockIndicator } from '@/components/product/stockInd-indicator'
import { useCurrency } from '@/providers/currency'

export function ProductDescription({ product }: { product: Product }) {
  const { currency } = useCurrency()
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  if (hasVariants) {
    const priceField = `priceIn${currency.code}` as keyof Variant
    const variantsOrderedByPrice = product.variants?.docs
      ?.filter((variant) => variant && typeof variant === 'object')
      .sort((a, b) => {
        if (
          typeof a === 'object' &&
          typeof b === 'object' &&
          priceField in a &&
          priceField in b &&
          typeof a[priceField] === 'number' &&
          typeof b[priceField] === 'number'
        ) {
          return a[priceField] - b[priceField]
        }

        return 0
      }) as Variant[]

    const lowestVariant = variantsOrderedByPrice[0][priceField]
    const highestVariant = variantsOrderedByPrice[variantsOrderedByPrice.length - 1][priceField]
    if (
      variantsOrderedByPrice &&
      typeof lowestVariant === 'number' &&
      typeof highestVariant === 'number'
    ) {
      lowestAmount = lowestVariant
      highestAmount = highestVariant
    }
  } else if (product[priceField] && typeof product[priceField] === 'number') {
    amount = product[priceField]
  }

  // Mock rating data - replace with actual data from product if available
  const rating = 3.9
  const reviewCount = 512

  return (
    <div className="flex flex-col gap-6">
      {/* Title and Price */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
        <div className="text-3xl font-semibold">
          {hasVariants ? (
            <Price highestAmount={highestAmount} lowestAmount={lowestAmount} />
          ) : (
            <Price amount={amount} />
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-lg font-medium">{rating}</span>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : star === Math.ceil(rating) && rating % 1 !== 0
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-none text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        <Link href="#reviews" className="text-sm text-primary hover:underline font-medium">
          See all {reviewCount} reviews
        </Link>
      </div>

      {/* Description */}
      {product.description ? (
        <RichText
          className="text-muted-foreground"
          data={product.description}
          enableGutter={false}
        />
      ) : null}

      {/* Variant Selector */}
      {hasVariants && (
        <Suspense fallback={null}>
          <VariantSelector product={product} />
        </Suspense>
      )}

      {/* Stock Indicator */}
      <Suspense fallback={null}>
        <StockIndicator product={product} />
      </Suspense>

      {/* Add to Cart Button */}
      <Suspense fallback={null}>
        <AddToCart product={product} />
      </Suspense>
    </div>
  )
}
