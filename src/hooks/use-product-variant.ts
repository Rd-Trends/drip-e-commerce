'use client'

import { useCart } from '@/providers/cart'
import type { Product, Variant, VariantOption, Cart } from '@/payload-types'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useCallback, useMemo } from 'react'

/**
 * Hook to get the currently selected variant based on URL search params
 */
export function useSelectedVariant(product: Product): Variant | undefined {
  const [variantId] = useQueryState('variant', parseAsInteger.withDefault(0))

  return useMemo<Variant | undefined>(() => {
    const variants = product.variants?.docs || []

    if (product.enableVariants && variants.length && variantId) {
      const validVariant = variants.find((variant) => {
        if (typeof variant === 'object') {
          return variant.id === variantId
        }
        return variant === variantId
      })

      if (validVariant && typeof validVariant === 'object') {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, product.variants?.docs, variantId])
}

/**
 * Hook to get a cart item for a specific variant
 */
export function useGetCartItemForVariant(productId: number) {
  const { cart } = useCart()

  return useCallback(
    (variantId: number) => {
      return cart?.items?.find((item) => {
        const productID = typeof item.product === 'object' ? item.product?.id : item.product
        const variantID = item.variant
          ? typeof item.variant === 'object'
            ? item.variant?.id
            : item.variant
          : undefined

        return productID === productId && variantID === variantId
      })
    },
    [cart?.items, productId],
  )
}

/**
 * Hook to get available variants with inventory > 0
 */
export function useAvailableVariants(product: Product) {
  return useMemo(() => {
    const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

    if (!hasVariants) return []

    const variants = product.variants?.docs || []
    return variants
      .filter((variant): variant is Variant => {
        return typeof variant === 'object' && Boolean(variant.inventory && variant.inventory > 0)
      })
      .map((variant) => {
        // Build variant label from options
        const optionLabels = variant.options
          ?.filter((option): option is VariantOption => typeof option === 'object')
          .map((option) => option.label)
          .join(' - ')

        return {
          ...variant,
          displayLabel: optionLabels || 'Variant',
        }
      })
  }, [product.enableVariants, product.variants])
}

/**
 * Hook to check if add to cart should be disabled
 */
export function useIsAddToCartDisabled(
  product: Product,
  selectedVariant: Variant | undefined,
  cart: Cart | null | undefined,
): boolean {
  return useMemo<boolean>(() => {
    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID === product.id) {
        if (product.enableVariants) {
          return variantID === selectedVariant?.id
        }
        return true
      }
    })

    if (existingItem) {
      const existingQuantity = existingItem.quantity

      if (product.enableVariants) {
        return existingQuantity >= (selectedVariant?.inventory || 0)
      }
      return existingQuantity >= (product.inventory || 0)
    }

    if (product.enableVariants) {
      if (!selectedVariant) {
        return true
      }

      if (selectedVariant.inventory === 0) {
        return true
      }
    } else {
      if (product.inventory === 0) {
        return true
      }
    }

    return false
  }, [selectedVariant, cart?.items, product])
}
