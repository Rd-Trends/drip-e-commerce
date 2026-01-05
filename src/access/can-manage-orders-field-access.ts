import type { FieldAccess } from 'payload'

import { checkRole } from '@/access/utilities'
import { USER_ROLES } from '@/lib/constants'

/**
 * Composite access checker for order management (field level).
 * - Admins and order managers can access all order fields
 * - Customers can only access their own order fields
 *
 * @returns Access control pattern
 */
export const canManageOrdersFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) {
    return checkRole([USER_ROLES.ADMIN, USER_ROLES.ORDER_MANAGER], user)
  }

  return false
}
