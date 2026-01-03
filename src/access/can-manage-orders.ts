import type { Access, FieldAccess } from 'payload'

import { USER_ROLES } from '@/lib/constants/roles'
import { checkRole } from '@/access/utilities'
import { isDocumentOwner } from '@/access/is-document-owner'

/**
 * Composite access checker for order management.
 * - Admins and staff can access all orders
 * - Customers can only access their own orders
 *
 * @returns Access control pattern
 */
export const canManageOrders: Access = ({ req }) => {
  if (req.user) {
    // Admin and staff can access all orders
    if (checkRole([USER_ROLES.ADMIN, USER_ROLES.STAFF], req.user)) {
      return true
    }

    // Customers can only see their own orders
    return isDocumentOwner({ req })
  }

  return false
}

/**
 * Field-level access for order status updates.
 * Only admin and staff can update order status.
 */
export const canUpdateOrderStatus: FieldAccess = ({ req }) => {
  if (req.user) {
    return checkRole([USER_ROLES.ADMIN, USER_ROLES.STAFF], req.user)
  }

  return false
}
