/**
 * User Role Constants
 * Centralized role definitions for the e-commerce platform
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  STAFF: 'staff',
  CONTENT_MANAGER: 'content_manager',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Human-readable labels for roles
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.CUSTOMER]: 'Customer',
  [USER_ROLES.STAFF]: 'Staff Member',
  [USER_ROLES.CONTENT_MANAGER]: 'Content Manager',
}

/**
 * Role descriptions for admin UI
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Full access to all features and settings',
  [USER_ROLES.CUSTOMER]: 'Can browse and purchase products',
  [USER_ROLES.STAFF]: 'Can view analytics, orders, and inventory',
  [USER_ROLES.CONTENT_MANAGER]: 'Can manage products, categories, pages, media, and coupons',
}

/**
 * Staff roles (non-customer roles)
 */
export const STAFF_ROLES: UserRole[] = [
  USER_ROLES.ADMIN,
  USER_ROLES.STAFF,
  USER_ROLES.CONTENT_MANAGER,
]
