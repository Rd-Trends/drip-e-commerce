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
import type { Product, Variant } from '@/payload-types'
import tailwindConfig from './tailwind.config'
import { formatCurrency } from '@/utils/format-currency'

export interface CartAbandonmentEmailProps {
  customerName?: string
  items?: {
    product?: Product | number | null
    variant?: Variant | number | null
    quantity: number
  }[]
  subtotal?: number
  coupon?: {
    code: string
    description: string
  }
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const dummyProps: CartAbandonmentEmailProps = {
  customerName: 'Alex',
  subtotal: 57000,
  coupon: { code: 'COMEBACK10', description: '10% off your order' },
  items: [
    {
      product: {
        id: '1',
        title: 'Classic Denim Jacket',
        priceInNGN: 45000,
        gallery: [{ image: { url: '/placeholder.png' } }],
      } as unknown as Product,
      variant: {
        id: '1',
        title: 'Medium / Blue',
        options: [{ label: 'Size: Medium' }, { label: 'Color: Blue' }],
        priceInNGN: 45000,
      } as unknown as Variant,
      quantity: 1,
    },
    {
      product: {
        id: '2',
        title: 'Graphic T-Shirt',
        priceInNGN: 12000,
        gallery: [],
      } as unknown as Product,
      variant: null,
      quantity: 1,
    },
  ],
}

const getProductImage = (product: Product): string => {
  if (product.gallery && product.gallery.length > 0) {
    const firstImage = product.gallery[0]?.image
    if (firstImage && typeof firstImage === 'object' && firstImage.url) {
      return `${baseUrl}${firstImage.url}`.replace(/([^:]\/)\/+/g, '$1')
    }
  }
  return `${baseUrl}/placeholder.png`
}

const getVariantLabel = (variant?: Variant | null): string => {
  if (!variant) return ''
  if (variant.options && variant.options.length > 0) {
    return variant.options
      .map((opt) => (typeof opt === 'object' && opt?.label ? opt.label : ''))
      .filter(Boolean)
      .join(', ')
  }
  return variant.title || ''
}

export const CartAbandonmentEmail = ({
  customerName = dummyProps.customerName,
  items = dummyProps.items,
  subtotal = dummyProps.subtotal,
  coupon = dummyProps.coupon,
}: CartAbandonmentEmailProps) => {
  return (
    <Html>
      <Tailwind config={tailwindConfig}>
        <Head />
        <Body className="bg-muted font-sans">
          <Preview>You left something behind — your cart is waiting for you</Preview>
          <Container className="my-0 sm:my-10 mx-auto max-w-150 border-0 sm:border border-border bg-background">
            {/* Header */}
            <Section className="py-6 sm:py-10 px-4 sm:px-10 text-center">
              <Img
                src={`${baseUrl}/logo.png`}
                width="60"
                height="40"
                alt="Drip E-Commerce"
                className="mx-auto mb-4"
              />
              <Heading className="text-[24px] sm:text-[32px] leading-tight font-bold text-foreground m-0 mb-4">
                Still thinking it over?
              </Heading>
              <Text className="text-sm sm:text-base text-muted-foreground font-medium m-0">
                Hey {customerName}, you left some items in your cart. They&apos;re still waiting
                for you — but they won&apos;t be around forever.
              </Text>
            </Section>

            <Hr className="border-border m-0" />

            {/* Cart Items */}
            <Section className="m-0 w-full py-6 sm:py-10 px-4 sm:px-10">
              <Text className="text-base sm:text-lg font-bold text-foreground mb-6">
                Your Cart
              </Text>
              {items?.map((item, index) => {
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
                          {getVariantLabel(variant)}
                        </Text>
                      )}
                      <Text className="mt-1 mb-0 text-xs sm:text-sm text-muted-foreground">
                        Qty: {item.quantity}
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

            {/* Subtotal */}
            <Section className="m-0 w-full py-4 px-4 sm:px-10 bg-muted/50">
              <Row>
                <Column className="w-2/3">
                  <Text className="m-0 text-sm font-bold text-foreground">Subtotal</Text>
                </Column>
                <Column className="w-1/3 text-right">
                  <Text className="m-0 text-sm font-bold text-foreground">
                    {formatCurrency(subtotal)}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr className="border-border m-0" />

            {/* Coupon */}
            {coupon && (
              <>
                <Section className="m-0 w-full py-6 px-4 sm:px-10 text-center">
                  <Text className="m-0 mb-3 text-sm font-bold text-foreground">
                    Here&apos;s a little something for you
                  </Text>
                  <Text className="m-0 mb-4 text-sm text-muted-foreground">
                    {coupon.description} — use the code below at checkout:
                  </Text>
                  <Text className="inline-block mx-auto px-6 py-3 bg-muted border border-dashed border-border rounded-lg text-lg font-bold tracking-widest text-foreground">
                    {coupon.code}
                  </Text>
                </Section>
                <Hr className="border-border m-0" />
              </>
            )}

            {/* CTA */}
            <Section className="py-6 sm:py-10 px-4 sm:px-10 text-center">
              <Text className="text-sm text-muted-foreground mb-6">
                Complete your order before your items sell out.
              </Text>
              <Link
                href={`${baseUrl}/shop`}
                className="inline-block bg-primary text-primary-foreground font-medium text-sm py-3 px-8 rounded-full no-underline"
              >
                Return to Shopping
              </Link>
            </Section>

            <Hr className="border-border m-0" />

            {/* Footer */}
            <Section className="py-6 sm:py-8 px-4 sm:px-10">
              <Text className="text-center text-[10px] sm:text-xs text-muted-foreground mb-0">
                © {new Date().getFullYear()} Drip E-Commerce. All rights reserved.
              </Text>
              <Text className="text-center text-[10px] sm:text-xs text-muted-foreground mt-2 mb-0">
                You received this email because you have items in your cart at our store.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default CartAbandonmentEmail
