'use client'

import type { Product, Variant } from '@/payload-types'
import { useCurrency } from '@/providers/currency'
import { useMemo } from 'react'

type PriceResult = {
  amount: number
  lowestAmount: number
  highestAmount: number
  hasRange: boolean
}

/**
 * Hook to calculate product price based on variants and selected variant
 * Returns amount for single price, or lowestAmount/highestAmount for price range
 */
export function useProductPrice(
  product: Product,
  selectedVariant?: Variant | undefined,
): PriceResult {
  const { currency } = useCurrency()

  return useMemo(() => {
    const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)
    let amount = 0,
      lowestAmount = 0,
      highestAmount = 0

    const priceField = `priceIn${currency.code}` as keyof Product

    if (hasVariants && selectedVariant) {
      // Single variant selected - use its price
      const variantPriceField = `priceIn${currency.code}` as keyof Variant
      if (
        variantPriceField in selectedVariant &&
        typeof selectedVariant[variantPriceField] === 'number'
      ) {
        amount = selectedVariant[variantPriceField]
      }
    } else if (hasVariants) {
      // No variant selected - calculate price range
      const variantPriceField = `priceIn${currency.code}` as keyof Variant
      const variantsOrderedByPrice = product.variants?.docs
        ?.filter((variant) => variant && typeof variant === 'object')
        .sort((a, b) => {
          if (
            typeof a === 'object' &&
            typeof b === 'object' &&
            variantPriceField in a &&
            variantPriceField in b &&
            typeof a[variantPriceField] === 'number' &&
            typeof b[variantPriceField] === 'number'
          ) {
            return a[variantPriceField] - b[variantPriceField]
          }
          return 0
        }) as Variant[]

      const lowestVariant = variantsOrderedByPrice[0]?.[variantPriceField]
      const highestVariant =
        variantsOrderedByPrice[variantsOrderedByPrice.length - 1]?.[variantPriceField]
      if (typeof lowestVariant === 'number' && typeof highestVariant === 'number') {
        lowestAmount = lowestVariant
        highestAmount = highestVariant
      }
    } else if (product[priceField] && typeof product[priceField] === 'number') {
      // No variants - use product price
      amount = product[priceField]
    }

    return {
      amount,
      lowestAmount,
      highestAmount,
      hasRange: Boolean(hasVariants && !selectedVariant && lowestAmount !== highestAmount),
    }
  }, [product, selectedVariant, currency.code])
}
