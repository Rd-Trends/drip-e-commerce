import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { CheckoutPage } from './_components/checkout'
import { Section } from '@/components/layout/section'
import { Container } from '@/components/layout/container'

export default function Checkout() {
  return (
    <Section paddingY="xs" className="pb-20">
      <Container>
        <h1 className="sr-only">Checkout</h1>

        <CheckoutPage />
      </Container>
    </Section>
  )
}

export const metadata: Metadata = {
  title: 'Checkout',
  description:
    'Complete your purchase securely with Paystack payment. Review your order, enter shipping details, and get your fashion items delivered across Nigeria.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
}
