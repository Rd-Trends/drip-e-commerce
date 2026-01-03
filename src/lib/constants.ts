import { CountryType, CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Alphabetic A-Z',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
  { slug: 'price-in-NGN-asc', reverse: false, title: 'Price: Low to high' }, // asc
  { slug: 'price-in-NGN-desc', reverse: true, title: 'Price: High to low' },
]

export const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'NGN',
  supportedCurrencies: [
    {
      code: 'NGN',
      symbol: '₦',
      label: 'Naira',
      decimals: 2,
    },
  ],
}

export const supportedCountries: CountryType[] = [
  {
    label: 'Nigeria',
    value: 'NG',
  },
]

// roles
/**
 * User Role Constants
 * Centralized role definitions for the e-commerce platform
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  ORDER_MANAGER: 'order-manager',
  CONTENT_MANAGER: 'content-manager',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Human-readable labels for roles
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.CUSTOMER]: 'Customer',
  [USER_ROLES.ORDER_MANAGER]: 'Order Manager',
  [USER_ROLES.CONTENT_MANAGER]: 'Content Manager',
}

/**
 * Role descriptions for admin UI
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]:
    'Full system access: manage all users, orders, products, content, settings, and configurations. Can create/update/delete any resource and access all admin features.',
  [USER_ROLES.CUSTOMER]:
    'Standard customer account: browse products, manage shopping cart, place orders, view order history, save shipping addresses, and manage personal account details.',
  [USER_ROLES.ORDER_MANAGER]:
    'Order fulfillment specialist: view and manage all orders, update order statuses, process refunds, manage transactions, and access order analytics. Cannot modify products or site content.',
  [USER_ROLES.CONTENT_MANAGER]:
    'Content administration: create/edit/delete products, categories, pages, media files, and coupons. Manage site content and promotional materials. Cannot access user management or order processing.',
}

/**
 * Staff roles (non-customer roles)
 */
export const STAFF_ROLES: UserRole[] = [
  USER_ROLES.ADMIN,
  USER_ROLES.ORDER_MANAGER,
  USER_ROLES.CONTENT_MANAGER,
]
