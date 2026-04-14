import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'
import { USER_ROLES } from '@/lib/constants'

/**
 * Atomic access checker that verifies if the user has the admin role.
 *
 * @returns true if user is an admin, false otherwise
 */
export const isAdmin: Access = ({ req }) => {
  if (req.user) {
    return checkRole([USER_ROLES.ADMIN], req.user)
  }

  return false
}
