import type { FieldAccess } from 'payload'

import { USER_ROLES } from '@/lib/constants'
import { checkRole } from '@/access/utilities'

export const customerOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) return checkRole([USER_ROLES.CUSTOMER], user)

  return false
}
