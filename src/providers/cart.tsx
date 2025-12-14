'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useCurrency } from './currency'
import { Cart } from '@/payload-types'
import { useCartQuery } from '@/hooks/use-cart-queries'

type CartContextType = {
  cart?: Cart
  cartID?: number
  cartSecret?: string
  isLoading: boolean
  updateCartIdentifier: (params: { cartID: number; secret?: string }) => void
  clearCartStorage: () => void
}

const CartContext = createContext<CartContextType>({
  cart: undefined,
  cartID: undefined,
  cartSecret: undefined,
  isLoading: false,
  updateCartIdentifier: () => {},
  clearCartStorage: () => {},
})

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { currency } = useCurrency()

  // Local state for cart ID and secret
  const [cartID, setCartID] = useState<number | undefined>(undefined)
  const [cartSecret, setCartSecret] = useState<string | undefined>(undefined)
  const [isMounted, setIsMounted] = useState(false)

  // Load cart ID and secret from localStorage on mount
  useEffect(() => {
    const storedCartID = localStorage.getItem('cartID')
    const storedSecret = localStorage.getItem('cartSecret')

    if (storedCartID) {
      const parsedID = parseInt(storedCartID, 10)
      if (!isNaN(parsedID)) {
        setCartID(parsedID)
      }
    }

    if (storedSecret) {
      setCartSecret(storedSecret)
    }

    setIsMounted(true)
  }, [])

  const updateCartIdentifier = useCallback((params: { cartID: number; secret?: string }) => {
    setCartID(params.cartID)
    if (params.secret) {
      setCartSecret(params.secret)
    }
    localStorage.setItem('cartID', String(params.cartID))
    if (params.secret) {
      localStorage.setItem('cartSecret', params.secret)
    }
  }, [])

  // Clear cart from localStorage
  const clearCartStorage = useCallback(() => {
    setCartID(undefined)
    setCartSecret(undefined)

    localStorage.removeItem('cartID')
    localStorage.removeItem('cartSecret')
  }, [])

  // Fetch cart with react-query
  const {
    data: cart,
    isLoading: isLoadingCart,
    error,
  } = useCartQuery({
    cartID,
    secret: cartSecret,
    currencyCode: currency.code,
    enabled: !!cartID,
  })

  // If cart fetch fails, clear invalid cart
  useEffect(() => {
    if (error && cartID) {
      clearCartStorage()
    }
  }, [error, cartID, clearCartStorage])

  return (
    <CartContext.Provider
      value={{
        cart,
        cartID,
        cartSecret,
        // show loading state until mounted to avoid hydration issues
        isLoading: isLoadingCart || !isMounted,
        updateCartIdentifier,
        clearCartStorage,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

/**
 * Hook to access cart context
 * @example
 * const { cart, isLoading, addItem } = useCart()
 */
export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
