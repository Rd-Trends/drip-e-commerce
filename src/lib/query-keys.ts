import { Config, Home } from '@/payload-types'
/**
 * Centralized query key management for React Query
 * This ensures consistent query invalidation and caching across the app
 */

type HomeProductSectionType = NonNullable<Home['productSections']>[number]['type']
type Global = keyof Config['globals']

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
  shippingConfig: {
    all: ['shippingConfig'] as const,
    detail: () => [...queryKeys.shippingConfig.all, 'detail'] as const,
  },

  // revalidation tags
  revalidation: {
    products: 'products' as const,
    product: (slug: string) => `product-${slug}` as const,
    categories: 'categories' as const,
    category: (slug: string) => `category-${slug}` as const,
    homeProductSections: 'home-product-sections' as const,
    homeProductSection: (type: HomeProductSectionType, categoryID?: number) =>
      categoryID
        ? `home-product-section-${type}-${categoryID}`
        : (`home-product-section-${type}` as const),
    global: (slug: Global) => `global_${slug}` as const,
  },
} as const
