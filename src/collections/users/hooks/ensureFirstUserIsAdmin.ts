import type { FieldHook } from 'payload'

import type { User } from '@/payload-types'
import { USER_ROLES } from '@/lib/constants'

// Ensure the first user created is an admin.
// 1. On create, look up total user count as cheaply as possible.
// 2. If there are no existing users, force the role to 'admin'.
// Access control for the `role` field is already handled by its `access` property
// (only admins can set it), so we only need to handle the bootstrap case here.
export const ensureFirstUserIsAdmin: FieldHook<User> = async ({ operation, req, value }) => {
  if (operation === 'create') {
    const users = await req.payload.find({ collection: 'users', depth: 0, limit: 0 })
    if (users.totalDocs === 0) {
      return USER_ROLES.ADMIN
    }
  }

  return value
}
