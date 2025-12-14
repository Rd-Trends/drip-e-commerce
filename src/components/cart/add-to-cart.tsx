'use client'

import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/hooks/use-cart-queries'
import type { Product, Variant } from '@/payload-types'

import { useCart } from '@/providers/cart'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const { cart } = useCart()
  const { mutate, isPending } = useAddToCart()
  const searchParams = useSearchParams()

  const selectedVariant = useMemo<Variant | undefined>(() => {
    const variants = product.variants?.docs || []

    if (product.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')

      const validVariant = variants.find((variant) => {
        if (typeof variant === 'object') {
          return String(variant.id) === variantId
        }
        return String(variant) === variantId
      })

      if (validVariant && typeof validVariant === 'object') {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, searchParams])

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      mutate(
        { item: { product: product.id, variant: selectedVariant?.id ?? undefined } },
        { onSuccess: () => toast.success('Item added to cart.') },
      )
    },
    [mutate, product, selectedVariant],
  )

  const disabled = useMemo<boolean>(() => {
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

  return (
    <Button
      aria-label="Add to cart"
      size="lg"
      className={clsx('w-full text-base font-semibold py-6', {
        'hover:opacity-90': true,
      })}
      disabled={disabled || isPending}
      onClick={addToCart}
      type="submit"
    >
      {isPending ? 'Adding...' : 'Add to cart'}
    </Button>
  )
}
