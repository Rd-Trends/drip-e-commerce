import type { FieldAccess } from 'payload'

import { checkRole } from '@/access/utilities'
import { USER_ROLES } from '@/lib/constants/roles'

/**
 * Composite access checker for order management.
 * - Admins and staff can access all orders
 * - Customers can only access their own orders
 *
 * @returns Access control pattern
 */
export const canManageOrdersFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) {
    return checkRole([USER_ROLES.ADMIN, USER_ROLES.STAFF], user)
  }

  return false
}
