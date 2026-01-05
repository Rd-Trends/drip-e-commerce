import type { Access, FieldAccess } from 'payload'

import { USER_ROLES } from '@/lib/constants'
import { checkRole } from '@/access/utilities'

/**
 * Composite access checker for order management.
 * - Admins and order managers can access all orders
 *
 * @returns Access control pattern
 */
export const canManageOrders: Access = ({ req }) => {
  if (req.user) {
    // Admin and order managers can access all orders
    return checkRole([USER_ROLES.ADMIN, USER_ROLES.ORDER_MANAGER], req.user)
  }

  return false
}

/**
 * Field-level access for order status updates.
 * Only admin and order managers can update order status.
 */
export const canUpdateOrderStatus: FieldAccess = ({ req }) => {
  if (req.user) {
    return checkRole([USER_ROLES.ADMIN, USER_ROLES.ORDER_MANAGER], req.user)
  }

  return false
}
