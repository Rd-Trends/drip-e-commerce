'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAddToCart, useUpdateCartItemQuantity } from '@/hooks/use-cart-queries'
import {
  useSelectedVariant,
  useGetCartItemForVariant,
  useAvailableVariants,
  useIsAddToCartDisabled,
} from '@/hooks/use-product-variant'
import { useProductPrice } from '@/hooks/use-product-price'
import type { Product, Variant } from '@/payload-types'
import { Price } from '@/components/price'
import { useCart } from '@/providers/cart'
import { useCurrency } from '@/providers/currency'
import { cn } from '@/lib/utils'
import clsx from 'clsx'
import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MinusIcon, PlusIcon } from 'lucide-react'

type Props = {
  product: Product
}

export function StickyAddToCart({ product }: Props) {
  const { cart } = useCart()
  const { currency } = useCurrency()
  const { mutate: addToCart, isPending: isAdding } = useAddToCart()
  const { mutate: updateQuantity, isPending: isUpdating } = useUpdateCartItemQuantity()
  const [isVisible, setIsVisible] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const isPending = isAdding || isUpdating

  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  // Use custom hooks
  const selectedVariant = useSelectedVariant(product)
  const getCartItemForVariant = useGetCartItemForVariant(product.id)
  const availableVariants = useAvailableVariants(product)
  const disabled = useIsAddToCartDisabled(product, selectedVariant, cart)
  const { amount, lowestAmount, highestAmount } = useProductPrice(product, selectedVariant)

  const handleAddToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      // If product has variants and none selected, open the sheet
      if (hasVariants && !selectedVariant) {
        setIsSheetOpen(true)
        return
      }

      addToCart(
        { item: { product: product.id, variant: selectedVariant?.id ?? undefined } },
        {
          onSuccess: () => {
            toast.success('Item added to cart.')
            setIsSheetOpen(false)
          },
        },
      )
    },
    [addToCart, product, selectedVariant, hasVariants],
  )

  // Handle increment/decrement for variants
  const handleVariantQuantityChange = useCallback(
    (variantId: number, action: 'increment' | 'decrement') => {
      const cartItem = getCartItemForVariant(variantId)

      if (cartItem && cartItem.id) {
        // Item exists in cart, update it
        updateQuantity(
          { itemID: cartItem.id, action },
          {
            onSuccess: () => {
              if (action === 'decrement' && cartItem.quantity === 1) {
                toast.success('Item removed from cart.')
              }
            },
          },
        )
      } else if (action === 'increment') {
        // Item doesn't exist, add it
        addToCart(
          { item: { product: product.id, variant: variantId } },
          {
            onSuccess: () => {
              toast.success('Item added to cart.')
            },
          },
        )
      }
    },
    [getCartItemForVariant, updateQuantity, addToCart, product.id],
  )

  // Set up intersection observer to detect when main button is out of view
  useEffect(() => {
    // Find the main add to cart button in the ProductDescription component
    const mainButton = document.querySelector('[aria-label="Add to cart"]')

    if (!mainButton) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky button when main button is not visible
        setIsVisible(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px',
      },
    )

    observer.observe(mainButton)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <Fragment>
      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 lg:hidden',
          'border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80',
          {
            'translate-y-0': isVisible,
            'translate-y-full': !isVisible,
          },
        )}
      >
        <div className="container flex items-center gap-4 p-4">
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-medium truncate">{product.title}</p>
            <div className="text-sm font-semibold">
              {hasVariants && selectedVariant ? (
                <Price amount={amount} />
              ) : hasVariants ? (
                <Price highestAmount={highestAmount} lowestAmount={lowestAmount} />
              ) : (
                <Price amount={amount} />
              )}
            </div>
          </div>
          <Button
            aria-label="Add to cart sticky"
            size="lg"
            className="flex-1 whitespace-nowrap font-semibold"
            disabled={(disabled || isPending) && (!hasVariants || Boolean(selectedVariant))}
            onClick={handleAddToCart}
            type="submit"
          >
            {isPending ? 'Adding...' : 'Add to cart'}
          </Button>
        </div>
      </div>

      {/* Variant Selection Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-fit max-h-[85lvh] overflow-y-auto rounded-t-xl flex flex-col gap-0"
        >
          <SheetHeader className="border-b">
            <SheetTitle className="text-left">Please select a variation</SheetTitle>
            {availableVariants.length > 0 && (
              <SheetDescription>
                These are the available variants for this product. Select the desired quantity to
                add to your cart.
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            {availableVariants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No variants are currently available for sale for this product.
              </p>
            ) : (
              availableVariants.map((variant) => {
                const variantPriceField = `priceIn${currency.code}` as keyof Variant
                const variantPrice =
                  variantPriceField in variant && typeof variant[variantPriceField] === 'number'
                    ? variant[variantPriceField]
                    : 0
                const inventory = variant.inventory || 0
                const cartItem = getCartItemForVariant(variant.id)
                const quantity = cartItem?.quantity || 0

                return (
                  <div key={variant.id} className="flex items-center justify-between p-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{variant.displayLabel}</p>
                      <Price
                        className="text-md font-semibold mt-1"
                        amount={variantPrice as number}
                      />
                      <p className="text-sm text-destructive mt-1">
                        {inventory <= 5 ? `${inventory} units left` : 'Few units left'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <VariantQuantityAdjuster
                        inventory={inventory}
                        quantity={quantity}
                        onIncrement={() => handleVariantQuantityChange(variant.id, 'increment')}
                        onDecrement={() => handleVariantQuantityChange(variant.id, 'decrement')}
                        isPending={isPending}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <SheetFooter className="bg-background pt-4 pb-2 border-t flex-col gap-2">
            <Button
              variant="outline"
              size="lg"
              className="w-full font-semibold"
              onClick={() => setIsSheetOpen(false)}
            >
              Continue Shopping
            </Button>
            <Button
              size="lg"
              className="w-full font-semibold"
              disabled={availableVariants.length === 0}
              onClick={() => {
                setIsSheetOpen(false)
                // Open cart modal by triggering the cart button
                const cartButton = document.querySelector(
                  '[aria-label="Open cart"]',
                ) as HTMLButtonElement
                if (cartButton) {
                  cartButton.click()
                }
              }}
              type="button"
            >
              Go to Cart
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Fragment>
  )
}

// Variant quantity adjuster component matching CartItemAdjuster design
function VariantQuantityAdjuster({
  inventory,
  quantity,
  onIncrement,
  onDecrement,
  isPending,
}: {
  inventory: number
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
  isPending: boolean
}) {
  const canDecrement = quantity > 0
  const canIncrement = quantity < inventory

  return (
    <div className="ml-auto flex h-9 flex-row items-center rounded-lg border">
      <button
        disabled={!canDecrement || isPending}
        aria-label="Reduce item quantity"
        className={cn(
          'ease hover:cursor-pointer flex h-full min-w-9 max-w-9 flex-none items-center justify-center rounded-full px-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80 ml-auto',
          {
            'cursor-not-allowed': !canDecrement || isPending,
          },
        )}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (canDecrement) {
            onDecrement()
          }
        }}
        type="button"
      >
        <MinusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
      </button>
      <p className="w-6 text-center">
        <span className="w-full text-sm">{quantity}</span>
      </p>
      <button
        disabled={!canIncrement || isPending}
        aria-label="Increase item quantity"
        className={cn(
          'ease hover:cursor-pointer flex h-full min-w-9 max-w-9 flex-none items-center justify-center rounded-full px-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80',
          {
            'cursor-not-allowed': !canIncrement || isPending,
          },
        )}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (canIncrement) {
            onIncrement()
          }
        }}
        type="button"
      >
        <PlusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
      </button>
    </div>
  )
}
