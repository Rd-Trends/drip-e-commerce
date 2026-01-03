'use client'

import type { User } from '@/payload-types'
import { USER_ROLES } from '@/lib/constants'
import { checkRole } from '@/access/utilities'
import { useUser } from './use-auth'

/**
 * Permission flags derived from user roles
 */
export interface Permissions {
  /** Full admin access - can do everything */
  isAdmin: boolean
  /** Can manage products, categories, pages, media, coupons */
  canManageContent: boolean
  /** Can manage orders, transactions, and fulfillment */
  canManageOrders: boolean
  /** Is any staff member (admin, content manager, or order manager) */
  isStaff: boolean
  /** Is a regular customer */
  isCustomer: boolean
}

/**
 * Calculate permissions based on user roles
 * @param user - Current authenticated user
 * @returns Permission flags object
 */
export const calculatePermissions = (user: User | null | undefined): Permissions => {
  if (!user) {
    return {
      isAdmin: false,
      canManageContent: false,
      canManageOrders: false,
      isStaff: false,
      isCustomer: false,
    }
  }

  const isAdmin = checkRole([USER_ROLES.ADMIN], user)
  const canManageContent = isAdmin || checkRole([USER_ROLES.CONTENT_MANAGER], user)
  const canManageOrders = isAdmin || checkRole([USER_ROLES.ORDER_MANAGER], user)
  const isStaff = isAdmin || checkRole([USER_ROLES.CONTENT_MANAGER, USER_ROLES.ORDER_MANAGER], user)
  const isCustomer = checkRole([USER_ROLES.CUSTOMER], user)

  return {
    isAdmin,
    canManageContent,
    canManageOrders,
    isStaff,
    isCustomer,
  }
}

/**
 * Hook to check user permissions based on their roles
 *
 * @example
 * const { canManageContent, canManageOrders, isAdmin } = usePermissions()
 *
 * if (canManageContent) {
 *   // Show product creation button
 * }
 *
 * @returns Permission flags and user loading state
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
