import type { Access } from 'payload'
import { checkRole } from '@/access/utilities'
import { USER_ROLES } from '@/lib/constants'

export const adminOnly: Access = ({ req: { user } }) => {
  if (user) return checkRole([USER_ROLES.ADMIN], user)

  return false
}
