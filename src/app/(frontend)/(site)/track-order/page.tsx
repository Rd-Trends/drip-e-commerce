// app/(guest)/order-lookup/page.tsx
import type { Order } from '@/payload-types'
import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { notFound, redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderDetails } from '@/components/order/order-details'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Form from 'next/form'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ id?: string; email?: string }>
}

export default async function GuestOrderPage({ searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id, email } = await searchParams

  if (id && user) {
    redirect(`/account/orders/${id}`)
  }

  // If no id or email, show the lookup form
  if (!id || !email) {
    return <ProvideOrderTrackingDetails id={id} email={email} />
  }

  // Fetch the order
  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      overrideAccess: true,
      depth: 2,
      where: {
        and: [
          {
            id: {
              equals: id,
            },
          },
          {
            customerEmail: {
              equals: email,
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

    // Verify the email matches
    if (orderResult && orderResult.customerEmail === email) {
      order = orderResult
    }
  } catch (_) {
    // console.error(error)
  }

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <OrderDetails order={order} />
    </div>
  )
}

function ProvideOrderTrackingDetails({ id, email }: { id?: string; email?: string }) {
  return (
    <Card className="w-full max-w-md mx-auto my-20">
      <CardHeader className="space-y-2">
        <CardTitle>Track Your Order</CardTitle>
        <CardDescription>
          Enter your order ID and email address to view your order details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form className="space-y-4" action="/track-order">
          <div className="space-y-2">
            <Label htmlFor="id">Order ID</Label>
            <Input id="id" name="id" placeholder="Enter your order ID" defaultValue={id} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              defaultValue={email}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Track Order
          </Button>
        </Form>
      </CardContent>
    </Card>
  )
}

export const metadata: Metadata = {
  title: 'Track Your Order',
  description:
    'Track your order status and delivery information. Enter your order ID and email to view real-time shipping updates.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/track-order`,
  },
  openGraph: mergeOpenGraph({
    title: 'Track Your Order',
    url: '/track-order',
  }),
}
