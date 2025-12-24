'use client'

import type { Cart } from '@/payload-types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { cartApi, type CartItemInput } from '@/lib/api/cart'
import { queryKeys } from '@/lib/query-keys'
import { useAuth } from '@payloadcms/ui'
import { useCart } from '@/providers/cart'
import { useCurrency } from '@/providers/currency'

type CartItem = NonNullable<Cart['items']>[number]

type UseCartQueryOptions = {
  cartID?: number
  secret?: string
  currencyCode: string
  enabled?: boolean
}

/**
 * Hook for fetching cart data.
 * This shouldn't be used directly, get cart from context instead.
 * @example
 * const { data: cart, isLoading, error } = useCartQuery({ cartID, secret, currencyCode })
 */
export const useCartQuery = (options: UseCartQueryOptions) => {
  const { cartID, secret, currencyCode, enabled = true } = options

  return useQuery({
    queryKey: queryKeys.cart.detail(cartID || ''),
    queryFn: () => {
      if (!cartID) throw new Error('No cart ID')
      return cartApi.getCart(cartID, { secret, currencyCode })
    },
    enabled: enabled && !!cartID,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for creating a new cart
 * @example
 * const { mutate: createCart, isPending } = useCreateCart()
 * createCart({ items: [{ product: '123', quantity: 1 }] })
 */
export const useCreateCart = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { currency } = useCurrency()
  const { updateCartIdentifier } = useCart()

  return useMutation({
    mutationFn: (data: { items?: Array<CartItemInput & { quantity: number }> }) =>
      cartApi.createCart({
        ...data,
        currencyCode: currency.code,
        customerID: user?.id,
      }),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.detail(cart.id), cart)
      updateCartIdentifier({ cartID: cart.id, secret: cart.secret ?? undefined })
    },
  })
}

/**
 * Hook for updating cart
 * @example
 * const { mutate: updateCart, isPending } = useUpdateCart()
 * updateCart({ items: [...] })
 */
export const useUpdateCart = () => {
  const queryClient = useQueryClient()
  const { currency } = useCurrency()
  const { cartID, cartSecret } = useCart()

  return useMutation({
    mutationFn: (updates: Partial<Cart>) => {
      if (!cartID) {
        throw new Error('No cart ID')
      }

      return cartApi.updateCart(cartID, updates, {
        secret: cartSecret,
        currencyCode: currency.code,
      })
    },
    onMutate: async (updates) => {
      if (!cartID) return

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.detail(cartID) })

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<Cart>(queryKeys.cart.detail(cartID))

      // Optimistically update to the new value
      if (previousCart) {
        queryClient.setQueryData<Cart>(queryKeys.cart.detail(cartID), {
          ...previousCart,
          ...updates,
        })
      }

      // Return a context object with the snapshotted value
      return { previousCart }
    },
    onError: (err, updates, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCart && cartID) {
        queryClient.setQueryData(queryKeys.cart.detail(cartID), context.previousCart)
      }
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.detail(cartID!), cart)
    },
  })
}

/**
 * Hook for deleting cart
 * @example
 * const { mutate: deleteCart, isPending } = useDeleteCart()
 * deleteCart()
 */
export const useDeleteCart = () => {
  const queryClient = useQueryClient()
  const { cartID, cartSecret, clearCartStorage } = useCart()

  return useMutation({
    mutationFn: () => {
      if (!cartID) {
        throw new Error('No cart ID')
      }

      return cartApi.deleteCart(cartID, {
        secret: cartSecret,
      })
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.cart.detail(cartID!) })
      clearCartStorage()
    },
  })
}

/**
 * Hook for adding items to cart
 * Handles both creating a new cart and updating existing cart
 * @example
 * const { mutate: addToCart, isPending } = useAddToCart()
 * addToCart({ item: { product: '123', variant: '456' }, quantity: 2 })
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { currency } = useCurrency()
  const { cartID, cartSecret, updateCartIdentifier } = useCart()

  return useMutation({
    mutationFn: async (data: { item: CartItemInput; quantity?: number }) => {
      const { item, quantity = 1 } = data

      // If cart exists, update it
      if (cartID) {
        const existingCart = await cartApi.getCart(cartID, {
          secret: cartSecret,
          currencyCode: currency.code,
        })

        // Check if the item already exists in the cart
        const existingItemIndex =
          existingCart.items?.findIndex((cartItem: CartItem) => {
            const productID =
              cartItem.product && typeof cartItem.product === 'object'
                ? cartItem.product.id
                : cartItem.product
            const variantID =
              cartItem.variant && typeof cartItem.variant === 'object'
                ? cartItem.variant.id
                : cartItem.variant

            return (
              productID === item.product &&
              (item.variant && variantID ? variantID === item.variant : !item.variant)
            )
          }) ?? -1

        let updatedItems = existingCart.items ? [...existingCart.items] : []

        if (existingItemIndex !== -1) {
          // Update quantity if item exists
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          }
        } else {
          // Add new item
          updatedItems = [...updatedItems, { ...item, quantity }]
        }

        return cartApi.updateCart(
          cartID,
          { items: updatedItems },
          { secret: cartSecret, currencyCode: currency.code },
        )
      }

      // Create new cart
      const newCart = await cartApi.createCart({
        items: [{ ...item, quantity }],
        currencyCode: currency.code,
        customerID: user?.id,
      })

      return newCart
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.detail(cart.id), cart)
      if (!cartID) {
        updateCartIdentifier({ cartID: cart.id, secret: cart.secret ?? undefined })
      }
    },
  })
}

/**
 * Hook for removing items from cart
 * @example
 * const { mutate: removeFromCart, isPending } = useRemoveFromCart()
 * removeFromCart(itemID)
 */
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient()
  const { currency } = useCurrency()
  const { cartID, cartSecret } = useCart()

  return useMutation({
    mutationFn: async (itemID: string) => {
      if (!cartID) {
        throw new Error('No cart ID')
      }

      const existingCart = await cartApi.getCart(cartID, {
        secret: cartSecret,
        currencyCode: currency.code,
      })

      const updatedItems =
        existingCart.items?.filter((cartItem: CartItem) => cartItem.id !== itemID) ?? []

      return cartApi.updateCart(
        cartID,
        { items: updatedItems },
        { secret: cartSecret, currencyCode: currency.code },
      )
    },
    onMutate: async (itemID) => {
      if (!cartID) return

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.detail(cartID) })

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<Cart>(queryKeys.cart.detail(cartID))

      // Optimistically update by removing the item
      if (previousCart) {
        queryClient.setQueryData<Cart>(queryKeys.cart.detail(cartID), {
          ...previousCart,
          items: previousCart.items?.filter((cartItem) => cartItem.id !== itemID),
        })
      }

      // Return a context object with the snapshotted value
      return { previousCart }
    },
    onError: (err, itemID, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCart && cartID) {
        queryClient.setQueryData(queryKeys.cart.detail(cartID), context.previousCart)
      }
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.detail(cartID!), cart)
    },
  })
}

/**
 * Hook for incrementing or decrementing item quantity in cart
 * @example
 * const { mutate, isPending } = useUpdateCartItemQuantity()
 * mutate({ itemID, action: 'decrement' })
 * mutate({ itemID, action: 'increment' })
 */
export const useUpdateCartItemQuantity = () => {
  const queryClient = useQueryClient()
  const { currency } = useCurrency()
  const { cartID, cartSecret } = useCart()

  return useMutation({
    mutationFn: async ({
      itemID,
      action,
    }: {
      itemID: string
      action: 'increment' | 'decrement'
    }) => {
      if (!cartID) {
        throw new Error('No cart ID')
      }

      const existingCart = await cartApi.getCart(cartID, {
        secret: cartSecret,
        currencyCode: currency.code,
      })

      let updatedItems: CartItem[]
      if (action === 'increment') {
        updatedItems =
          existingCart.items?.map((cartItem: CartItem) =>
            cartItem.id === itemID ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
          ) ?? []
      } else {
        updatedItems =
          existingCart.items
            ?.map((cartItem: CartItem) =>
              cartItem.id === itemID ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem,
            )
            .filter((cartItem: CartItem) => cartItem.quantity > 0) ?? []
      }

      return cartApi.updateCart(
        cartID,
        { items: updatedItems },
        { secret: cartSecret, currencyCode: currency.code },
      )
    },
    onMutate: async ({ itemID, action }) => {
      if (!cartID) return

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.detail(cartID) })

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<Cart>(queryKeys.cart.detail(cartID))

      // Optimistically update the quantity
      if (previousCart) {
        let updatedItems: CartItem[]
        if (action === 'increment') {
          updatedItems =
            previousCart.items?.map((cartItem: CartItem) =>
              cartItem.id === itemID ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
            ) ?? []
        } else {
          // For decrement, also remove item if quantity reaches 0
          updatedItems =
            previousCart.items
              ?.map((cartItem: CartItem) =>
                cartItem.id === itemID
                  ? { ...cartItem, quantity: cartItem.quantity - 1 }
                  : cartItem,
              )
              .filter((cartItem: CartItem) => cartItem.quantity > 0) ?? []
        }

        queryClient.setQueryData<Cart>(queryKeys.cart.detail(cartID), {
          ...previousCart,
          items: updatedItems,
        })
      }

      // Return a context object with the snapshotted value
      return { previousCart }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCart && cartID) {
        queryClient.setQueryData(queryKeys.cart.detail(cartID), context.previousCart)
      }
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.detail(cartID!), cart)
    },
  })
}
