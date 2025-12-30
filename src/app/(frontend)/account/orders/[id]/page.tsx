import type { Order } from '@/payload-types'
import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { notFound } from 'next/navigation'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderDetails } from '@/components/order/order-details'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AuthOrderPage({ params }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  // Redirect to login if not authenticated
  if (!user) {
    notFound()
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
    notFound()
  }

  return <OrderDetails order={order} backHref="/account/orders" />
}

export const metadata: Metadata = {
  title: 'Order Details',
  description: 'View your order details.',
  openGraph: mergeOpenGraph({
    title: 'Order Details',
    url: '/orders/[id]',
  }),
}
