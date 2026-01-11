import type { Order } from '@/payload-types'
import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderDetails } from '@/components/order/order-details'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { LinkButton } from '@/components/ui/button'
import { PackageX } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AuthOrderPage({ params }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  // Show message if not authenticated
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent('/account/orders')}&warning=${encodeURIComponent('Please login to access your orders.')}`,
    )
  }

  const { id } = await params

  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      depth: 2,
      where: {
        and: [
          {
            id: {
              equals: id,
            },
          },
          {
            customer: {
              equals: user.id,
            },
          },
        ],
      },
      select: {
        grandTotal: true,
        subtotal: true,
        shippingFee: true,
        tax: true,
        discount: true,
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

    if (orderResult) {
      order = orderResult
    }
  } catch (_) {
    // console.error(error)
  }

  if (!order) {
    return (
      <Card>
        <Empty>
          <EmptyHeader>
            <PackageX className="size-12 text-muted-foreground" />
            <EmptyTitle>Order Not Found</EmptyTitle>
            <EmptyDescription>
              We couldn&apos;t find the order you&apos;re looking for. It may have been deleted or
              you may not have permission to view it.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <LinkButton href="/account/orders" variant="outline" scrollToTop>
              View All Orders
            </LinkButton>
          </EmptyContent>
        </Empty>
      </Card>
    )
  }

  return <OrderDetails order={order} backHref="/account/orders" />
}

export const metadata: Metadata = {
  title: 'Order Details',
  description:
    'View complete details of your order including items, shipping information, and payment status.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: mergeOpenGraph({
    title: 'Order Details',
  }),
}
