/**
 * Centralized query key management for React Query
 * This ensures consistent query invalidation and caching across the app
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  cart: {
    all: ['cart'] as const,
    detail: (cartID: string | number) => [...queryKeys.cart.all, 'detail', cartID] as const,
  },
  address: {
    all: ['address'] as const,
    list: () => [...queryKeys.address.all, 'list'] as const,
    detail: (addressID: string | number) =>
      [...queryKeys.address.all, 'detail', addressID] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: () => [...queryKeys.orders.all, 'list'] as const,
    detail: (orderID: string | number) => [...queryKeys.orders.all, 'detail', orderID] as const,
  },
} as const
