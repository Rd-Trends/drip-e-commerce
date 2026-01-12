import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { Order, Product, Variant } from '@/payload-types'
import tailwindConfig from './tailwind.config'
import { formatDateTime } from '@/utils/format-date-time'
import { formatCurrency } from '@/utils/format-currency'

interface AdminOrderNotificationEmailProps {
  order?: Order
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Dummy data for design purposes
const dummyOrder = {
  id: 'ORD-2026-001234',
  createdAt: new Date('2026-01-03T10:30:00Z').toISOString(),
  customerEmail: 'john.doe@example.com',
  customer: {
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Fashion Street',
    addressLine2: 'Apartment 4B',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    phone: '+234 801 234 5678',
  },
  items: [
    {
      product: {
        title: 'Classic Denim Jacket',
        priceInNGN: 45000,
        gallery: [{ image: { url: '/placeholder.png' } }],
      },
      variant: {
        title: 'Medium / Blue',
        options: [{ label: 'Size: Medium' }, { label: 'Color: Blue' }],
        priceInNGN: 45000,
      },
      quantity: 1,
    },
    {
      product: {
        title: 'Graphic T-Shirt - Urban Vibes',
        priceInNGN: 12000,
        gallery: [{ image: { url: '/api/media/t-shirt-2.png' } }],
      },
      variant: {
        title: 'Large / Black',
        options: [{ label: 'Size: Large' }, { label: 'Color: Black' }],
        priceInNGN: 12000,
      },
      quantity: 2,
    },
  ],
  subtotal: 97000,
  shippingFee: 3000,
  tax: 0,
  discount: 5000,
  grandTotal: 95000,
  status: 'processing',
  transactions: [
    {
      reference: 'PAY-REF-123456789',
      status: 'success',
    },
  ],
}

export const AdminOrderNotificationEmail = ({
  order = dummyOrder as unknown as Order,
}: AdminOrderNotificationEmailProps) => {
  const customerName =
    [order.shippingAddress?.firstName, order.shippingAddress?.lastName].filter(Boolean).join(' ') ||
    'Guest Customer'

  const customerEmail =
    (order.customer && typeof order.customer === 'object' ? order.customer.email : null) ||
    order.customerEmail

  const orderDate = formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy HH:mm' })

  const getProductImage = (product: Product): string => {
    if (product.gallery && product.gallery.length > 0) {
      const firstImage = product.gallery[0]?.image
      if (firstImage && typeof firstImage === 'object') {
        const url = firstImage.url ? `${baseUrl}${firstImage.url}` : `${baseUrl}/placeholder.png`
        return url.replace(/([^:]\/)\/+/g, '$1')
      }
    }
    return `${baseUrl}/placeholder.png`
  }

  const getVariantDetails = (variant?: Variant | null): string => {
    if (!variant) return ''
    if (variant.options && variant.options.length > 0) {
      return variant.options
        .map((opt) => {
          if (typeof opt === 'object' && opt?.label) {
            return opt.label
          }
          return ''
        })
        .filter(Boolean)
        .join(', ')
    }
    return variant.title || ''
  }

  const paymentReference =
    order.transactions && order.transactions.length > 0
      ? typeof order.transactions[0] === 'object' && order.transactions[0]?.paystack?.reference
        ? order.transactions[0].paystack.reference
        : 'N/A'
      : 'N/A'

  const adminUrl = `${baseUrl}/admin/collections/orders/${order.id}`

  return (
    <Html>
      <Tailwind config={tailwindConfig}>
        <Head />
        <Body className="bg-muted font-sans">
          <Preview>{`New Order ${String(order.id)} - ${formatCurrency(order.grandTotal)} - Drip Fashion`}</Preview>
          <Container className="my-0 sm:my-10 mx-auto max-w-150 border-0 sm:border border-border bg-background">
            {/* Alert Header */}
            <Section className="py-6 sm:py-10 px-4 sm:px-10 text-center bg-primary/5">
              <Img
                src={`${baseUrl}/logo.png`}
                width="60"
                height="40"
                alt="Drip Fashion"
                className="mx-auto mb-4"
              />
              <Heading className="text-[24px] sm:text-[28px] leading-tight font-bold text-foreground m-0 mb-2">
                New Order Received
              </Heading>
              <Text className="text-sm sm:text-base text-muted-foreground font-medium m-0">
                Order {order.id} requires processing
              </Text>
            </Section>

            <Hr className="border-border m-0" />

            {/* Quick Actions */}
            <Section className="m-0 py-6 px-4 sm:px-10 text-center">
              <Link
                href={adminUrl}
                className="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-md no-underline"
              >
                View Order in Admin Panel
              </Link>
            </Section>

            <Hr className="border-border m-0" />

            {/* Order Details Grid */}
            <Section className="m-0 w-full py-6 px-4 sm:px-10 bg-muted/50">
              <Row>
                <Column className="w-1/2">
                  <Text className="m-0 text-sm font-bold text-foreground">Order ID</Text>
                  <Text className="mt-2 mb-4 text-sm text-muted-foreground">{order.id}</Text>
                </Column>
                <Column className="w-1/2">
                  <Text className="m-0 text-sm font-bold text-foreground">Order Date</Text>
                  <Text className="mt-2 mb-4 text-sm text-muted-foreground">{orderDate}</Text>
                </Column>
              </Row>
              <Row>
                <Column className="w-1/2">
                  <Text className="m-0 text-sm font-bold text-foreground">Order Status</Text>
                  <Text className="mt-2 mb-4 text-sm text-muted-foreground capitalize">
                    {order.status || 'Processing'}
                  </Text>
                </Column>
                <Column className="w-1/2">
                  <Text className="m-0 text-sm font-bold text-foreground">Payment Reference</Text>
                  <Text className="mt-2 mb-4 text-sm text-muted-foreground font-mono">
                    {paymentReference}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text className="m-0 text-sm font-bold text-foreground">Customer</Text>
                  <Text className="mt-2 mb-0 text-sm text-muted-foreground">
                    {customerName}
                    <br />
                    {customerEmail}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* Shipping Address */}
            <Section className="m-0 py-6 px-4 sm:px-10">
              <Text className="m-0 text-sm font-bold text-foreground mb-3">Shipping Address</Text>
              <Text className="m-0 text-sm text-muted-foreground leading-relaxed">
                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                <br />
                {order.shippingAddress?.addressLine1}
                {order.shippingAddress?.addressLine2 && (
                  <>
                    <br />
                    {order.shippingAddress.addressLine2}
                  </>
                )}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state?.toUpperCase()}
                <br />
                {order.shippingAddress?.country || 'Nigeria'}
                {order.shippingAddress?.phone && (
                  <>
                    <br />
                    Phone: {order.shippingAddress.phone}
                  </>
                )}
              </Text>
            </Section>

            <Hr className="border-border m-0" />

            {/* Order Items */}
            <Section className="m-0 py-6 px-4 sm:px-10">
              <Heading className="m-0 mb-6 text-lg font-bold text-foreground">
                Order Items ({order.items?.length || 0})
              </Heading>

              {order.items?.map((item, index: number) => {
                const product = typeof item.product === 'number' ? null : item.product
                const variant = typeof item.variant === 'number' ? null : item.variant
                const productTitle = product?.title || 'Unknown Product'
                const variantDetails = getVariantDetails(variant)
                const itemPrice = variant?.priceInNGN || product?.priceInNGN || 0
                const itemTotal = itemPrice * item.quantity

                return (
                  <div key={index}>
                    <Row className="mb-6">
                      {!!product && (
                        <Column className="w-20">
                          <Img
                            src={getProductImage(product)}
                            width="64"
                            height="64"
                            alt={productTitle}
                            className="rounded-md"
                          />
                        </Column>
                      )}
                      <Column className="pl-4">
                        <Text className="m-0 text-sm font-semibold text-foreground">
                          {productTitle}
                        </Text>
                        {variantDetails && (
                          <Text className="mt-1 mb-0 text-xs text-muted-foreground">
                            {variantDetails}
                          </Text>
                        )}
                        <Text className="mt-2 mb-0 text-xs text-muted-foreground">
                          Qty: {item.quantity} × {formatCurrency(itemPrice)} ={' '}
                          <span className="font-semibold text-foreground">
                            {formatCurrency(itemTotal)}
                          </span>
                        </Text>
                      </Column>
                    </Row>
                    {index < (order.items?.length || 0) - 1 && (
                      <Hr className="border-border my-4" />
                    )}
                  </div>
                )
              })}
            </Section>

            <Hr className="border-border m-0" />

            {/* Order Summary */}
            <Section className="m-0 py-6 px-4 sm:px-10 bg-muted/30">
              <Heading className="m-0 mb-4 text-lg font-bold text-foreground">
                Order Summary
              </Heading>

              <Row className="mb-3">
                <Column className="text-left">
                  <Text className="m-0 text-sm text-muted-foreground">Subtotal</Text>
                </Column>
                <Column className="text-right">
                  <Text className="m-0 text-sm text-foreground">
                    {formatCurrency(order.subtotal)}
                  </Text>
                </Column>
              </Row>

              {order.discount && order.discount > 0 ? (
                <Row className="mb-3">
                  <Column className="text-left">
                    <Text className="m-0 text-sm text-muted-foreground">Discount</Text>
                  </Column>
                  <Column className="text-right">
                    <Text className="m-0 text-sm text-destructive">
                      -{formatCurrency(order.discount)}
                    </Text>
                  </Column>
                </Row>
              ) : null}

              <Row className="mb-3">
                <Column className="text-left">
                  <Text className="m-0 text-sm text-muted-foreground">Shipping Fee</Text>
                </Column>
                <Column className="text-right">
                  <Text className="m-0 text-sm text-foreground">
                    {formatCurrency(order.shippingFee)}
                  </Text>
                </Column>
              </Row>

              {order.tax && order.tax > 0 ? (
                <Row className="mb-3">
                  <Column className="text-left">
                    <Text className="m-0 text-sm text-muted-foreground">Tax</Text>
                  </Column>
                  <Column className="text-right">
                    <Text className="m-0 text-sm text-foreground">{formatCurrency(order.tax)}</Text>
                  </Column>
                </Row>
              ) : null}

              <Hr className="border-border my-4" />

              <Row>
                <Column className="text-left">
                  <Text className="m-0 text-base font-bold text-foreground">Total</Text>
                </Column>
                <Column className="text-right">
                  <Text className="m-0 text-base font-bold text-foreground">
                    {formatCurrency(order.grandTotal)}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* Footer */}
            <Section className="m-0 py-6 px-4 sm:px-10 text-center">
              <Text className="m-0 text-xs text-muted-foreground">
                This is an automated notification for new orders. Please process this order as soon
                as possible.
              </Text>
              <Text className="mt-4 mb-0 text-xs text-muted-foreground">
                <Link href={adminUrl} className="text-primary underline font-medium">
                  Manage Order in Admin Panel →
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
