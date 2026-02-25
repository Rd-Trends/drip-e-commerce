import type { Metadata } from 'next'

import type { Page, Product } from '../payload-types'

import { mergeOpenGraph } from './merge-open-graph'

export const generateMeta = async (args: { doc: Page | Product }): Promise<Metadata> => {
  const { doc } = args || {}
  const slug = typeof doc?.slug === 'string' ? doc.slug : undefined
  const pagePath = slug && slug !== 'home' ? `/${slug}` : '/'
  const title = doc?.meta?.title || doc?.title || 'Drip Fashion E-Commerce'
  const description = doc?.meta?.description

  const ogImage =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    `${process.env.NEXT_PUBLIC_SERVER_URL}${doc.meta.image.url}`

  return {
    description,
    alternates: {
      canonical: pagePath,
    },
    openGraph: mergeOpenGraph({
      ...(description
        ? {
            description,
          }
        : {}),
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: pagePath,
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description
        ? {
            description,
          }
        : {}),
      images: ogImage ? [ogImage] : ['/og-image.jpg'],
    },
    title,
  }
}
