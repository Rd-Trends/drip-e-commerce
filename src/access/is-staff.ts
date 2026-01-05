import type { Access } from 'payload'

import { STAFF_ROLES } from '@/lib/constants'
import { checkRole } from '@/access/utilities'

/**
 * Atomic access checker that verifies if the user has any staff role.
 * Staff roles include: admin, order-manager, content-manager
 *
 * @returns true if user has any staff role, false otherwise
 */
export const isStaff: Access = ({ req }) => {
  if (req.user) {
    return checkRole(STAFF_ROLES, req.user)
  }

  return false
}
