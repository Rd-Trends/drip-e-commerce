import React from 'react'
import './globals.css'
import { Providers } from '@/providers'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Drip - Fashion E-Commerce for Modern Style',
    template: '%s | Drip',
  },
  description:
    'Discover the latest trends in fashion at Drip. Classic and flashy styles that make a statement. Shop clothing, accessories, and more with fast delivery across Nigeria.',
  authors: [{ name: 'Drip E-Commerce' }],
  creator: 'Drip E-Commerce',
  publisher: 'Drip E-Commerce',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    siteName: 'Drip',
    title: 'Drip - Fashion E-Commerce for Modern Style',
    description:
      'Discover the latest trends in fashion at Drip. Classic and flashy styles that make a statement.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Drip Fashion E-Commerce',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drip - Fashion E-Commerce for Modern Style',
    description:
      'Discover the latest trends in fashion at Drip. Classic and flashy styles that make a statement.',
    images: ['/og-image.jpg'],
    creator: '@DripNigeria',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
