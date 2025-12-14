'use client'

import { Media } from '@/components/media'
import { Price } from '@/components/price'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Cart } from '@/payload-types'
import React from 'react'

interface OrderSummaryProps {
  cart: Cart
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ cart }) => {
  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {cart?.items?.map((item, index) => {
            if (typeof item.product === 'object' && item.product) {
              const {
                product,
                product: { id, meta, title, gallery },
                quantity,
                variant,
              } = item

              if (!quantity) return null

              let image = gallery?.[0]?.image || meta?.image
              let price = product?.priceInNGN

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

                if (imageVariant && typeof imageVariant.image !== 'string') {
                  image = imageVariant.image
                }
              }

              return (
                <div className="flex gap-4" key={index}>
                  <div className="relative h-20 w-20 shrink-0 rounded-lg border overflow-hidden bg-muted">
                    {image && typeof image !== 'string' && (
                      <Media fill imgClassName="object-cover" resource={image} />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-tight">{title}</p>
                    {variant && typeof variant === 'object' && (
                      <p className="text-xs text-muted-foreground">
                        {variant.options
                          ?.map((option) => {
                            if (typeof option === 'object') return option.label
                            return null
                          })
                          .join(', ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Qty {quantity}</span>
                      {typeof price === 'number' && (
                        <Price className="text-sm font-medium" amount={price} />
                      )}
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <Price amount={cart.subtotal || 0} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>Calculated at next step</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated taxes</span>
            <span>Calculated at next step</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total</span>
          <Price className="text-2xl font-bold" amount={cart.subtotal || 0} />
        </div>
      </CardContent>
    </Card>
  )
}
