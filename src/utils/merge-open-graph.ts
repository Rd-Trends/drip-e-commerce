import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Discover the latest trends in fashion at Drip. Classic and flashy styles for youths, teens, and young parents.',
  images: [
    {
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Drip Fashion E-Commerce',
    },
  ],
  siteName: 'Drip',
  title: 'Drip - Fashion E-Commerce for Modern Style',
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
