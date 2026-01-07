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

interface OrderConfirmationEmailProps {
  order?: Order
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Dummy data for design purposes
const dummyOrder = {
  id: 'ORD-2026-001234',
  createdAt: new Date('2026-01-03T10:30:00Z').toISOString(),
  customerEmail: 'john.doe@example.com',
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Fashion Street',
    addressLine2: 'Apartment 4B',
    city: 'Lagos',
    state: 'Lagos',
    postalCode: '101001',
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
    {
      product: {
        title: 'Premium Joggers',
        priceInNGN: 28000,
        gallery: [{ image: { url: '/placeholder.png' } }],
      },
      variant: null,
      quantity: 1,
    },
  ],
  subtotal: 97000,
  shippingFee: 3000,
  tax: 0,
  discount: 5000,
  grandTotal: 95000,
}

export const OrderConfirmationEmail = ({
  order = dummyOrder as unknown as Order,
}: OrderConfirmationEmailProps) => {
  const customerName = order.shippingAddress?.firstName || 'there'
  const orderDate = formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })

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

  return (
    <Html>
      <Tailwind config={tailwindConfig}>
        <Head />
        <Body className="bg-muted font-sans">
          <Preview>{`Your order #${String(order.id)} has been confirmed - Drip E-Commerce`}</Preview>
          <Container className="my-0 sm:my-10 mx-auto max-w-150 border-0 sm:border border-border bg-background">
            {/* Order Confirmation Message */}
            <Section className="py-6 sm:py-10 px-4 sm:px-10 text-center">
              <Img
                src={`${baseUrl}/t-shirt-black.png`}
                width="120"
                height="40"
                alt="Drip E-Commerce"
                className="mx-auto mb-4"
              />
              <Heading className="text-[24px] sm:text-[32px] leading-tight font-bold text-foreground m-0 mb-4">
                Order Confirmed!
              </Heading>
              <Text className="text-sm sm:text-base text-muted-foreground font-medium m-0">
                Hey {customerName}, we&apos;re getting your order ready.
              </Text>
              <Text className="text-sm sm:text-base text-muted-foreground font-medium mt-4 mb-0">
                We&apos;ll notify you when your order has been shipped. You can track your order
                status and view details using the link below.
              </Text>
            </Section>

            <Hr className="border-border m-0" />

            {/* Order Details */}
            <Section className="m-0 w-full py-6 px-4 sm:px-10 bg-muted/50">
              <Row>
                <Column className="">
                  <Text className="m-0 text-sm font-bold text-foreground">Order Number</Text>
                  <Text className="mt-2 mb-0 text-sm text-muted-foreground">#{order.id}</Text>
                </Column>
                <Column className="">
                  <Text className="m-0 text-sm font-bold text-foreground">Order Date</Text>
                  <Text className="mt-2 mb-0 text-sm text-muted-foreground">{orderDate}</Text>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* Shipping Address */}
            <Section className="m-0 py-6 px-4 sm:px-10">
              <Text className="m-0 text-sm font-bold text-foreground mb-3">
                Shipping to: {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
              </Text>
              <Text className="m-0 text-sm text-muted-foreground leading-relaxed">
                {order.shippingAddress?.addressLine1}
                {order.shippingAddress?.addressLine2 && (
                  <>
                    <br />
                    {order.shippingAddress.addressLine2}
                  </>
                )}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state?.toUpperCase()}
                {order.shippingAddress?.postalCode && ` ${order.shippingAddress.postalCode}`}
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
            <Section className="m-0 w-full py-6 sm:py-10 px-4 sm:px-10">
              <Text className="text-base sm:text-lg font-bold text-foreground mb-6">
                Order Items
              </Text>
              {order.items?.map((item, index: number) => {
                const product = typeof item.product === 'number' ? null : item.product
                const variant = typeof item.variant === 'number' ? null : item.variant

                if (!product) return null

                return (
                  <Row key={index} className="mb-6">
                    <Column className="w-20 sm:w-30 pr-3 align-top">
                      <Img
                        src={getProductImage(product)}
                        alt={product.title}
                        width="80"
                        height="80"
                        className="rounded-lg object-cover w-full"
                      />
                    </Column>

                    <Column className="align-top">
                      <Text className="m-0 text-sm font-medium text-foreground leading-snug">
                        {product.title}
                      </Text>
                      {variant && (
                        <Text className="mt-1 mb-0 text-xs sm:text-sm text-muted-foreground">
                          {getVariantDetails(variant)}
                        </Text>
                      )}
                      <Text className="mt-1 mb-0 text-xs sm:text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </Text>
                      <Text className="mt-2 mb-0 text-sm font-medium text-foreground">
                        {formatCurrency(
                          (variant?.priceInNGN || product.priceInNGN || 0) * (item.quantity || 1),
                        )}
                      </Text>
                    </Column>
                  </Row>
                )
              })}
            </Section>

            <Hr className="border-border m-0" />

            {/* Order Summary */}
            <Section className="m-0 w-full py-6 px-4 sm:px-10 bg-muted/50">
              <Row className="mb-2">
                <Column className="w-2/3">
                  <Text className="m-0 text-xs sm:text-sm text-muted-foreground">Subtotal</Text>
                </Column>
                <Column className="w-1/3 text-right">
                  <Text className="m-0 text-xs sm:text-sm text-foreground">
                    {formatCurrency(order.subtotal)}
                  </Text>
                </Column>
              </Row>

              {order.shippingFee ? (
                <Row className="mb-2">
                  <Column className="w-2/3">
                    <Text className="m-0 text-xs sm:text-sm text-muted-foreground">Shipping</Text>
                  </Column>
                  <Column className="w-1/3 text-right">
                    <Text className="m-0 text-xs sm:text-sm text-foreground">
                      {formatCurrency(order.shippingFee)}
                    </Text>
                  </Column>
                </Row>
              ) : null}

              {order.tax ? (
                <Row className="mb-2">
                  <Column className="w-2/3">
                    <Text className="m-0 text-xs sm:text-sm text-muted-foreground">Tax</Text>
                  </Column>
                  <Column className="w-1/3 text-right">
                    <Text className="m-0 text-xs sm:text-sm text-foreground">
                      {formatCurrency(order.tax)}
                    </Text>
                  </Column>
                </Row>
              ) : null}

              {order.discount ? (
                <Row className="mb-2">
                  <Column className="w-2/3">
                    <Text className="m-0 text-xs sm:text-sm text-muted-foreground">Discount</Text>
                  </Column>
                  <Column className="w-1/3 text-right">
                    <Text className="m-0 text-xs sm:text-sm text-foreground">
                      -{formatCurrency(order.discount)}
                    </Text>
                  </Column>
                </Row>
              ) : null}

              <Hr className="border-border my-4" />

              <Row>
                <Column className="w-2/3">
                  <Text className="m-0 text-sm sm:text-base font-bold text-foreground">Total</Text>
                </Column>
                <Column className="w-1/3 text-right">
                  <Text className="m-0 text-sm sm:text-base font-bold text-foreground">
                    {formatCurrency(order.grandTotal || order.subtotal)}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* View Order Button */}
            <Section className="py-6 sm:py-10 px-4 sm:px-10 text-center">
              <Link
                href={
                  order.customer
                    ? `${baseUrl}/account/orders/${order.id}`
                    : `${baseUrl}/track-order?id=${order.id}&email=${order.customerEmail}`
                }
                className="inline-block bg-primary text-primary-foreground font-medium text-sm py-3 px-6 sm:px-8 rounded-full no-underline"
              >
                View Order Details
              </Link>
            </Section>

            <Hr className="border-border m-0" />

            {/* Help Section */}
            <Section className="m-0 w-full py-6 px-4 sm:px-10 bg-muted/50">
              <Text className="m-0 mb-4 font-bold text-foreground text-sm">Need Help?</Text>
              <Row>
                <Column className="w-full sm:w-1/2 pb-2 sm:pb-0">
                  <Link
                    href={`${baseUrl}/account/orders`}
                    className="text-xs sm:text-sm text-muted-foreground no-underline block"
                  >
                    Order Status
                  </Link>
                </Column>
                <Column className="w-full sm:w-1/2 pb-2 sm:pb-0">
                  <Link
                    href={`${baseUrl}/support`}
                    className="text-xs sm:text-sm text-muted-foreground no-underline block"
                  >
                    Contact Support
                  </Link>
                </Column>
              </Row>
              <Row className="mt-2 sm:mt-4">
                <Column className="w-full sm:w-1/2 pb-2 sm:pb-0">
                  <Link
                    href={`${baseUrl}/shipping`}
                    className="text-xs sm:text-sm text-muted-foreground no-underline block"
                  >
                    Shipping & Delivery
                  </Link>
                </Column>
                <Column className="w-full sm:w-1/2">
                  <Link
                    href={`${baseUrl}/returns`}
                    className="text-xs sm:text-sm text-muted-foreground no-underline block"
                  >
                    Returns & Exchanges
                  </Link>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* Footer */}
            <Section className="py-6 sm:py-8 px-4 sm:px-10">
              <Text className="text-center text-[10px] sm:text-xs text-muted-foreground mb-4">
                Questions? Contact us - we&apos;re here to help!
              </Text>
              <Text className="text-center text-[10px] sm:text-xs text-muted-foreground mb-0">
                © {new Date().getFullYear()} Drip E-Commerce. All rights reserved.
              </Text>
              <Text className="text-center text-[10px] sm:text-xs text-muted-foreground mt-2 mb-0">
                You received this email because you made a purchase at our store.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default OrderConfirmationEmail
