import React from 'react'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { LivePreviewListener } from '@/components/live-preview-listener'
import { Providers } from '@/providers'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <Providers>
          <LivePreviewListener />
          <main>{children}</main>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
