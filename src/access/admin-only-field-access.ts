import type { FieldAccess } from 'payload'

import { checkRole } from '@/access/utilities'
import { USER_ROLES } from '@/lib/constants'

/**
 * Field-level access checker that restricts read/write to admins only.
 * Uses the single `role` field via the updated checkRole helper.
 */
export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) return checkRole([USER_ROLES.ADMIN], user)

  return false
}
