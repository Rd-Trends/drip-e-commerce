import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { ConfirmOrder } from '../_components/confirm-order'
import { Section } from '@/components/layout/section'
import { Container } from '@/components/layout/container'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ConfirmOrderPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: SearchParams
}) {
  const searchParams = await searchParamsPromise

  return (
    <Section>
      <Container>
        <div className="min-h-[90vh] flex">
          <ConfirmOrder />
        </div>
      </Container>
    </Section>
  )
}

export const metadata: Metadata = {
  description: 'Confirm order.',
  openGraph: mergeOpenGraph({
    title: 'Confirming order',
    url: '/checkout/confirm-order',
  }),
  title: 'Confirming order',
}
