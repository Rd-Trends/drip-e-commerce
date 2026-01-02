'use client'

import { Price } from '@/components/price'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@/providers/cart'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'

import { LinkButton } from '@/components/ui/button'
import { Product } from '@/payload-types'
import { DeleteItemButton } from './delete-item-button'
import { CartItemAdjuster } from './cart-item-adjuster'
import { OpenCartButton } from './open-cart-button'

export function CartModal() {
  const { cart, isOpen, setIsOpen } = useCart()

  const pathname = usePathname()

  useEffect(() => {
    // Close the cart modal when the pathname changes.
    setIsOpen(false)
  }, [pathname, setIsOpen])

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger render={<OpenCartButton quantity={totalQuantity} />} />

      <SheetContent className="flex flex-col w-full">
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>

          <SheetDescription>Manage your cart here, add items to view the total.</SheetDescription>
        </SheetHeader>

        {!cart || cart?.items?.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-2">
            <ShoppingCart className="h-16" />
            <p className="text-center text-2xl font-bold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-between w-full">
            <ul className="grow overflow-auto py-4 flex flex-col w-full gap-4 px-4">
              {cart?.items?.map((item, i) => {
                const product = item.product
                const variant = item.variant

                if (typeof product !== 'object' || !item || !product || !product.slug)
                  return <React.Fragment key={i} />

                const metaImage =
                  product.meta?.image && typeof product.meta?.image === 'object'
                    ? product.meta.image
                    : undefined

                const firstGalleryImage =
                  typeof product.gallery?.[0]?.image === 'object'
                    ? product.gallery?.[0]?.image
                    : undefined

                let image = firstGalleryImage || metaImage
                let price = product.priceInNGN

                const isVariant = Boolean(variant) && typeof variant === 'object'

                if (isVariant) {
                  price = variant?.priceInNGN

                  const imageVariant = product.gallery?.find((item) => {
                    if (!item.variantOption) return false
                    const variantOptionID =
                      typeof item.variantOption === 'object'
                        ? item.variantOption.id
                        : item.variantOption

                    const hasMatch = variant?.options?.some((option) => {
                      if (typeof option === 'object') return option.id === variantOptionID
                      else return option === variantOptionID
                    })

                    return hasMatch
                  })

                  if (imageVariant && typeof imageVariant.image === 'object') {
                    image = imageVariant.image
                  }
                }

                return (
                  <li className="flex items-start gap-4" key={i}>
                    <Link
                      href={`/products/${(item.product as Product)?.slug}`}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary p-2 group"
                    >
                      {image?.url && (
                        <Image
                          alt={image?.alt || product?.title || ''}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          height={96}
                          src={image.url}
                          width={96}
                        />
                      )}
                    </Link>

                    {/* Product Details */}
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="pr-6">
                        {/* Category/Brand */}
                        {product.categories &&
                          Array.isArray(product.categories) &&
                          product.categories.length > 0 && (
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              {typeof product.categories[0] === 'object' &&
                              'title' in product.categories[0]
                                ? product.categories[0].title
                                : 'Men Category'}
                            </p>
                          )}

                        {/* Product Title */}
                        <Link
                          href={`/products/${(item.product as Product)?.slug}`}
                          className="text-sm font-semibold text-foreground underline-offset-4 hover:underline line-clamp-1"
                        >
                          {product?.title}
                        </Link>
                      </div>

                      {/* Price and Variant Info */}
                      <div className="flex items-center gap-2 text-sm">
                        {typeof price === 'number' && (
                          <Price amount={price} className="font-bold" as="span" />
                        )}
                        {isVariant && variant && <span className="text-muted-foreground">•</span>}
                        {isVariant && variant && (
                          <p className="text-muted-foreground capitalize text-xs">
                            {variant.options
                              ?.map((option) => {
                                if (typeof option === 'object') return option.label
                                return null
                              })
                              .join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Quantity Adjuster */}
                      <div className="mt-auto flex flex-row items-center justify-between gap-4">
                        <CartItemAdjuster item={item} />
                        <DeleteItemButton item={item} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-border p-4">
              <div className="text-sm">
                {typeof cart?.subtotal === 'number' && (
                  <div className="flex items-center justify-between pb-4">
                    <p className="text-muted-foreground">Total</p>
                    <Price amount={cart?.subtotal} className="text-lg font-bold text-foreground" />
                  </div>
                )}

                <LinkButton href="/checkout" className="w-full">
                  Proceed to Checkout
                </LinkButton>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
