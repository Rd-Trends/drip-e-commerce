import type { Order } from '@/payload-types'
import { Price } from '@/components/price'
import { LinkButton } from '@/components/ui/button'
import { formatDateTime } from '@/utils/format-date-time'
import { ChevronLeftIcon } from 'lucide-react'
import { ProductItem } from '@/components/product/item-card'
import { OrderStatus } from '@/components/order/order-status'
import { AddressItem } from '@/components/addresses/address-item'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface OrderDetailsProps {
  order: Order
  backHref?: string
}

export function OrderDetails({ order, backHref = '/orders' }: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <LinkButton href={backHref} variant="outline" size="icon">
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="sr-only">Back to orders</span>
        </LinkButton>
        <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Order {order.id}</CardTitle>
                <CardDescription>
                  Placed on{' '}
                  <time dateTime={order.createdAt}>
                    {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
                  </time>
                </CardDescription>
              </div>
              {order.status && <OrderStatus status={order.status} />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-4">
                {order.items?.map((item, index) => {
                  if (typeof item.product === 'string') {
                    return null
                  }

                  if (!item.product || typeof item.product !== 'object') {
                    return <div key={index}>This item is no longer available.</div>
                  }

                  const variant =
                    item.variant && typeof item.variant === 'object' ? item.variant : undefined

                  return (
                    <ProductItem
                      key={index}
                      product={item.product}
                      quantity={item.quantity}
                      variant={variant}
                    />
                  )
                })}
              </div>
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                {order.grandTotal && <Price amount={order.grandTotal} />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            {/* @ts-expect-error - some kind of type hell */}
            {order.shippingAddress && <AddressItem address={order.shippingAddress} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1">
              <span className="font-medium">Email</span>
              <span className="text-muted-foreground">{order.customerEmail}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
