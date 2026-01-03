import type { Access } from 'payload'

import { USER_ROLES } from '@/lib/constants/roles'
import { checkRole } from '@/access/utilities'

/**
 * Composite access checker for content management.
 * Grants access to admins and content managers.
 * Used for: Products, Categories, Pages, Media, Coupons
 *
 * @returns true if user is admin or content_manager, false otherwise
 */
export const canManageContent: Access = ({ req }) => {
  if (req.user) {
    return checkRole([USER_ROLES.ADMIN, USER_ROLES.CONTENT_MANAGER], req.user)
  }

  return false
}
