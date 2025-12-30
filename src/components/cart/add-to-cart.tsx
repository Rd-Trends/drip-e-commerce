'use client'

import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/hooks/use-cart-queries'
import { useIsAddToCartDisabled, useSelectedVariant } from '@/hooks/use-product-variant'
import type { Product } from '@/payload-types'

import { useCart } from '@/providers/cart'
import clsx from 'clsx'
import { useCallback } from 'react'
import { toast } from 'sonner'
type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const { cart } = useCart()
  const { mutate, isPending } = useAddToCart()
  const selectedVariant = useSelectedVariant(product)
  const disabled = useIsAddToCartDisabled(product, selectedVariant, cart)

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
