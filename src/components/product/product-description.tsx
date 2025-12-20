'use client'
import type { Product, Variant } from '@/payload-types'

import { RichText } from '@/components/rich-text'
import { AddToCart } from '@/components/cart/add-to-cart'
import { Price } from '@/components/price'
import React, { Suspense } from 'react'

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

  return (
    <div className="flex flex-col gap-6" id="product-description">
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
