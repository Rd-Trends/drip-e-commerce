'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/providers/auth'
import { QueryProvider as QueryClientProvider } from './query-provider'
import { CurrencyProvider } from './currency'
import { CartProvider } from './cart'
import { ThemeProvider } from './theme'
import { AnalyticsPixelProvider } from './analytics-pixel'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <NuqsAdapter>
        <QueryClientProvider>
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                <AnalyticsPixelProvider>{children}</AnalyticsPixelProvider>
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </QueryClientProvider>
      </NuqsAdapter>
      <Toaster />
    </ThemeProvider>
  )
}
