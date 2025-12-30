import * as React from 'react'

import { LinkButton } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { OrderItem } from '@/components/order/order-item'
import { Skeleton } from '@/components/ui/skeleton'
import { Order, User } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function RecentOrders({ user }: { user: User }) {
  const payload = await getPayload({ config: configPromise })
  const ordersResult = await payload.find({
    collection: 'orders',
    limit: 5,
    user,
    overrideAccess: false,
    pagination: false,
    where: {
      customer: {
        equals: user?.id,
      },
    },
  })
  const orders = ordersResult?.docs || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Your most recent orders.</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have no orders.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {orders.map((order: Order) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <LinkButton href="/account/orders" variant="outline">
          View all orders
        </LinkButton>
      </CardFooter>
    </Card>
  )
}

export const RecentOrdersSkeleton = () => {
  return (
    <Wrapper>
      <ul className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index} className="flex flex-col gap-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-20 w-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </li>
        ))}
      </ul>
    </Wrapper>
  )
}

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Your most recent orders.</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>
        <LinkButton href="/account/orders" variant="outline">
          View all orders
        </LinkButton>
      </CardFooter>
    </Card>
  )
}
