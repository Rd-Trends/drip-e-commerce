'use client'

import { AuthProvider } from '@/providers/auth'
import { QueryProvider as QueryClientProvider } from './query-provider'
import { CurrencyProvider } from './currency'
import { CartProvider } from './cart'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <QueryClientProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>{children}</CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
