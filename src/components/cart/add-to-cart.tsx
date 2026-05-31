'use client'

import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/hooks/use-cart-queries'
import { useIsAddToCartDisabled, useSelectedVariant } from '@/hooks/use-product-variant'
import type { Product } from '@/payload-types'

import { useCart } from '@/providers/cart'
import { useAuth } from '@/providers/auth'
import * as pixel from '@/lib/pixel'
import clsx from 'clsx'
import { useCallback } from 'react'
import { toast } from 'sonner'
type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const { cart } = useCart()
  const { user } = useAuth()
  const { mutate, isPending } = useAddToCart()
  const selectedVariant = useSelectedVariant(product)
  const disabled = useIsAddToCartDisabled(product, selectedVariant, cart)

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      const effectivePrice = selectedVariant?.priceInNGN ?? product.priceInNGN ?? 0

      mutate(
        { item: { product: product.id, variant: selectedVariant?.id ?? undefined } },
        {
          onSuccess: () => {
            toast.success('Item added to cart.')
            pixel.addToCart({
              contentId: product.id.toString(),
              contentName: product.title,
              value: effectivePrice / 100,
              currency: 'NGN',
              quantity: 1,
              userData: user ? { email: user.email, externalId: user.id.toString() } : undefined,
            })
          },
        },
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
