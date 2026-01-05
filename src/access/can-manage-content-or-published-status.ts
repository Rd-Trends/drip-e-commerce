import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'
import { USER_ROLES } from '@/lib/constants'

export const canManageContentOrPublishedStatus: Access = ({ req: { user } }) => {
  if (user && checkRole([USER_ROLES.ADMIN, USER_ROLES.CONTENT_MANAGER], user)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
