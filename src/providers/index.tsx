'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { AuthProvider } from '@/providers/auth'
import { QueryProvider as QueryClientProvider } from './query-provider'
import { CurrencyProvider } from './currency'
import { CartProvider } from './cart'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <NuqsAdapter>
      <QueryClientProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>{children}</CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
