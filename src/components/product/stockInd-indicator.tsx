'use client'
import { useSelectedVariant } from '@/hooks/use-product-variant'
import { Product } from '@/payload-types'
import { useMemo } from 'react'

export const StockIndicator = ({ product }: { product: Product }) => {
  const selectedVariant = useSelectedVariant(product)

  const stockQuantity = useMemo(() => {
    if (product.enableVariants) {
      if (selectedVariant) {
        return selectedVariant.inventory || 0
      }
    }
    return product.inventory || 0
  }, [product.enableVariants, selectedVariant, product.inventory])

  if (product.enableVariants && !selectedVariant) {
    return null
  }

  const showStockIndicator = stockQuantity === 0 || stockQuantity < 10

  if (!showStockIndicator) {
    return null
  }

  return (
    <div className="uppercase font-mono text-sm font-medium text-muted-foreground">
      {stockQuantity < 10 && stockQuantity > 0 && <p>Only {stockQuantity} left in stock</p>}
      {(stockQuantity === 0 || !stockQuantity) && <p>Out of stock</p>}
    </div>
  )
}
