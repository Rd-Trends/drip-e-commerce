import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/price'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utils/format-date-time'
import { mergeOpenGraph } from '@/utils/merge-open-graph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { ProductItem } from '@/components/product/item-card'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderStatus } from '@/components/order/order-status'
import { AddressItem } from '@/components/addresses/address-item'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function Order({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id } = await params
  const { email = '' } = await searchParams

  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: !Boolean(user),
      depth: 2,
      where: {
        and: [
          {
            id: {
              equals: id,
            },
          },
          ...(user
            ? [
                {
                  customer: {
                    equals: user.id,
                  },
                },
              ]
            : []),
          ...(email
            ? [
                {
                  customerEmail: {
                    equals: email,
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        amount: true,
        currency: true,
        items: true,
        customerEmail: true,
        customer: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true,
      },
    })

    const canAccessAsGuest =
      !user &&
      email &&
      orderResult &&
      orderResult.customerEmail &&
      orderResult.customerEmail === email
    const canAccessAsUser =
      user &&
      orderResult &&
      orderResult.customer &&
      (typeof orderResult.customer === 'object'
        ? orderResult.customer.id
        : orderResult.customer) === user.id

    if (orderResult && (canAccessAsGuest || canAccessAsUser)) {
      order = orderResult
    }
  } catch (error) {
    // console.error(error)
  }

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/orders">
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back to orders</span>
          </Link>
        </Button>
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
                {order.amount && <Price amount={order.amount} />}
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

export const metadata: Metadata = {
  title: 'Order Details',
  description: 'View your order details.',
  openGraph: mergeOpenGraph({
    title: 'Order Details',
    url: '/orders/[id]',
  }),
}
