'use client'

import type { User } from '@/payload-types'
import { hasPermission } from '@/access/utilities'
import { PERMISSIONS, type Permission } from '@/lib/permissions'
import { useUser } from './use-auth'

/**
 * Granular permission flags derived from the user's `permissions` array.
 * The admin role bypasses all checks (hasPermission returns true for admins).
 */
export interface Permissions {
  // ── Identity ──────────────────────────────────────────────────────────────
  isAdmin: boolean
  isStaff: boolean
  isCustomer: boolean

  // ── Products ──────────────────────────────────────────────────────────────
  canReadProducts: boolean
  canWriteProducts: boolean

  // ── Categories ────────────────────────────────────────────────────────────
  canManageCategories: boolean

  // ── Pages ─────────────────────────────────────────────────────────────────
  canReadPages: boolean
  canWritePages: boolean

  // ── Media ─────────────────────────────────────────────────────────────────
  canManageMedia: boolean

  // ── Variants ──────────────────────────────────────────────────────────────
  canManageVariants: boolean

  // ── Forms ─────────────────────────────────────────────────────────────────
  canManageForms: boolean

  // ── Site globals ──────────────────────────────────────────────────────────
  canManageBanner: boolean
  canManageHeader: boolean
  canManageFooter: boolean
  canManageHome: boolean
  canManageShipping: boolean

  // ── Orders ────────────────────────────────────────────────────────────────
  canReadOrders: boolean
  canWriteOrders: boolean

  // ── Transactions ──────────────────────────────────────────────────────────
  canReadTransactions: boolean
  canWriteTransactions: boolean

  // ── Coupons ───────────────────────────────────────────────────────────────
  canReadCoupons: boolean
  canWriteCoupons: boolean

  // ── Users ─────────────────────────────────────────────────────────────────
  canViewUsers: boolean
  canManageUsers: boolean

  // ── Analytics ─────────────────────────────────────────────────────────────
  canViewAnalytics: boolean

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  canManageWhatsApp: boolean
}

/**
 * Returns a fully-resolved Permissions object for a given user.
 * All checks delegate to `hasPermission` so the admin bypass is automatic.
 */
export const calculatePermissions = (user: User | null | undefined): Permissions => {
  const check = (p: Permission) => hasPermission(user, p)

  const isAdmin = user?.role === 'admin'
  const canReadProducts = check(PERMISSIONS.PRODUCTS_READ)
  const canWriteProducts = check(PERMISSIONS.PRODUCTS_WRITE)
  const canReadOrders = check(PERMISSIONS.ORDERS_READ)
  const canWriteOrders = check(PERMISSIONS.ORDERS_WRITE)

  // isStaff: any user who has at least one non-customer permission
  const isStaff = user
    ? user.role === 'admin' || user.role === 'order-manager' || user.role === 'content-manager'
    : false
  const isCustomer = !!user && user.role === 'customer'

  return {
    isAdmin,
    isStaff,
    isCustomer,

    canReadProducts,
    canWriteProducts,

    canManageCategories: check(PERMISSIONS.CATEGORIES_MANAGE),

    canReadPages: check(PERMISSIONS.PAGES_READ),
    canWritePages: check(PERMISSIONS.PAGES_WRITE),

    canManageMedia: check(PERMISSIONS.MEDIA_MANAGE),
    canManageVariants: check(PERMISSIONS.VARIANTS_MANAGE),
    canManageForms: check(PERMISSIONS.FORMS_MANAGE),

    canManageBanner: check(PERMISSIONS.BANNER_MANAGE),
    canManageHeader: check(PERMISSIONS.HEADER_MANAGE),
    canManageFooter: check(PERMISSIONS.FOOTER_MANAGE),
    canManageHome: check(PERMISSIONS.HOME_MANAGE),
    canManageShipping: check(PERMISSIONS.SHIPPING_MANAGE),

    canReadOrders,
    canWriteOrders,

    canReadTransactions: check(PERMISSIONS.TRANSACTIONS_READ),
    canWriteTransactions: check(PERMISSIONS.TRANSACTIONS_WRITE),

    canReadCoupons: check(PERMISSIONS.COUPONS_READ),
    canWriteCoupons: check(PERMISSIONS.COUPONS_WRITE),

    canViewUsers: check(PERMISSIONS.USERS_VIEW),
    canManageUsers: check(PERMISSIONS.USERS_MANAGE),
    canViewAnalytics: check(PERMISSIONS.ANALYTICS_VIEW),
    canManageWhatsApp: check(PERMISSIONS.WHATSAPP_MANAGE),
  }
}

/**
 * React hook that exposes granular permission flags for the current user.
 *
 * @example
 * const { canWriteProducts, canReadOrders, isAdmin } = usePermissions()
 *
 * if (canWriteProducts) {
 *   // show product creation button
 * }
 */
export const usePermissions = () => {
  const { data: user, isLoading } = useUser()

  const permissions = calculatePermissions(user)

  return {
    ...permissions,
    isLoading,
    user,
  }
}
