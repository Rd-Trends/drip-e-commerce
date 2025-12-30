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

interface OrderConfirmationEmailProps {
  order: Order
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const OrderConfirmationEmail = ({ order }: OrderConfirmationEmailProps) => {
  const customerName = order.shippingAddress?.firstName || 'there'
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formatPrice = (amount?: number | null) => {
    if (!amount) return '₦0.00'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  const getProductImage = (product: Product): string => {
    if (product.gallery && product.gallery.length > 0) {
      const firstImage = product.gallery[0]?.image
      if (firstImage && typeof firstImage === 'object') {
        return firstImage.url || `${baseUrl}/placeholder.png`
      }
    }
    return `${baseUrl}/placeholder.png`
  }

  const getVariantDetails = (variant: Variant | undefined): string => {
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
      <Head />
      <Tailwind config={tailwindConfig}>
        <Body className="bg-muted font-sans">
          <Preview>{`Your order #${String(order.id)} has been confirmed - Drip E-Commerce`}</Preview>
          <Container className="my-10 mx-auto w-150 max-w-full border border-border bg-background">
            {/* Header */}
            <Section className="py-6 px-10 bg-primary">
              <Img
                src={`${baseUrl}/logo.png`}
                width="120"
                height="40"
                alt="Drip E-Commerce"
                className="mx-auto"
              />
            </Section>

            <Hr className="border-border m-0" />

            {/* Order Confirmation Message */}
            <Section className="py-10 px-10 text-center">
              <Heading className="text-[32px] leading-tight font-bold text-foreground m-0 mb-4">
                Order Confirmed!
              </Heading>
              <Text className="text-base text-muted-foreground font-medium m-0">
                Hey {customerName}, we&apos;re getting your order ready.
              </Text>
              <Text className="text-base text-muted-foreground font-medium mt-4 mb-0">
                We&apos;ll notify you when your order has been shipped. You can track your order
                status and view details using the link below.
              </Text>
            </Section>

            <Hr className="border-border m-0" />

            {/* Order Details */}
            <Section className="py-6 px-10 bg-muted/50">
              <Row>
                <Column className="w-1/2">
                  <Text className="m-0 text-sm font-bold text-foreground">Order Number</Text>
                  <Text className="mt-2 mb-0 text-sm text-muted-foreground">#{order.id}</Text>
                </Column>
                <Column className="w-1/2">
                  <Text className="m-0 text-sm font-bold text-foreground">Order Date</Text>
                  <Text className="mt-2 mb-0 text-sm text-muted-foreground">{orderDate}</Text>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* Shipping Address */}
            <Section className="py-6 px-10">
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
            <Section className="py-10 px-10">
              <Text className="text-lg font-bold text-foreground mb-6">Order Items</Text>
              {order.items?.map((item, index) => {
                const product = typeof item.product === 'object' ? item.product : null
                const variant = typeof item.variant === 'object' ? item.variant : undefined

                if (!product) return null

                return (
                  <Row key={index} className="mb-6">
                    <Column className="w-30 pr-4">
                      <Img
                        src={getProductImage(product)}
                        alt={product.title}
                        width="120"
                        height="120"
                        className="rounded-lg object-cover"
                      />
                    </Column>
                    <Column className="align-top">
                      <Text className="m-0 text-sm font-medium text-foreground">
                        {product.title}
                      </Text>
                      {variant && (
                        <Text className="mt-2 mb-0 text-sm text-muted-foreground">
                          {getVariantDetails(variant)}
                        </Text>
                      )}
                      <Text className="mt-2 mb-0 text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </Text>
                      <Text className="mt-2 mb-0 text-sm font-medium text-foreground">
                        {formatPrice(
                          variant?.priceInNGN || product.priceInNGN || 0 * (item.quantity || 1),
                        )}
                      </Text>
                    </Column>
                  </Row>
                )
              })}
            </Section>

            <Hr className="border-border m-0" />

            {/* Order Summary */}
            <Section className="py-6 px-10 bg-muted/50">
              <Row className="mb-2">
                <Column className="w-2/3">
                  <Text className="m-0 text-sm text-muted-foreground">Subtotal</Text>
                </Column>
                <Column className="w-1/3 text-right">
                  <Text className="m-0 text-sm text-foreground">{formatPrice(order.subtotal)}</Text>
                </Column>
              </Row>

              {order.shippingFee ? (
                <Row className="mb-2">
                  <Column className="w-2/3">
                    <Text className="m-0 text-sm text-muted-foreground">Shipping</Text>
                  </Column>
                  <Column className="w-1/3 text-right">
                    <Text className="m-0 text-sm text-foreground">
                      {formatPrice(order.shippingFee)}
                    </Text>
                  </Column>
                </Row>
              ) : null}

              {order.tax ? (
                <Row className="mb-2">
                  <Column className="w-2/3">
                    <Text className="m-0 text-sm text-muted-foreground">Tax</Text>
                  </Column>
                  <Column className="w-1/3 text-right">
                    <Text className="m-0 text-sm text-foreground">{formatPrice(order.tax)}</Text>
                  </Column>
                </Row>
              ) : null}

              {order.discount ? (
                <Row className="mb-2">
                  <Column className="w-2/3">
                    <Text className="m-0 text-sm text-muted-foreground">Discount</Text>
                  </Column>
                  <Column className="w-1/3 text-right">
                    <Text className="m-0 text-sm text-foreground">
                      -{formatPrice(order.discount)}
                    </Text>
                  </Column>
                </Row>
              ) : null}

              <Hr className="border-border my-4" />

              <Row>
                <Column className="w-2/3">
                  <Text className="m-0 text-base font-bold text-foreground">Total</Text>
                </Column>
                <Column className="w-1/3 text-right">
                  <Text className="m-0 text-base font-bold text-foreground">
                    {formatPrice(order.grandTotal || order.subtotal)}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* View Order Button */}
            <Section className="py-10 px-10 text-center">
              <Link
                href={`${baseUrl}/orders/${order.id}?email=${order.customerEmail}`}
                className="inline-block bg-primary text-primary-foreground font-medium text-sm py-3 px-8 rounded-lg no-underline"
              >
                View Order Details
              </Link>
            </Section>

            <Hr className="border-border m-0" />

            {/* Help Section */}
            <Section className="py-6 px-10 bg-muted/50">
              <Text className="m-0 mb-4 font-bold text-foreground">Need Help?</Text>
              <Row>
                <Column className="w-1/2">
                  <Link
                    href={`${baseUrl}/account/orders`}
                    className="text-sm text-muted-foreground no-underline"
                  >
                    Order Status
                  </Link>
                </Column>
                <Column className="w-1/2">
                  <Link
                    href={`${baseUrl}/support`}
                    className="text-sm text-muted-foreground no-underline"
                  >
                    Contact Support
                  </Link>
                </Column>
              </Row>
              <Row className="mt-4">
                <Column className="w-1/2">
                  <Link
                    href={`${baseUrl}/shipping`}
                    className="text-sm text-muted-foreground no-underline"
                  >
                    Shipping & Delivery
                  </Link>
                </Column>
                <Column className="w-1/2">
                  <Link
                    href={`${baseUrl}/returns`}
                    className="text-sm text-muted-foreground no-underline"
                  >
                    Returns & Exchanges
                  </Link>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* Footer */}
            <Section className="py-8 px-10">
              <Text className="text-center text-xs text-muted-foreground mb-4">
                Questions? Contact us - we&apos;re here to help!
              </Text>
              <Text className="text-center text-xs text-muted-foreground mb-0">
                © {new Date().getFullYear()} Drip E-Commerce. All rights reserved.
              </Text>
              <Text className="text-center text-xs text-muted-foreground mt-2 mb-0">
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
