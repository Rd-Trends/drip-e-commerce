import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { CheckoutPage } from './_components/checkout'
import { Section } from '@/components/layout/section'
import { Container } from '@/components/layout/container'

export default function Checkout() {
  return (
    <Section>
      <Container>
        <h1 className="sr-only">Checkout</h1>

        <CheckoutPage />
      </Container>
    </Section>
  )
}

export const metadata: Metadata = {
  description: 'Checkout.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout',
}
