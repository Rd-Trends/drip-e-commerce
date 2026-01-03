import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utils/merge-open-graph'

import { OrderItem } from '@/components/order/order-item'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { LinkButton } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'

export default async function Orders() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent('/account/orders')}&warning=${encodeURIComponent('Please login to access your orders.')}`,
    )
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 0,
      pagination: false,
      user,
      overrideAccess: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
      sort: '-createdAt',
    })

    orders = ordersResult?.docs || []
  } catch (_) {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>View and manage your order history.</CardDescription>
      </CardHeader>
      <CardContent>
        {!orders || !Array.isArray(orders) || orders?.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBag className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle>No orders yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t placed any orders yet. Start shopping to see your order history
                here.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <LinkButton href="/shop">Start Shopping</LinkButton>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {orders?.map((order) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export const metadata: Metadata = {
  title: 'My Orders',
  description:
    'View your order history and track shipments. Check order status, view details, and manage returns.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: mergeOpenGraph({
    title: 'My Orders',
    url: '/account/orders',
  }),
}
